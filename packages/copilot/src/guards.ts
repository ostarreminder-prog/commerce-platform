import type { CopilotContext, CopilotTool, ToolArgs } from "./types";

/* --------------------------------------------------------- guard rails */

/** Hard cap for any tool that accepts an id list. */
export const MAX_BULK = 500;

/** Throws when an id list exceeds MAX_BULK — bulk handlers call this first. */
export const assertBulk = <T>(ids: T[]): T[] => {
  if (ids.length > MAX_BULK) throw new Error(`bulk_limit:${ids.length}>${MAX_BULK}`);
  return ids;
};

/** Splits a list into MAX_BULK batches for internal (derived) id sets. */
export const chunk = <T>(items: T[], size = MAX_BULK): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * Tools the engine refuses to run from chat intents:
 * - developers.createWebhook — needs an explicit `confirm: true` flag
 * - marketing.sendEmail / ui.externalLink — never exposed (no free-form
 *   email, no external links); matching intents get a clarify refusal.
 */
export const BLOCKED_TOOLS = new Set(["developers.createWebhook", "marketing.sendEmail", "ui.externalLink"]);

/** Permission check — empty set means demo full-access. */
export const canUse = (tool: CopilotTool, ctx: CopilotContext): boolean =>
  !tool.permission || ctx.permissions.size === 0 || ctx.permissions.has(tool.permission);

/* --------------------------------------------------- store copilot settings
 * Persisted via commerce.copilotSettings — merchants can block specific
 * tools outright and tune which tool kinds still need a confirm card. */

/** Tool blocked by the store's copilot settings («ممنوع نهائياً على Copilot»). */
export const blockedBySettings = (toolName: string, ctx: CopilotContext): boolean =>
  Boolean(ctx.copilotSettings?.blockedTools.includes(toolName));

/**
 * Does this tool call still need a confirmation card under the store's
 * settings? No settings loaded = default strict policy (write+dangerous+bulk
 * always confirm; reads run silently).
 */
export const requiresConfirm = (tool: CopilotTool | undefined, args: ToolArgs, ctx: CopilotContext): boolean => {
  if (!tool) return true;
  const s = ctx.copilotSettings?.alwaysConfirm;
  const bulk = Array.isArray(args.ids) && args.ids.length > 0;
  if (bulk && (s ? s.bulk : true)) return true;
  if (tool.kind === "dangerous") return s ? s.dangerous : true;
  if (tool.kind === "write") return s ? s.write : true;
  return false;
};
