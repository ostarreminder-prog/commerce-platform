import type {
  Agent,
  AgentChannel,
  AgentPerformancePoint,
  AgentSession,
  AgentTestCase,
  AgentToolConfig,
  AgentToolId,
  AgentVersion,
  KnowledgeSource,
  LiveSession,
  PhoneNumber,
  SessionRecord,
  StudioSummary,
  TranscriptLine,
  WhatsAppNumber,
  WorkingDay,
} from "@repo/contracts";
import { createRandom, daysAgo, minutesAgo } from "./seed";

export const AGENT_TOOL_IDS: AgentToolId[] = [
  "productSearch",
  "availability",
  "orderStatus",
  "paymentLink",
  "shippingQuote",
  "cancelOrder",
  "refund",
  "discount",
  "createTicket",
  "transfer",
];

const week = (from = "09:00", to = "23:00", friday: [string, string] | null = ["16:00", "23:00"]): WorkingDay[] =>
  Array.from({ length: 7 }, (_, day) =>
    day === 5
      ? { day, enabled: friday !== null, from: friday?.[0] ?? from, to: friday?.[1] ?? to }
      : { day, enabled: true, from, to },
  );

function tools(enabled: Partial<Record<AgentToolId, { approval?: boolean; limit?: number }>>): AgentToolConfig[] {
  return AGENT_TOOL_IDS.map((toolId) => {
    const cfg = enabled[toolId];
    return {
      toolId,
      enabled: Boolean(cfg),
      requiresApproval: cfg?.approval ?? false,
      ...(cfg?.limit !== undefined ? { limit: cfg.limit } : {}),
    };
  });
}

const inheritAll = { persona: true, knowledge: true, tools: false, workingHours: true };

type Seed = Pick<Agent, "id" | "parentId" | "name" | "description" | "channels" | "instructions"> &
  Partial<Agent>;

function agent(seed: Seed, i: number): Agent {
  const rand = createRandom(900 + i);
  const conversations = seed.status === "draft" ? 0 : rand.int(40, 1400);
  return {
    avatar: { icon: "bot", hue: 150 },
    role: seed.parentId ? "specialist" : "orchestrator",
    persona: {
      tone: "friendly",
      dialect: "najdi",
      greeting: "هلا والله! معك مساعد متجر نخلة، كيف أقدر أخدمك؟",
      language: "auto",
    },
    inheritFromParent: seed.parentId ? inheritAll : { persona: false, knowledge: false, tools: false, workingHours: false },
    tools: tools({ productSearch: {}, orderStatus: {}, transfer: {} }),
    knowledgeSourceIds: [],
    handoffRules: [],
    workingHours: week(),
    afterHoursBehavior: "message",
    status: "live",
    version: rand.int(2, 9),
    updatedAt: daysAgo(rand.int(0, 20), rand.int(9, 21)),
    stats: {
      conversations,
      resolutionRate: conversations ? 0.55 + rand.next() * 0.4 : 0,
      handoffRate: conversations ? 0.04 + rand.next() * 0.18 : 0,
      avgDurationSec: conversations ? rand.int(45, 420) : 0,
      cost: conversations * rand.int(8, 22),
    },
    ...seed,
  };
}

const rule = (
  id: string,
  targetType: "child" | "parent" | "human",
  condition: string,
  priority: number,
  targetId?: string,
) => ({ id, targetType, condition, priority, ...(targetId ? { targetId } : {}) });

