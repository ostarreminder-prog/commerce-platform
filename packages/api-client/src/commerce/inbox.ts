import type { Conversation, KnowledgeSource, Message } from "@repo/contracts";
import { spec } from "@repo/mocks";
import type { ConversationMessageInput, NewConversationInput } from "./types";
import { SYSTEM, audit, db, find, guard, me, pushMessage, respond, uid } from "./db";
import { approvalsApi, knowledgeApi } from "./governance";

/** Shape returned by conversations.suggestReply — draft + the evidence the agent used. */
export interface SuggestedReply {
  draft: string;
  /** Retrieval trail shown for attribution (matched product / knowledge source). */
  sources: { type: "product" | "knowledge"; id: string; label: string }[];
}

export const inboxApi = {
  conversations: {
    list: () => respond<Conversation[]>(db.conversations),
    get: (id: string) => guard<Conversation>(() => find(db.conversations, id, "conversation")),
    /* Public contact form (`/contact`) — opens a real webchat conversation in
     * the inbox queue (open_ai so the support agent picks it up) with the
     * customer's message as the first message. Links the matched customer
     * record and an optional order reference. */
    create: (input: NewConversationInput) => guard<Conversation>(() => {
      if (!input.message.trim()) throw new Error("message_required");
      if (!input.phone.trim()) throw new Error("phone_required");
      const customer = db.customers.find((x) => x.phone === input.phone.trim()) ?? null;
      const orderId = input.orderId ?? null;
      if (orderId) find(db.orders, orderId, "order");
      const c: Conversation = {
        id: uid("cnv"), channel: "webchat", customerId: customer?.id ?? null,
        contact: { phone: input.phone.trim(), name: input.name.trim() || null },
        status: "open_ai", currentAgentId: "agt_main", agentPath: ["agt_main"], assigneeId: null,
        priority: "normal", tags: ["contact-form"], sentiment: "neutral", aiSummary: "",
        relatedOrderIds: orderId ? [orderId] : [], waitingSince: null, rating: null, messages: [],
        updatedAt: new Date().toISOString(),
      };
      pushMessage(c, { type: "text", content: input.message.trim(), attachments: [], toolCalls: [], deliveryStatus: "sent", ref: null, from: { type: "customer", id: customer?.id ?? "guest", name: input.name.trim() || "زائر" } });
      db.conversations.unshift(c);
      audit("conversation.created", { type: "conversation", id: c.id, label: c.contact.name ?? c.contact.phone }, [{ field: "channel", from: null, to: "webchat" }]);
      return c;
    }),
    sendMessage: (id: string, input: ConversationMessageInput) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      const base = { attachments: [], toolCalls: [], ref: null as Message["ref"], deliveryStatus: input.type === "internal_note" ? null : ("sent" as const) };
      if (input.type === "product_card") {
        find(db.products, input.productId, "product");
        pushMessage(c, { ...base, type: "product_card", content: "", ref: { type: "product", id: input.productId }, from: me() });
      } else if (input.type === "payment_link") {
        const ref = input.orderId ? { type: "order" as const, id: input.orderId } : null;
        pushMessage(c, { ...base, type: "payment_link", content: "", toolCalls: [{ tool: "paymentLink", input: input.orderId ?? "cart", output: `nakhla.sa/pay/${uid("pl").slice(-4).toUpperCase()}` }], ref, from: me() });
      } else if (input.type === "image" || input.type === "document") {
        pushMessage(c, { ...base, type: input.type, content: input.content ?? "", attachments: input.attachments, from: me() });
      } else {
        pushMessage(c, { ...base, type: input.type, content: "content" in input ? (input.content ?? "") : "", from: me() });
      }
      if (c.status === "open_ai" && input.type !== "internal_note") {
        c.status = "open_human";
        c.assigneeId = spec.currentStaff.id;
      }
      return c;
    }),
    takeOver: (id: string) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      c.status = "open_human";
      c.assigneeId = spec.currentStaff.id;
      c.currentAgentId = null;
      c.waitingSince = null;
      pushMessage(c, { type: "system", content: "takeover", attachments: [], toolCalls: [], deliveryStatus: null, ref: null, from: SYSTEM });
      return c;
    }),
    returnToAgent: (id: string) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      const agentId = c.agentPath.at(-1) ?? "agt_main";
      c.status = "open_ai";
      c.assigneeId = null;
      c.currentAgentId = agentId;
      pushMessage(c, { type: "system", content: "returned_to_agent", attachments: [], toolCalls: [], deliveryStatus: null, ref: null, from: me() });
      return c;
    }),
    /** `open_human` reopens a resolved/closed thread back to the assignee flow. */
    setStatus: (id: string, status: "resolved" | "closed" | "open_human") => guard(() => {
      const c = find(db.conversations, id, "conversation");
      if (status === "open_human" && c.status !== "resolved" && c.status !== "closed") throw new Error("invalid_transition");
      c.status = status;
      c.waitingSince = null;
      if (status === "open_human") c.assigneeId = c.assigneeId ?? spec.currentStaff.id;
      pushMessage(c, { type: "system", content: status === "open_human" ? "reopened" : status, attachments: [], toolCalls: [], deliveryStatus: null, ref: null, from: me() });
      return c;
    }),
    assign: (id: string, staffId: string | null) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      if (staffId) find(db.staff, staffId, "staff");
      c.assigneeId = staffId;
      if (staffId && c.status === "open_ai") c.status = "open_human";
      return c;
    }),
    setPriority: (id: string, priority: Conversation["priority"]) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      c.priority = priority;
      return c;
    }),
    addTag: (id: string, tag: string) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      if (!c.tags.includes(tag)) c.tags.push(tag);
      return c;
    }),
    /* Link/unlink context records — the thread sidebar shows these. */
    linkOrder: (id: string, orderId: string | null) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      if (orderId) find(db.orders, orderId, "order");
      c.relatedOrderIds = orderId
        ? [...new Set([...c.relatedOrderIds, orderId])]
        : [];
      return c;
    }),
    unlinkOrder: (id: string, orderId: string) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      c.relatedOrderIds = c.relatedOrderIds.filter((x) => x !== orderId);
      return c;
    }),
    linkCustomer: (id: string, customerId: string | null) => guard(() => {
      const c = find(db.conversations, id, "conversation");
      const cust = customerId ? find(db.customers, customerId, "customer") : null;
      c.customerId = cust?.id ?? null;
      if (cust && !c.contact.name) c.contact.name = cust.name;
      return c;
    }),
    /* Smart-reply draft (§5.14): the agent identifies the mentioned product,
     * retrieves matching knowledge chunks and drafts a reply — the staff member
     * reviews/edits and sends it explicitly (never auto-sent). */
    suggestReply: (id: string) => guard<SuggestedReply>(() => {
      const c = find(db.conversations, id, "conversation");
      const lastCustomer = [...c.messages].reverse().find((m) => m.from.type === "customer" && m.type === "text");
      const question = (lastCustomer?.content ?? "").trim();
      const norm = (s: string) => s.replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").toLowerCase();
      const qn = norm(question);
      /* 1 · identify the product the customer is asking about. */
      const product = db.products.find((p) => p.status !== "archived" && norm(p.name.ar).split(/\s+/).some((w) => w.length > 3 && qn.includes(w)));
      /* 2 · retrieve a matching knowledge chunk (faq question overlap). */
      const words = qn.split(/\s+/).filter((w) => w.length > 3);
      let knowledge: KnowledgeSource | null = null;
      let faqHit: { q: string; a: string } | null = null;
      for (const s of db.knowledge) {
        if (s.status !== "ready") continue;
        const hit = s.faq.find((f) => words.some((w) => norm(f.q).includes(w) || norm(f.a).includes(w)));
        if (hit) {
          knowledge = s;
          faqHit = hit;
          break;
        }
      }
      const sources: SuggestedReply["sources"] = [];
      if (product) sources.push({ type: "product", id: product.id, label: product.name.ar });
      if (knowledge) sources.push({ type: "knowledge", id: knowledge.id, label: knowledge.title });
      /* 3 · compose the draft strictly from the retrieved evidence. */
      const name = c.contact.name ? ` ${c.contact.name}` : "";
      let draft: string;
      if (faqHit) draft = `هلا${name}! ${faqHit.a}`;
      else if (product) draft = `هلا${name}! بخصوص «${product.name.ar}» — متوفر حالياً بسعر ${product.variants[0] ? (product.variants[0].price.amount / 100).toFixed(2) : "—"} ر.س. تحب أرسل لك رابط الطلب مباشرة؟`;
      else draft = `هلا${name}! شكراً لتواصلك معنا — دقائق وأرجع لك بإجابة دقيقة عن استفسارك.`;
      return { draft, sources };
    }),
  },
  /* approvals + knowledge live in ./governance (file-size split) — same surface. */
  approvals: approvalsApi,
  knowledge: knowledgeApi,
};
