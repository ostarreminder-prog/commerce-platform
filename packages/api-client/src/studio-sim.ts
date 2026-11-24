import type { AgentToolId, SimulatedTurn, TraceStep } from "@repo/contracts";
import { commerceDb, db, findAgent } from "./studio-state";

/* Conversation simulation for the test lab — scripted routes first; when no
 * route matches, a linked knowledge source answers before the generic
 * clarify reply (split out of studio.ts — file-size guideline). */

const routes: { test: RegExp; path: string[]; tools: AgentToolId[]; reply: string }[] = [
  { test: /شرك|منشأ|فاتور|موظفين/, path: ["agt_main", "agt_sales", "agt_sales_bulk", "agt_bulk_corp"], tools: ["productSearch", "createTicket"], reply: "مرحباً بكم في قسم حلول الشركات. نحتاج السجل التجاري والرقم الضريبي، وسيصلكم عرض السعر خلال 24 ساعة." },
  { test: /\d{2,}\s*(قطع|علب|حب)|كمي|توزيع/, path: ["agt_main", "agt_sales", "agt_sales_bulk"], tools: ["availability", "shippingQuote"], reply: "أبشر، الكمية متوفرة. وش المدينة وموعد التسليم عشان أحسب لك الشحن وخصم الكمية؟" },
  { test: /متأخر|زعلان|شكو|ما أحد رد|!!/, path: ["agt_main", "agt_care", "agt_care_complaints"], tools: ["orderStatus", "createTicket"], reply: "حياك الله، نعتذر عن أي إزعاج. أنشأت لك تذكرة أولوية عالية برقم TCK-3188 وبيتواصل معك موظف خلال ساعة." },
  { test: /أرجع|ارجع|استرج|استبدال|بدّل|بدل/, path: ["agt_main", "agt_care", "agt_care_returns"], tools: ["orderStatus", "cancelOrder"], reply: "الطلب خلال مدة الاسترجاع (14 يوم). أنشأت طلب استرجاع، والمندوب يمر عليك خلال يومين." },
  { test: /وين|يوصل|تتبع|شحن|طلبي/, path: ["agt_main", "agt_care", "agt_care_track"], tools: ["orderStatus"], reply: "طلبك #10234 مع سمسا في الرياض، ومتوقع يوصلك بكرة قبل 6 المغرب. هذا رابط التتبع: smsa.sa/t/88231" },
  { test: /دفع|مدى|ما يشتغل|التطبيق|الموقع|خطأ/, path: ["agt_main", "agt_tech"], tools: ["createTicket"], reply: "جرّب تحدّث الصفحة وتتأكد من تفعيل الشراء الإلكتروني في بطاقة مدى. إذا استمرت المشكلة أرسل لي صورة الخطأ." },
  { test: /نسائ|أختي|اختي|أمي|امي|زوجتي|بنت/, path: ["agt_main", "agt_sales", "agt_sales_women"], tools: ["productSearch", "availability"], reply: "أرشح لك مسك الورد (185 ر.س) أو ياسمين نجد (240 ر.س)، والاثنين ثباتهم ممتاز والتغليف مجاني." },
  { test: /رجال|عود|بخور|دهن/, path: ["agt_main", "agt_sales", "agt_sales_men"], tools: ["productSearch", "availability"], reply: "عندنا دهن عود كمبودي ملكي (450 ر.س للتولة) وعطر عود نجد (320 ر.س). أرسل لك رابط الدفع لأحدهم؟" },
  { test: /سعر|عطر|ابي|أبي|أبغى|ابغى|عرض|خصم/, path: ["agt_main", "agt_sales"], tools: ["productSearch"], reply: "أبشر! العطر لك ولا هدية؟ وتحب الروائح الخشبية ولا المنعشة؟" },
];