const agentSeeds: Seed[] = [
  {
    id: "agt_main",
    parentId: null,
    name: "نخلة - الوكيل الرئيسي",
    avatar: { icon: "sparkles", hue: 150 },
    description: "يستقبل كل المكالمات ورسائل WhatsApp والدردشة، ويفهم طلب العميل ويحوّله للمتخصص.",
    channels: ["whatsapp", "voice", "webchat"],
    instructions:
      "رحّب بالعميل باسمه إذا كان معروف. افهم الطلب بسؤال واحد على الأكثر، ثم حوّل للوكيل المتخصص. لا تعطي معلومات عن طلب قبل التحقق من رقم الجوال.",
    tools: tools({ productSearch: {}, orderStatus: {}, transfer: {} }),
    knowledgeSourceIds: ["kn_policies", "kn_faq", "kn_site"],
    handoffRules: [
      rule("hr_1", "child", "العميل يبي يشتري أو يسأل عن منتج أو سعر", 1, "agt_sales"),
      rule("hr_2", "child", "سؤال عن طلب موجود أو شحنة أو مرتجع أو شكوى", 2, "agt_care"),
      rule("hr_3", "child", "مشكلة في الموقع أو الدفع أو التطبيق", 3, "agt_tech"),
      rule("hr_4", "human", "العميل طلب موظف صراحة", 4),
    ],
    voice: { voiceId: "v_fahad", speed: 1, pitch: 0, interruptible: true, silenceTimeoutSec: 8, maxCallMinutes: 15, recordCalls: true },
    whatsapp: { phoneNumberId: "wa_1", templates: ["order_confirmation", "shipping_update", "abandoned_cart"], replyDelaySec: 2, sendTypingIndicator: true },
  },
  {
    id: "agt_sales",
    parentId: "agt_main",
    name: "المبيعات",
    avatar: { icon: "bag", hue: 28 },
    description: "العميل يبي يشتري، يقارن بين منتجات، يسأل عن سعر أو عرض أو توفر.",
    channels: ["whatsapp", "voice", "webchat"],
    instructions: "اقترح منتجين على الأكثر في كل رد، وأرسل رابط دفع جاهز أول ما يأكد العميل.",
    tools: tools({ productSearch: {}, availability: {}, paymentLink: {}, shippingQuote: {}, discount: { limit: 10 }, transfer: {} }),
    knowledgeSourceIds: ["kn_catalog"],
    handoffRules: [
      rule("hr_5", "child", "عطور أو بخور أو دهن عود رجالي", 1, "agt_sales_men"),
      rule("hr_6", "child", "عطور أو منتجات عناية نسائية", 2, "agt_sales_women"),
      rule("hr_7", "child", "كمية أكبر من 20 قطعة أو طلب فاتورة شركة", 3, "agt_sales_bulk"),
      rule("hr_8", "parent", "السؤال ما له علاقة بالشراء", 4),
    ],
  },
  {
    id: "agt_sales_men",
    parentId: "agt_sales",
    name: "العطور الرجالية",
    avatar: { icon: "user", hue: 210 },
    description: "أسئلة عن العطور ودهن العود والبخور الرجالي، والهدايا للرجال.",
    channels: ["whatsapp", "webchat"],
    instructions: "اسأل عن المناسبة والنوتات المفضلة (خشبي، شرقي، منعش) قبل الاقتراح.",
    tools: tools({ productSearch: {}, availability: {}, paymentLink: {}, discount: { limit: 10 }, transfer: {} }),
    handoffRules: [rule("hr_9", "parent", "العميل يبي منتج من قسم ثاني", 1)],
  },
  {
    id: "agt_sales_women",
    parentId: "agt_sales",
    name: "العطور النسائية",
    avatar: { icon: "sparkles", hue: 330 },
    description: "عطور ومنتجات عناية نسائية وأطقم الهدايا.",
    channels: ["whatsapp", "webchat"],
    instructions: "رشّحي حسب المناسبة والثبات المطلوب، واذكري حجم العبوة والسعر.",
    persona: { tone: "friendly", dialect: "hijazi", greeting: "أهلين فيكِ! وش المناسبة اللي تدورين لها عطر؟", language: "auto" },
    inheritFromParent: { persona: false, knowledge: true, tools: false, workingHours: true },
    tools: tools({ productSearch: {}, availability: {}, paymentLink: {}, discount: { limit: 10 }, transfer: {} }),
    handoffRules: [rule("hr_10", "parent", "العميلة تبي منتج من قسم ثاني", 1)],
  },
  {
    id: "agt_sales_bulk",
    parentId: "agt_sales",
    name: "الطلبات الكبيرة",
    avatar: { icon: "users", hue: 260 },
    description: "طلبات بكميات كبيرة (أكثر من 20 قطعة) أو توزيعات المناسبات.",
    channels: ["whatsapp", "voice"],
    instructions: "اجمع الكمية والموعد والمدينة، واعرض خصم الكمية حسب الجدول.",
    tools: tools({ productSearch: {}, availability: {}, shippingQuote: {}, discount: { limit: 15, approval: true }, createTicket: {}, transfer: {} }),
    handoffRules: [
      rule("hr_11", "child", "العميل يمثل شركة أو جهة ويطلب فاتورة ضريبية باسم منشأة", 1, "agt_bulk_corp"),
      rule("hr_12", "human", "قيمة الطلب أكثر من 20,000 ر.س", 2),
    ],
    voice: { voiceId: "v_noura", speed: 1, pitch: 0, interruptible: true, silenceTimeoutSec: 10, maxCallMinutes: 20, recordCalls: true },
  },
  {
    id: "agt_bulk_corp",
    parentId: "agt_sales_bulk",
    name: "عملاء الشركات",
    avatar: { icon: "building", hue: 200 },
    description: "شركات ومنشآت تطلب هدايا موظفين أو عملاء بفاتورة ضريبية وعقد توريد.",
    channels: ["whatsapp", "voice"],
    instructions: "اطلب السجل التجاري والرقم الضريبي، وجهّز عرض سعر رسمي.",
    persona: { tone: "formal", dialect: "msa", greeting: "مرحباً بكم في قسم حلول الشركات لدى متجر نخلة.", language: "ar" },
    inheritFromParent: { persona: false, knowledge: true, tools: true, workingHours: false },
    workingHours: week("08:00", "17:00", null),
    afterHoursBehavior: "voicemail",
    handoffRules: [
      rule("hr_13", "child", "جهة حكومية أو طلب عبر منصة اعتماد", 1, "agt_corp_gov"),
      rule("hr_14", "human", "العميل وافق على عرض السعر", 2),
    ],
    voice: { voiceId: "v_fahad", speed: 0.95, pitch: -1, interruptible: false, silenceTimeoutSec: 12, maxCallMinutes: 30, recordCalls: true },
  },
  {
    id: "agt_corp_gov",
    parentId: "agt_bulk_corp",
    name: "الجهات الحكومية",
    avatar: { icon: "landmark", hue: 120 },
    description: "",
    channels: ["voice"],
    instructions: "",
    status: "draft",
    inheritFromParent: { persona: true, knowledge: true, tools: true, workingHours: true },
    voice: { voiceId: "v_fahad", speed: 0.95, pitch: -1, interruptible: false, silenceTimeoutSec: 12, maxCallMinutes: 30, recordCalls: true },
  },
  {
    id: "agt_care",
    parentId: "agt_main",
    name: "خدمة العملاء",
    avatar: { icon: "headset", hue: 170 },
    description: "أي سؤال عن طلب موجود: الحالة، الشحن، الاستبدال، الاسترجاع، أو شكوى.",
    channels: ["whatsapp", "voice", "webchat"],
    instructions: "تحقق من رقم الطلب أو الجوال أولاً. لا تعد بموعد توصيل غير موجود في النظام.",
    tools: tools({ orderStatus: {}, shippingQuote: {}, createTicket: {}, transfer: {} }),
    knowledgeSourceIds: ["kn_returns"],
    handoffRules: [
      rule("hr_15", "child", "وين طلبي، متى يوصل، رقم التتبع", 1, "agt_care_track"),
      rule("hr_16", "child", "استرجاع أو استبدال منتج", 2, "agt_care_returns"),
      rule("hr_17", "child", "العميل زعلان أو يشتكي من تأخير أو جودة", 3, "agt_care_complaints"),
      rule("hr_18", "parent", "العميل يبي يشتري منتج جديد", 4),
    ],
  },
  {
    id: "agt_care_track",
    parentId: "agt_care",
    name: "تتبع الطلبات",
    avatar: { icon: "truck", hue: 45 },
    description: "العميل يسأل وين طلبه أو متى يوصل أو يبي رقم التتبع.",
    channels: ["whatsapp", "voice", "webchat"],
    instructions: "اعرض آخر حالة للشحنة ورابط التتبع. إذا متأخر أكثر من يومين اعتذر وحوّل للشكاوى.",
    tools: tools({ orderStatus: {}, shippingQuote: {}, transfer: {} }),
    handoffRules: [
      rule("hr_19", "parent", "الشحنة متأخرة أكثر من يومين", 1),
      rule("hr_20", "human", "الشحنة مفقودة أو تالفة", 2),
    ],
  },
  {
    id: "agt_care_returns",
    parentId: "agt_care",
    name: "المرتجعات",
    avatar: { icon: "undo", hue: 15 },
    description: "طلبات الاسترجاع والاستبدال خلال 14 يوم من الاستلام.",
    channels: ["whatsapp", "webchat"],
    instructions: "تأكد إن المنتج خلال مدة الاسترجاع وغير مستخدم، وأنشئ طلب الاسترجاع.",
    tools: tools({ orderStatus: {}, cancelOrder: { approval: true }, refund: { approval: true, limit: 50000 }, createTicket: {}, transfer: {} }),
    handoffRules: [rule("hr_21", "human", "مبلغ الاسترداد أكثر من 500 ر.س", 1)],
  },
  {
    id: "agt_care_complaints",
    parentId: "agt_care",
    name: "الشكاوى",
    avatar: { icon: "alert", hue: 0 },
    description: "العميل منزعج أو عنده شكوى عن التأخير أو الجودة أو التعامل.",
    channels: ["whatsapp", "voice", "webchat"],
    instructions: "اعتذر بصدق، لخّص المشكلة، وأنشئ تذكرة. لا تجادل العميل.",
    persona: { tone: "formal", dialect: "najdi", greeting: "حياك الله، نعتذر عن أي إزعاج. وش اللي صار؟", language: "auto" },
    inheritFromParent: { persona: false, knowledge: true, tools: false, workingHours: true },
    tools: tools({ orderStatus: {}, createTicket: {}, discount: { limit: 15, approval: true }, transfer: {} }),
    handoffRules: [rule("hr_22", "human", "العميل طلب مدير أو تكررت الشكوى", 1)],
    afterHoursBehavior: "human",
    workingHours: week("10:00", "22:00"),
  },
  {
    id: "agt_tech",
    parentId: "agt_main",
    name: "الدعم الفني",
    avatar: { icon: "wrench", hue: 230 },
    description: "مشاكل الدفع أو تسجيل الدخول أو الموقع والتطبيق.",
    channels: ["voice", "webchat"],
    instructions: "اطلب صورة للخطأ إن أمكن، وجرّب الحلول المعروفة قبل التحويل.",
    status: "paused",
    tools: tools({ createTicket: {}, transfer: {} }),
    knowledgeSourceIds: ["kn_tech"],
    handoffRules: [
      rule("hr_23", "human", "مشكلة دفع خُصم فيها المبلغ ولم يُنشأ الطلب", 1),
      rule("hr_24", "parent", "السؤال ما هو تقني", 2),
    ],
    voice: { voiceId: "v_noura", speed: 1.05, pitch: 0, interruptible: true, silenceTimeoutSec: 8, maxCallMinutes: 10, recordCalls: false },
  },
];

