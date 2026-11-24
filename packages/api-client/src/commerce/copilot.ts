import type {
  ActorRef, AuditLog, CopilotConversation, CopilotSettings, CopilotTask,
} from "@repo/contracts";
import { spec } from "@repo/mocks";
import { db, find, guard, me, respond, uid } from "./db";

export const copilotApi = {
  analytics: { home: () => respond(spec.homeAnalytics) },
  audit: {
    list: () => respond<AuditLog[]>(db.audit),
    /** Append an audit entry — used by copilot tool execution (actor passed explicitly). */
    log: (input: { action: string; actor?: ActorRef; target?: AuditLog["target"]; changes?: AuditLog["changes"]; conversationId?: string }) =>
      guard<AuditLog>(() => {
        const entry: AuditLog = {
          id: uid("aud"), actor: input.actor ?? me(), action: input.action, target: input.target ?? null,
          changes: input.changes ?? [], ip: null, at: new Date().toISOString(),
          ...(input.conversationId ? { conversationId: input.conversationId } : {}),
        };
        db.audit.unshift(entry);
        return entry;
      }),
  },
  /* Copilot scheduled tasks + alerts (§4.23) — created from chat scenarios,
   * managed from /copilot/tasks. `runNow` simulates one execution. */
  copilotTasks: {
    list: () => respond<CopilotTask[]>(db.copilotTasks),
    get: (id: string) => guard<CopilotTask>(() => find(db.copilotTasks, id, "copilot task")),
    create: (input: Omit<CopilotTask, "id" | "createdAt" | "lastRunAt">) =>
      guard<CopilotTask>(() => {
        /* No duplicate scheduling — a task with the same title+kind+slot is
         * updated in place instead of stacking a second one. */
        const dupe = db.copilotTasks.find(
          (t) => t.kind === input.kind && t.title.trim() === input.title.trim() && t.schedule.hour === input.schedule.hour && (t.schedule.minute ?? 0) === (input.schedule.minute ?? 0),
        );
        if (dupe) {
          Object.assign(dupe, { prompt: input.prompt, threshold: input.threshold, enabled: input.enabled });
          return dupe;
        }
        const task: CopilotTask = { ...input, id: uid("cpt"), createdAt: new Date().toISOString(), lastRunAt: null };
        db.copilotTasks.unshift(task);
        return task;
      }),
    update: (id: string, patch: Partial<Pick<CopilotTask, "title" | "prompt" | "schedule" | "threshold" | "enabled">>) =>
      guard<CopilotTask>(() => Object.assign(find(db.copilotTasks, id, "copilot task"), patch)),
    remove: (id: string) =>
      guard(() => {
        find(db.copilotTasks, id, "copilot task");
        db.copilotTasks = db.copilotTasks.filter((t) => t.id !== id);
        return { ok: true as const };
      }),
    /** Simulates a run — stamps lastRunAt and returns a text summary the chat/table can show. */
    runNow: (id: string) =>
      guard(() => {
        const t = find(db.copilotTasks, id, "copilot task");
        t.lastRunAt = new Date().toISOString();
        const summary =
          t.kind === "alert"
            ? `اشتغل تنبيه «${t.title}»: راجعت مستويات المخزون — ${db.inventoryLevels.filter((l) => l.available <= (t.threshold ?? 5)).length} متغير عند الحد أو أقل.`
            : `اشتغلت مهمة «${t.title}»: ${db.orders.length} طلب — آخر تحديث الآن.`;
        return { summary, task: t };
      }),
  },
  copilotSettings: {
    get: () => respond<CopilotSettings>(db.copilotSettings),
    save: (next: CopilotSettings) => guard<CopilotSettings>(() => Object.assign(db.copilotSettings, next)),
  },
  /* Saved copilot conversations (§4.23) — the provider hydrates from list()
   * and upserts after each assistant reply; shared threads open read-only. */
  copilotConversations: {
    list: () => respond<CopilotConversation[]>(db.copilotConversations),
    get: (id: string) => guard<CopilotConversation>(() => find(db.copilotConversations, id, "copilot conversation")),
    save: (conv: CopilotConversation) =>
      guard<CopilotConversation>(() => {
        conv.updatedAt = new Date().toISOString();
        const idx = db.copilotConversations.findIndex((c) => c.id === conv.id);
        if (idx >= 0) db.copilotConversations[idx] = conv;
        else db.copilotConversations.unshift(conv);
        return conv;
      }),
    pin: (id: string, pinned: boolean) =>
      guard<CopilotConversation>(() => Object.assign(find(db.copilotConversations, id, "copilot conversation"), { pinned })),
    share: (id: string, shared: boolean) =>
      guard<CopilotConversation>(() => Object.assign(find(db.copilotConversations, id, "copilot conversation"), { shared })),
    remove: (id: string) =>
      guard(() => {
        find(db.copilotConversations, id, "copilot conversation");
        db.copilotConversations = db.copilotConversations.filter((c) => c.id !== id);
        return { ok: true as const };
      }),
  },
};
