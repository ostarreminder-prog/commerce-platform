import type { z } from "zod";
import type { CopilotSettings, Permission } from "@repo/contracts";
import type { CommerceApi, StudioApi } from "@repo/api-client";

/* ------------------------------------------------------------- actors */

/** merchant = التاجر (admin app) · platform = الإدارة العليا (super-admin). */
export type CopilotActor = "merchant" | "platform";

/* --------------------------------------------------------------- api */

/** Platform (super-admin) api surface — `commerce.platform`. */
export type PlatformApi = CommerceApi["platform"];

/**
 * Flat api surface the copilot tools run against — the full `commerce`
 * object (every namespace: catalog, inbox, reviews, settings.*, themes…)
 * minus `platform`/`partner`, plus the studio `agents` slice and a
 * nullable `platform` handle. Apps inject `{ ...commerce, agents: studio,
 * platform: commerce.platform | null }`; generated tools resolve their
 * namespace off this surface at call time. `platform` is null for
 * merchant contexts; `partner` stays out (developer portal has no copilot).
 */
export interface CopilotApi extends Omit<CommerceApi, "platform" | "partner"> {
  agents: Pick<StudioApi, "list" | "get" | "create" | "save" | "setStatus" | "publish">;
  platform: PlatformApi | null;
}

/* ---------------------------------------------------------------- ui */

/** App-implemented side-effects — the package only defines the contract. */
export interface UiActions {
  navigate(route: string): void;
  highlight(selector: string): void;
  openDialog(name: string): void;
  fillForm(formId: string, values: Record<string, unknown>): void;
}

export interface CopilotContext {
  actor: CopilotActor;
  /** Store slug — admin routes are prefixed `/<store>` by the app shell. */
  storeId: string;
  userName: string;
  /** Empty set = full access (demo default); otherwise tool.permission must be present. */
  permissions: Set<string>;
  /** Store-level copilot guards (settings → copilot). Undefined = default strict policy. */
  copilotSettings?: CopilotSettings;
  /** Active chat id — attached to audit entries so they link back to /copilot?c=<id>. */
  conversationId?: string;
  api: CopilotApi;
  ui: UiActions;
}

/* -------------------------------------------------------------- tools */

export type ToolKind = "read" | "write" | "dangerous";

export type ToolArgs = Record<string, unknown>;
export type ToolHandler = (args: ToolArgs, ctx: CopilotContext) => Promise<unknown>;

export interface CopilotTool {
  name: string;
  descriptionAr: string;
  descriptionEn: string;
  schema: z.ZodTypeAny;
  kind: ToolKind;
  undoable: boolean;
  permission?: Permission | (string & {});
  handler: ToolHandler;
}

export interface ToolCall {
  toolName: string;
  args: ToolArgs;
}

/* ---------------------------------------------------------- responses */

export interface TableColumn {
  key: string;
  label: string;
}
export type TableRow = Record<string, string | number | null>;
export interface ChartSeriesPoint {
  label: string;
  value: number;
}
export interface ResponseLink {
  label: string;
  href: string;
}
export interface DiffEntry {
  field: string;
  from: string;
  to: string;
}
export type DangerLevel = "normal" | "dangerous";

export interface PlannedStep {
  id: string;
  title: string;
  toolName: string;
  args: ToolArgs;
  status: "pending" | "running" | "done" | "failed";
  error?: string;
  result?: unknown;
}

export interface ClarifyOption {
  id: string;
  label: string;
}

/* Spec union — the `table?`/`links?`/`chart?` extras let one response carry a
 * composite answer (e.g. table+chart) without introducing new kinds. */
export type CopilotResponse =
  | { kind: "text"; text: string; table?: { title?: string; columns: TableColumn[]; rows: TableRow[] }; links?: ResponseLink[] }
  | { kind: "table"; title?: string; columns: TableColumn[]; rows: TableRow[]; chart?: { title?: string; chartType: "bar" | "line"; series: ChartSeriesPoint[] } }
  | { kind: "chart"; title: string; chartType: "bar" | "line"; series: ChartSeriesPoint[] }
  | {
      kind: "action";
      actionId: string;
      title: string;
      description: string;
      affected: { count: number; items: string[] };
      diff?: DiffEntry[];
      dangerLevel: DangerLevel;
      requiresTextConfirm?: string;
    }
  | { kind: "plan"; title: string; steps: PlannedStep[] }
  | { kind: "clarify"; question: string; options: ClarifyOption[] }
  | { kind: "result"; summary: string; undoable: boolean; links: ResponseLink[] };

/* --------------------------------------------------------------- chat */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  response?: CopilotResponse;
  createdAt: string;
}

/* --------------------------------------------------------- scenarios */

/** One mock-brain intent: `test` runs against normalizeArabic(input). */
export interface Scenario {
  id: string;
  test: RegExp;
  run: (input: string, ctx: CopilotContext, history: ChatMessage[]) => Promise<CopilotResponse>;
}