export const agentTree: Agent[] = agentSeeds.map(agent);

export const knowledgeSources: KnowledgeSource[] = [
  { id: "kn_policies", type: "policy", title: "سياسة الشحن والاسترجاع", file: null, url: null, faq: [], status: "ready", chunksCount: 18, usedByAgentIds: ["agt_main", "agt_care"], lastSyncedAt: daysAgo(12), autoSync: true },
  { id: "kn_faq", type: "faq", title: "الأسئلة الشائعة", file: null, url: null, faq: [{ q: "كم مدة التوصيل؟", a: "من 1 إلى 3 أيام عمل داخل المدن الرئيسية." }, { q: "هل العطور أصلية؟", a: "كل منتجاتنا أصلية ومن الموزع المعتمد." }, { q: "هل فيه تغليف هدايا؟", a: "نعم، مجاناً لأي طلب فوق 300 ر.س." }], status: "ready", chunksCount: 48, usedByAgentIds: ["agt_main"], lastSyncedAt: daysAgo(3), autoSync: false },
  { id: "kn_site", type: "url", title: "صفحات المتجر", file: null, url: "https://nakhla.sa/pages", faq: [], status: "ready", chunksCount: 32, usedByAgentIds: ["agt_main"], lastSyncedAt: daysAgo(1), autoSync: true },
  { id: "kn_catalog", type: "product_catalog", title: "كتالوج المنتجات", file: null, url: null, faq: [], status: "ready", chunksCount: 120, usedByAgentIds: ["agt_sales"], lastSyncedAt: daysAgo(0), autoSync: true },
  { id: "kn_returns", type: "faq", title: "أسئلة الاسترجاع والاستبدال", file: null, url: null, faq: [{ q: "كم مدة الاسترجاع؟", a: "7 أيام من الاستلام والمنتج مغلف." }], status: "ready", chunksCount: 21, usedByAgentIds: ["agt_care_returns"], lastSyncedAt: daysAgo(9), autoSync: false },
  { id: "kn_notes", type: "file", title: "دليل النوتات العطرية.pdf", file: { name: "دليل النوتات العطرية.pdf", sizeBytes: 1_240_000 }, url: null, faq: [], status: "ready", chunksCount: 64, usedByAgentIds: ["agt_sales"], lastSyncedAt: daysAgo(6), autoSync: false },
  { id: "kn_tech", type: "url", title: "مركز المساعدة", file: null, url: "https://help.nakhla.sa", faq: [], status: "failed", chunksCount: 0, usedByAgentIds: ["agt_tech"], lastSyncedAt: daysAgo(15), autoSync: true },
];