const toolResults: Record<AgentToolId, string> = {
  productSearch: "4 منتجات مطابقة",
  availability: "متوفر (32 قطعة)",
  orderStatus: "#10234 · مع شركة الشحن",
  paymentLink: "nakhla.sa/pay/8F2K",
  shippingQuote: "25.00 ر.س · يومين",
  cancelOrder: "طلب استرجاع RMA-551",
  refund: "بانتظار موافقة موظف",
  discount: "10%",
  createTicket: "TCK-3188",
  transfer: "تم",
};

/* Answers a free question from the knowledge sources linked to an agent —
 * faq entries are matched on word overlap so newly added sources actually
 * change what the agent answers in the test lab (no canned response). */
const knowledgeAnswer = (agentId: string, text: string): { reply: string; sourceId: string } | null => {
  const agent = db.agents.find((a) => a.id === agentId);
  if (!agent) return null;
  const words = text.replace(/[أإآ]/g, "ا").toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  if (!words.length) return null;
  /* Links exist in both directions: the studio tab writes
   * agent.knowledgeSourceIds, the /knowledge page writes source.usedByAgentIds —
   * honour both so a source linked from either surface reaches the agent. */
  const linked = commerceDb.knowledge.filter(
    (s) => s.status === "ready" && (agent.knowledgeSourceIds.includes(s.id) || s.usedByAgentIds.includes(agentId)),
  );
  for (const s of linked) {
    const hit = s.faq.find((f) => words.some((w) => f.q.includes(w) || f.a.includes(w)));
    if (hit) return { reply: hit.a, sourceId: s.id };
  }
  return null;
};

export function simulate(text: string): SimulatedTurn {
  const route = routes.find((r) => r.test.test(text));
  const steps: TraceStep[] = [];
  let t = 0;
  const step = (s: Omit<TraceStep, "id" | "atMs">, gap: number) => {
    t += gap;
    steps.push({ id: `st_${steps.length}`, atMs: t, ...s });
  };
  step({ kind: "received", agentId: "agt_main", cost: 2 }, 0);
  if (!route) {
    /* No scripted route — try linked knowledge sources (main agent, then any
     * live sub-agent) before the generic clarify answer. */
    const candidates = ["agt_main", ...db.agents.filter((a) => a.parentId === "agt_main" && a.status === "live").map((a) => a.id)];
    for (const agentId of candidates) {
      const kn = knowledgeAnswer(agentId, text);
      if (kn) {
        const path = agentId === "agt_main" ? ["agt_main"] : ["agt_main", agentId];
        if (agentId !== "agt_main") step({ kind: "handoff", agentId: "agt_main", targetId: agentId, reason: kn.sourceId, cost: 3 }, 600);
        step({ kind: "reply", agentId, cost: 5 }, 800);
        return { reply: kn.reply, path, steps };
      }
    }
    step({ kind: "reply", agentId: "agt_main", cost: 4 }, 900);
    return { reply: "هلا والله! وضّح لي أكثر: تبي تشتري منتج، ولا عندك سؤال عن طلب موجود؟", path: ["agt_main"], steps };
  }
  const path = ["agt_main"];
  for (let i = 1; i < route.path.length; i++) {
    const from = findAgent(route.path[i - 1] as string);
    const to = db.agents.find((a) => a.id === route.path[i]);
    if (!to) break;
    if (to.status === "paused") {
      step({ kind: "handoff", agentId: from.id, reason: `«${to.name}» متوقف، حُوّل لموظف بشري`, cost: 3 }, 700);
      step({ kind: "reply", agentId: from.id, cost: 4 }, 500);
      return { reply: "أحولك الحين لأحد موظفينا يساعدك، لحظات من فضلك.", path, steps };
    }
    const rule = from.handoffRules.find((r) => r.targetId === to.id);
    step({ kind: "handoff", agentId: from.id, targetId: to.id, reason: rule?.condition ?? to.description, cost: 3 }, 600 + i * 150);
    path.push(to.id);
  }
  const last = path.at(-1) as string;
  for (const toolId of route.tools) step({ kind: "tool", agentId: last, toolId, result: toolResults[toolId], cost: 5 }, 450);
  step({ kind: "reply", agentId: last, cost: 6 }, 800);
  return { reply: route.reply, path, steps };
}
