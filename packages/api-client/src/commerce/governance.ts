import type { AgentApproval, KnowledgeSource } from "@repo/contracts";
import { spec } from "@repo/mocks";
import type { KnowledgeInput } from "./types";
import { db, find, guard, me, pushMessage, requirePerm, respond, uid } from "./db";
import { applyRefund } from "./orders";
import { refundableBalance } from "./order-math";

/* Decision requests + the knowledge index — split out of inbox.ts (file-size
 * guideline); both namespaces compose into `inboxApi` unchanged. */

export const approvalsApi = {
  list: () => respond<AgentApproval[]>(db.approvals),
  /* Copilot/agents file a decision request — shows up here as `pending` and
   * only a human with `approvals.decide` can execute it via decide(). */
  request: (input: { agentId: string; conversationId?: string | null; action: AgentApproval["action"]; target: AgentApproval["target"]; amount?: AgentApproval["amount"]; reason: string }) =>
    guard<AgentApproval>(() => {
      const a: AgentApproval = {
        id: uid("apr"),
        agentId: input.agentId,
        conversationId: input.conversationId ?? "",
        action: input.action,
        target: input.target,
        amount: input.amount ?? null,
        reason: input.reason,
        status: "pending",
        decidedBy: null,
        decidedAt: null,
        expiresAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.approvals.unshift(a);
      return a;
    }),
  decide: (id: string, decision: "approved" | "rejected", _reason?: string) => guard(() => {
    requirePerm("approvals.decide");
    const a = find(db.approvals, id, "approval");
    /* No double-decide / double-execute — a decided approval is final. */
    if (a.status !== "pending") throw new Error("approval_already_decided");
    const c = db.conversations.find((x) => x.id === a.conversationId);
    /* Execute FIRST, then mark decided: if the refund throws the approval
     * stays pending and the failure surfaces to the approver — no silent
     * "approved but nothing happened" state. */
    if (decision === "approved" && a.action === "refund" && a.amount && a.target.type === "order") {
      const o = db.orders.find((x) => x.id === a.target.id);
      if (!o) throw new Error(`order ${a.target.id} not found`);
      /* Agent-approved refund — capped at the refundable balance so an over-
       * asked approval can never exceed what the customer paid. */
      const amount = Math.min(a.amount.amount, refundableBalance(o, db.payments, db.refunds));
      if (amount <= 0) throw new Error("nothing_refundable");
      const r = applyRefund(o, { amount, reason: a.reason, restock: false, actor: { type: "agent", id: a.agentId, name: "وكيل" } });
      r.approvedBy = me();
    }
    if (decision === "approved" && a.action === "cancel_order" && a.target.type === "order") {
      const o = db.orders.find((x) => x.id === a.target.id);
      if (!o) throw new Error(`order ${a.target.id} not found`);
      if (o.status !== "cancelled") {
        o.status = "cancelled";
        o.fulfillmentStatus = "cancelled";
        o.cancelledAt = new Date().toISOString();
        o.cancelReason = { code: "customer_request", text: a.reason };
      }
    }
    Object.assign(a, { status: decision, decidedBy: spec.currentStaff.id, decidedAt: new Date().toISOString() });
    if (c) pushMessage(c, { type: "system", content: decision === "approved" ? "approval_approved" : "approval_rejected", attachments: [], toolCalls: [], deliveryStatus: null, ref: a.target, from: me() });
    return a;
  }),
};

const REINDEX_MS = 2_500;
const reindex = (s: KnowledgeSource) =>
  setTimeout(() => {
    s.status = "ready";
    s.chunksCount = s.faq.length ? Math.max(1, s.faq.length) * 4 : 12 + (s.id.charCodeAt(3) % 30);
    s.lastSyncedAt = new Date().toISOString();
  }, REINDEX_MS);

export const knowledgeApi = {
  list: () => respond<KnowledgeSource[]>(db.knowledge),
  get: (id: string) => guard<KnowledgeSource>(() => find(db.knowledge, id, "knowledge")),
  create: (input: KnowledgeInput) => guard(() => {
    /* Dupe guard — a same-title source is rejected instead of double-indexed. */
    if (db.knowledge.some((s) => s.title.trim() === input.title.trim())) throw new Error("duplicate_title");
    const s: KnowledgeSource = {
      id: uid("kn"), type: input.type, title: input.title, file: input.type === "file" ? { name: input.detail || input.title, sizeBytes: 240_000 } : null,
      url: input.type === "url" || input.type === "policy" ? input.detail : null, faq: input.faq ?? (input.type === "faq" && input.detail ? [{ q: input.title, a: input.detail }] : []),
      status: "processing", chunksCount: 0, usedByAgentIds: [], lastSyncedAt: null, autoSync: input.type === "url" || input.type === "product_catalog",
    };
    db.knowledge.unshift(s);
    reindex(s);
    return s;
  }),
  /** Edit an existing source — re-runs the (mock) indexing so chunks/counts refresh. */
  update: (id: string, input: Pick<KnowledgeInput, "title" | "detail" | "faq">) => guard(() => {
    const s = find(db.knowledge, id, "knowledge");
    if (db.knowledge.some((x) => x.id !== id && x.title.trim() === input.title.trim())) throw new Error("duplicate_title");
    s.title = input.title;
    if (s.type === "url" || s.type === "policy") s.url = input.detail;
    if (s.type === "file" && s.file && input.detail) s.file = { ...s.file, name: input.detail };
    if (input.faq) s.faq = input.faq;
    else if (s.type === "faq" && input.detail) s.faq = [{ q: input.title, a: input.detail }];
    s.status = "processing";
    s.chunksCount = 0;
    reindex(s);
    return s;
  }),
  linkAgent: (id: string, agentId: string) => guard(() => {
    const s = find(db.knowledge, id, "knowledge");
    if (!s.usedByAgentIds.includes(agentId)) s.usedByAgentIds.push(agentId);
    return s;
  }),
  unlinkAgent: (id: string, agentId: string) => guard(() => {
    const s = find(db.knowledge, id, "knowledge");
    s.usedByAgentIds = s.usedByAgentIds.filter((a) => a !== agentId);
    return s;
  }),
  setAutoSync: (id: string, on: boolean) => guard(() => {
    const s = find(db.knowledge, id, "knowledge");
    s.autoSync = on;
    return s;
  }),
  sync: (id: string) => guard(() => {
    const s = find(db.knowledge, id, "knowledge");
    s.status = "processing";
    setTimeout(() => { s.status = "ready"; s.lastSyncedAt = new Date().toISOString(); }, 2_000);
    return s;
  }),
  remove: (id: string) => guard(() => {
    db.knowledge = db.knowledge.filter((x) => x.id !== id);
    return { ok: true as const };
  }),
  testQuery: (id: string, question: string) => guard(() => {
    const s = find(db.knowledge, id, "knowledge");
    const faqHit = s.faq.find((f) => question && (f.q.includes(question.trim().split(" ")[0] ?? "") || question.includes(f.q.slice(0, 8))));
    const chunks = [
      { score: 0.92, text: faqHit ? `س: ${faqHit.q} — ج: ${faqHit.a}` : `${s.title}: الجزء الأكثر صلة بالسؤال.` },
      { score: 0.81, text: `${s.title}: معلومة داعمة من المقطع الثاني.` },
      { score: 0.66, text: `${s.title}: سياق إضافي أقل صلة.` },
    ];
    return { question, answer: faqHit?.a ?? "إجابة مركبة من الأجزاء المسترجعة أعلاه.", chunks: chunks.slice(0, s.status === "ready" ? 3 : 0) };
  }),
};