export const agentVoices = [
  { id: "v_fahad", name: "فهد", gender: "male", dialect: "najdi" },
  { id: "v_noura", name: "نورة", gender: "female", dialect: "najdi" },
  { id: "v_majed", name: "ماجد", gender: "male", dialect: "hijazi" },
  { id: "v_reem", name: "ريم", gender: "female", dialect: "gulf" },
] as const;

export const agentVersions: AgentVersion[] = agentTree.flatMap((a) =>
  Array.from({ length: Math.min(a.version, 4) }, (_, k) => {
    const version = a.version - k;
    const changes =
      k === 0
        ? [{ field: "instructions", before: a.instructions.replace(/،[^،]*$/, ""), after: a.instructions }]
        : k === 1
          ? [
              { field: "tone", before: "formal", after: a.persona.tone },
              { field: "handoffRules", before: String(Math.max(a.handoffRules.length - 1, 0)), after: String(a.handoffRules.length) },
            ]
          : [{ field: "greeting", before: "أهلاً، كيف أخدمك؟", after: a.persona.greeting }];
    return {
      id: `${a.id}_v${version}`,
      agentId: a.id,
      version,
      publishedAt: daysAgo(k * 6 + 1, 10 + k),
      author: k % 2 ? "ريم الشهري" : "خالد العتيبي",
      note: ["تحسين التعليمات", "إضافة قاعدة تحويل", "تعديل رسالة الترحيب", "النسخة الأولى"][k] ?? "",
      changes,
    };
  }),
);

