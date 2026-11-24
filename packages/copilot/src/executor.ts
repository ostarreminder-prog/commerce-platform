import type { ActorRef, EntityRef } from "@repo/contracts";
import type { CopilotContext, CopilotResponse, CopilotTool, PlannedStep, ResponseLink, ToolArgs, ToolCall } from "./types";
import { getTool } from "./tool-registry";
import { BLOCKED_TOOLS, blockedBySettings, canUse } from "./guards";
import { uid } from "./engine-helpers";

/* ------------------------------------------------- pending action store
 * Action cards carry an actionId; the tool calls it would run are kept
 * here until the UI confirms via executeAction(). Mock brain → module
 * state is fine (per-tab, resets on reload). */

interface PendingAction {
  calls: ToolCall[];
  summary: string;
  undoable: boolean;
  links: ResponseLink[];
  /** Reverts the executed calls — captured at scenario-build time (snapshot). */
  undo?: (ctx: CopilotContext) => Promise<void>;
}

const pendingActions = new Map<string, PendingAction>();

/* The most recent executed action that registered an undo thunk — the
 * result card's «تراجع» button runs it. Single-slot is enough for the mock
 * (undo is offered right after execution, not from history). */
let lastUndo: { actionId: string; undo: NonNullable<PendingAction["undo"]> } | null = null;

export const registerAction = (meta: PendingAction): string => {
  const actionId = uid("act");
  pendingActions.set(actionId, meta);
  return actionId;
};

/** Tool calls registered under an action card — used by the settings gate in runCopilot. */
export const actionCalls = (actionId: string): ToolCall[] | undefined => pendingActions.get(actionId)?.calls;

/* ------------------------------------------------------------- audit trail
 * Write/dangerous tool executions leave an AuditLog entry (§4.22) so store
 * owners can trace what the copilot changed and from which conversation. */

const copilotActor = (ctx: CopilotContext): ActorRef => ({
  type: "agent",
  id: "copilot",
  name: `🤖 Copilot نيابة عن ${ctx.userName}`,
});

/** Tool namespace → EntityType for audit targets (best effort). */
const NS_ENTITY: Record<string, EntityRef["type"]> = {
  products: "product", orders: "order", customers: "customer", categories: "category",
  coupons: "coupon", pages: "page", staff: "staff", agents: "agent", copilotTasks: "page",
};

/** Best-effort entity ref from common arg shapes (id / ids / tenantId). */
const auditTarget = (tool: CopilotTool, args: ToolArgs): EntityRef | null => {
  const id = (args.id ?? args.tenantId ?? (Array.isArray(args.ids) ? args.ids[0] : undefined)) as string | undefined;
  const type = NS_ENTITY[tool.name.split(".")[0] ?? ""];
  return id && type ? { type, id: String(id), label: String(id) } : null;
};

const auditToolRun = async (tool: CopilotTool, args: ToolArgs, ctx: CopilotContext): Promise<void> => {
  try {
    await ctx.api.audit.log({
      actor: copilotActor(ctx),
      action: `copilot.${tool.name}`,
      target: auditTarget(tool, args),
      changes: [{ field: "args", from: null, to: JSON.stringify(args).slice(0, 160) }],
      conversationId: ctx.conversationId,
    });
  } catch {
    /* audit is best-effort — never block the action on it */
  }
};

/** User-facing text for the failure codes runToolCall throws. */
const failureText = (e: unknown): string => {
  const msg = (e as Error).message;
  if (msg.startsWith("tool_blocked_by_settings")) return "ممنوع من إعدادات المتجر";
  if (msg.startsWith("tool_blocked")) return "إجراء غير متاح من المساعد";
  if (msg.startsWith("permission_denied")) return "ليست لديك صلاحية هذا الإجراء";
  if (msg.startsWith("bulk_limit")) return "العدد أكبر من الحد المسموح (500)";
  return msg;
};

/** Runs one ToolCall: blocked-tool gates → permission gate → zod parse → handler → audit. */
export const runToolCall = async (call: ToolCall, ctx: CopilotContext): Promise<unknown> => {
  const tool = getTool(call.toolName);
  if (!tool) throw new Error(`tool_not_found:${call.toolName}`);
  if (BLOCKED_TOOLS.has(tool.name)) throw new Error(`tool_blocked:${call.toolName}`);
  if (blockedBySettings(tool.name, ctx)) throw new Error(`tool_blocked_by_settings:${call.toolName}`);
  if (!canUse(tool, ctx)) throw new Error(`permission_denied:${tool.permission ?? call.toolName}`);
  const args = tool.schema.parse(call.args) as ToolArgs;
  const result = await tool.handler(args as Record<string, unknown>, ctx);
  if (tool.kind !== "read") void auditToolRun(tool, args, ctx);
  return result;
};

export const executeAction = async (actionId: string, ctx: CopilotContext): Promise<CopilotResponse> => {
  const action = pendingActions.get(actionId);
  if (!action) return { kind: "result", summary: "انتهت صلاحية هذا الإجراء — أعد الطلب من جديد.", undoable: false, links: [] };
  pendingActions.delete(actionId);
  const failures: string[] = [];
  for (const call of action.calls) {
    try {
      await runToolCall(call, ctx);
    } catch (e) {
      failures.push(`${call.toolName}: ${failureText(e)}`);
    }
  }
  const summary = failures.length
    ? `${action.summary} — فشل ${failures.length} من ${action.calls.length}: ${failures.join(" · ")}`
    : action.summary;
  const undoable = action.undoable && failures.length === 0;
  lastUndo = undoable && action.undo ? { actionId, undo: action.undo } : null;
  return { kind: "result", summary, undoable, links: action.links };
};

/** Runs the stored undo for the last executed action — true when it ran. */
export const undoLastAction = async (ctx: CopilotContext): Promise<boolean> => {
  const entry = lastUndo;
  lastUndo = null;
  if (!entry) return false;
  await entry.undo(ctx);
  try {
    await ctx.api.audit.log({
      actor: copilotActor(ctx),
      action: "copilot.undo",
      target: null,
      changes: [{ field: "actionId", from: null, to: entry.actionId }],
      conversationId: ctx.conversationId,
    });
  } catch {
    /* audit is best-effort */
  }
  return true;
};

/** Executes one plan step in place — returns the updated step. */
export const executeStep = async (planned: PlannedStep, ctx: CopilotContext): Promise<PlannedStep> => {
  const next: PlannedStep = { ...planned, status: "running", error: undefined };
  try {
    next.result = await runToolCall({ toolName: planned.toolName, args: planned.args }, ctx);
    next.status = "done";
  } catch (e) {
    next.status = "failed";
    next.error = failureText(e);
  }
  return next;
};