/** Deterministic daily series for an agent, optionally filtered to one channel. */
export function agentPerformance(agentId: string, channel: AgentChannel | "all", days: number): AgentPerformancePoint[] {
  const a = agentTree.find((x) => x.id === agentId);
  const seed = [...agentId, ...channel].reduce((s, c) => s + c.charCodeAt(0), days);
  const rand = createRandom(seed);
  const share = channel === "all" ? 1 : channel === "whatsapp" ? 0.55 : channel === "voice" ? 0.3 : 0.15;
  const base = ((a?.stats.conversations ?? 0) / 30) * share;
  return Array.from({ length: days }, (_, i) => {
    const conversations = Math.max(0, Math.round(base * (0.6 + rand.next() * 0.8)));
    return {
      date: daysAgo(days - 1 - i),
      conversations,
      resolutionRate: conversations ? Math.min(0.98, (a?.stats.resolutionRate ?? 0.7) + (rand.next() - 0.5) * 0.12) : 0,
      handoffRate: conversations ? Math.max(0.01, (a?.stats.handoffRate ?? 0.1) + (rand.next() - 0.5) * 0.06) : 0,
      avgDurationSec: conversations ? Math.round((a?.stats.avgDurationSec ?? 120) * (0.8 + rand.next() * 0.4)) : 0,
      cost: conversations * rand.int(8, 22),
    };
  });
}

export const studioSummary: StudioSummary = {
  conversationsToday: 486,
  conversationsDelta: 0.12,
  callsToday: 137,
  callsDelta: 0.31,
  resolutionRate: 0.82,
  resolutionDelta: 0.03,
  humanHandoffRate: 0.09,
  handoffDelta: -0.02,
  costToday: 41250,
  costDelta: 0.08,
};

export const agentTestCases: AgentTestCase[] = [
  { id: "tc_1", question: "وين طلبي رقم 10234؟", expected: "يعرض حالة الشحنة ورابط التتبع", expectedAgentId: "agt_care_track", channel: "whatsapp", lastResult: "pass" },
  { id: "tc_2", question: "أبغى عطر عود رجالي ثابت للمناسبات", expected: "يقترح عطرين رجاليين مع السعر", expectedAgentId: "agt_sales_men", channel: "whatsapp", lastResult: "pass" },
  { id: "tc_3", question: "أبي أرجع منتج استلمته أمس", expected: "يتحقق من المدة وينشئ طلب استرجاع", expectedAgentId: "agt_care_returns", channel: "webchat", lastResult: "pass" },
  { id: "tc_4", question: "نبي 200 علبة هدايا لموظفين الشركة بفاتورة", expected: "يحوّل لعملاء الشركات ويطلب السجل التجاري", expectedAgentId: "agt_bulk_corp", channel: "voice", lastResult: "fail", lastAnswer: "حوّل لوكيل الطلبات الكبيرة فقط" },
  { id: "tc_5", question: "طلبي متأخر أسبوع وما أحد رد علي!", expected: "يعتذر وينشئ تذكرة شكوى", expectedAgentId: "agt_care_complaints", channel: "whatsapp", lastResult: "pass" },
  { id: "tc_6", question: "الدفع بمدى ما يشتغل عندي", expected: "يحوّل للدعم الفني", expectedAgentId: "agt_tech", channel: "webchat", lastResult: null },
];

const line = (id: string, speaker: TranscriptLine["speaker"], text: string, atSec: number, agentId?: string): TranscriptLine => ({
  id,
  speaker,
  text,
  atSec,
  ...(agentId ? { agentId } : {}),
});

const scripts: { channel: AgentChannel; name: string; phone: string; path: string[]; lines: [TranscriptLine["speaker"], string, string?][] }[] = [
  {
    channel: "voice",
    name: "عبدالله القحطاني",
    phone: "0551234870",
    path: ["agt_main", "agt_care", "agt_care_track"],
    lines: [
      ["agent", "هلا والله! معك مساعد متجر نخلة، كيف أقدر أخدمك؟", "agt_main"],
      ["customer", "السلام عليكم، طلبي من ثلاث أيام وما وصل"],
      ["agent", "وعليكم السلام، أبشر. بحوّلك لخدمة العملاء يتابعون معك.", "agt_main"],
      ["agent", "حياك، عطني رقم الطلب أو رقم الجوال المسجل.", "agt_care"],
      ["customer", "الرقم 10234"],
      ["agent", "شكراً، بحوّلك لتتبع الطلبات.", "agt_care"],
      ["agent", "طلبك مع سمسا الحين في الرياض، ومتوقع يوصلك بكرة قبل الساعة 6 المغرب.", "agt_care_track"],
      ["customer", "طيب ممكن ترسل لي رابط التتبع واتساب؟"],
      ["agent", "أكيد، أرسلته لك الحين. تبي شي ثاني؟", "agt_care_track"],
      ["customer", "لا شكراً، يعطيك العافية"],
      ["agent", "الله يعافيك، نورتنا!", "agt_care_track"],
    ],
  },
  {
    channel: "whatsapp",
    name: "سارة الغامدي",
    phone: "0509876123",
    path: ["agt_main", "agt_sales", "agt_sales_women"],
    lines: [
      ["customer", "مساء الخير، أبي عطر هدية لأختي"],
      ["agent", "مساء النور! بحوّلك لقسم المبيعات.", "agt_main"],
      ["agent", "أهلين! الهدية لمناسبة معينة؟", "agt_sales"],
      ["customer", "تخرجها، تحب الريحة الناعمة"],
      ["agent", "أهلين فيكِ! أرشح لك مسك الورد (185 ر.س) أو عطر ياسمين نجد (240 ر.س)، والاثنين ثباتهم ممتاز.", "agt_sales_women"],
      ["customer", "ياسمين نجد حلو، فيه تغليف هدية؟"],
      ["agent", "إيه، التغليف مجاني. أرسل لك رابط الدفع؟", "agt_sales_women"],
      ["customer", "إيه تمام"],
      ["agent", "هذا رابط الدفع: nakhla.sa/pay/8F2K. يوصلك خلال يومين.", "agt_sales_women"],
    ],
  },
  {
    channel: "voice",
    name: "شركة الأفق للمقاولات",
    phone: "0114567890",
    path: ["agt_main", "agt_sales", "agt_sales_bulk", "agt_bulk_corp"],
    lines: [
      ["agent", "هلا والله! معك مساعد متجر نخلة، كيف أقدر أخدمك؟", "agt_main"],
      ["customer", "نبي هدايا لموظفينا بمناسبة اليوم الوطني، تقريباً 300 قطعة"],
      ["agent", "أبشر، بحوّلك للمبيعات.", "agt_main"],
      ["agent", "كمية كبيرة، بحوّلك لقسم الطلبات الكبيرة.", "agt_sales"],
      ["agent", "حياكم. تحتاجون فاتورة ضريبية باسم المنشأة؟", "agt_sales_bulk"],
      ["customer", "إيه، وعقد توريد لو ممكن"],
      ["agent", "مرحباً بكم في قسم حلول الشركات. نحتاج السجل التجاري والرقم الضريبي لتجهيز عرض السعر.", "agt_bulk_corp"],
      ["customer", "بنرسلها على الإيميل"],
      ["agent", "ممتاز، سيصلكم عرض السعر خلال 24 ساعة على البريد المسجل.", "agt_bulk_corp"],
    ],
  },
  {
    channel: "whatsapp",
    name: "فيصل الدوسري",
    phone: "0543219876",
    path: ["agt_main", "agt_care", "agt_care_complaints"],
    lines: [
      ["customer", "ثالث مرة أكلمكم والطلب ما وصل!!"],
      ["agent", "نعتذر جداً، بحوّلك لخدمة العملاء الحين.", "agt_main"],
      ["agent", "حياك الله، نعتذر عن أي إزعاج. وش رقم الطلب؟", "agt_care_complaints"],
      ["customer", "10198 وصار له أسبوع"],
      ["agent", "شفت الطلب، فيه تأخير من شركة الشحن. أنشأت لك تذكرة أولوية عالية.", "agt_care_complaints"],
      ["customer", "ما أبي تذكرة أبي أكلم أحد"],
      ["agent", "أبشر، أحوّلك لموظف خدمة العملاء الحين.", "agt_care_complaints"],
    ],
  },
  {
    channel: "webchat",
    name: "نوف العنزي",
    phone: "0567788990",
    path: ["agt_main", "agt_care", "agt_care_returns"],
    lines: [
      ["customer", "هلا، أبي أرجع البخور اللي طلبته"],
      ["agent", "هلا فيك! بحوّلك لخدمة العملاء.", "agt_main"],
      ["agent", "أبشري، بحوّلك لقسم المرتجعات.", "agt_care"],
      ["agent", "متى استلمتي الطلب؟ وهل العلبة مفتوحة؟", "agt_care_returns"],
      ["customer", "استلمته قبل 3 أيام وما فتحته"],
      ["agent", "تمام، أنشأت طلب استرجاع. المندوب يمر عليك خلال يومين، والمبلغ يرجع خلال 5 أيام عمل.", "agt_care_returns"],
    ],
  },
  {
    channel: "voice",
    name: "محمد الشمري",
    phone: "0532211445",
    path: ["agt_main", "agt_sales", "agt_sales_men"],
    lines: [
      ["agent", "هلا والله! معك مساعد متجر نخلة، كيف أقدر أخدمك؟", "agt_main"],
      ["customer", "أبي دهن عود كمبودي أصلي"],
      ["agent", "أبشر، أحوّلك لقسم المبيعات.", "agt_main"],
      ["agent", "أحوّلك لقسم العطور الرجالية.", "agt_sales"],
      ["agent", "عندنا دهن عود كمبودي ملكي، تولة بـ 450 ريال. تبيه لنفسك ولا هدية؟", "agt_sales_men"],
      ["customer", "لنفسي، فيه أصغر؟"],
      ["agent", "فيه نص تولة بـ 240 ريال. أرسل لك رابط الدفع على جوالك؟", "agt_sales_men"],
    ],
  },
];

function toTranscript(sessionId: string, s: (typeof scripts)[number], gap: number): TranscriptLine[] {
  return s.lines.map(([speaker, text, agentId], i) => line(`${sessionId}_l${i}`, speaker, text, i * gap, agentId));
}

export const liveSessions: LiveSession[] = scripts.slice(0, 5).map((s, i) => {
  const id = `live_${i + 1}`;
  const all = toTranscript(id, s, s.channel === "voice" ? 9 : 25);
  const shown = Math.max(3, all.length - 3 - (i % 2));
  const transcript = all.slice(0, shown);
  const lastAgent = [...transcript].reverse().find((l) => l.agentId)?.agentId ?? "agt_main";
  const path = s.path.slice(0, s.path.indexOf(lastAgent) + 1);
  return {
    id,
    channel: s.channel,
    customerName: s.name,
    customerPhone: s.phone,
    agentPath: path,
    startedAt: minutesAgo(Math.ceil((transcript.at(-1)?.atSec ?? 0) / 60) + 1),
    durationSec: (transcript.at(-1)?.atSec ?? 0) + 6,
    transcript,
    upcoming: all.slice(shown),
    state: (["speaking", "waiting", "speaking", "transferring", "waiting"] as const)[i] ?? "waiting",
    sentiment: [0.4, 0.7, 0.2, -0.8, 0.1][i] ?? 0,
    stuck: i === 4,
    takenOver: false,
  };
});

const outcomes: SessionRecord["outcome"][] = ["resolved", "resolved", "handedOff", "resolved", "dropped", "resolved"];
const summaries = [
  "استفسر العميل عن طلب متأخر، وأُرسل له رابط التتبع وموعد التوصيل المتوقع.",
  "اشترت العميلة عطر ياسمين نجد كهدية مع تغليف مجاني عبر رابط دفع.",
  "شركة تطلب 300 هدية لليوم الوطني، وطُلب السجل التجاري لتجهيز عرض سعر رسمي.",
  "شكوى تأخير متكررة، أُنشئت تذكرة أولوية عالية ثم حُوّل العميل لموظف.",
  "طلب استرجاع بخور خلال مدة الاسترجاع، وانقطعت المحادثة قبل تأكيد الموعد.",
  "سأل العميل عن دهن عود كمبودي واختار نص تولة.",
];

export const sessionHistory: SessionRecord[] = Array.from({ length: 24 }, (_, i) => {
  const s = scripts[i % scripts.length] as (typeof scripts)[number];
  const id = `ses_${String(240 - i)}`;
  const rand = createRandom(4400 + i);
  const transcript = toTranscript(id, s, s.channel === "voice" ? rand.int(7, 11) : rand.int(20, 60));
  const outcome = i % scripts.length === 3 ? "handedOff" : (outcomes[i % outcomes.length] ?? "resolved");
  const actions: SessionRecord["actions"] = [];
  if (s.path.includes("agt_care_track")) actions.push({ toolId: "orderStatus", label: "#10234", result: "مع شركة الشحن" });
  if (s.path.some((p) => p.startsWith("agt_sales"))) actions.push({ toolId: "productSearch", label: "عطور", result: "4 نتائج" }, { toolId: "paymentLink", label: "nakhla.sa/pay/8F2K", result: "أُرسل" });
  if (s.path.includes("agt_care_returns")) actions.push({ toolId: "cancelOrder", label: "#10211", result: "طلب استرجاع" });
  if (s.path.includes("agt_care_complaints") || s.path.includes("agt_bulk_corp")) actions.push({ toolId: "createTicket", label: "TCK-" + (3100 + i), result: "مفتوحة" });
  const base: AgentSession = {
    id,
    channel: s.channel,
    customerName: s.name,
    customerPhone: s.phone,
    agentPath: s.path,
    startedAt: minutesAgo(30 + i * rand.int(35, 80)),
    durationSec: (transcript.at(-1)?.atSec ?? 0) + rand.int(4, 12),
    transcript,
  };
  return {
    ...base,
    outcome,
    cost: transcript.length * rand.int(6, 14) + (s.channel === "voice" ? 120 : 0),
    rating: outcome === "dropped" ? null : rand.weighted([[5, 6], [4, 3], [3, 1], [2, 1]] as const),
    summary: summaries[i % summaries.length] ?? "",
    actions,
    ticketId: actions.find((a) => a.toolId === "createTicket")?.label ?? null,
  };
});

export const phoneNumbers: PhoneNumber[] = [
  { id: "ph_1", number: "920012345", provider: "STC", agentId: "agt_main", status: "active", callsToday: 112 },
  { id: "ph_2", number: "0114567000", provider: "Mobily", agentId: "agt_bulk_corp", status: "active", callsToday: 19 },
  { id: "ph_3", number: "0559001122", provider: "Zain", agentId: null, status: "pending", callsToday: 0 },
];

export const whatsappNumbers: WhatsAppNumber[] = [
  { id: "wa_1", number: "966551110000", displayName: "متجر نخلة", status: "connected", quality: "high", agentId: "agt_main", dailyLimit: 10000, templates: ["order_confirmation", "shipping_update", "abandoned_cart", "review_request"] },
  { id: "wa_2", number: "966551110001", displayName: "نخلة للشركات", status: "connected", quality: "medium", agentId: "agt_bulk_corp", dailyLimit: 1000, templates: ["quote_ready"] },
  { id: "wa_3", number: "966551110002", displayName: "نخلة - الدعم", status: "pending", quality: "low", agentId: null, dailyLimit: 250, templates: [] },
];
