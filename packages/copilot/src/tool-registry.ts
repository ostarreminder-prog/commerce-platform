import type { CopilotContext, CopilotTool } from "./types";
import { generateApiTools, type ApiCoverage } from "./tool-gen";
import { EXTRA_TOOLS } from "./registry-extra";
import { PLATFORM_TOOLS } from "./registry-platform";
import { canUse } from "./guards";

/* ------------------------------------------------------- the registry
 * Static: one generated tool per api method declared in API_GEN_SPEC
 * (registry-data.ts — every commerce.* namespace + agents + platform),
 * minus names already owned by the handwritten merchant/platform tools.
 * To expose tools for a new api method add one entry to API_GEN_SPEC;
 * ops that can't map are listed in coverage.excluded. */

const HANDWRITTEN: CopilotTool[] = [...EXTRA_TOOLS, ...PLATFORM_TOOLS];
const GENERATED = generateApiTools(new Set(HANDWRITTEN.map((t) => t.name)));

export const TOOL_REGISTRY: CopilotTool[] = [...GENERATED.tools, ...HANDWRITTEN];
const API_COVERAGE: ApiCoverage = GENERATED.coverage;

const byName = new Map(TOOL_REGISTRY.map((t) => [t.name, t] as const));

export const getTool = (name: string): CopilotTool | undefined => byName.get(name);

/** Tools the current actor is allowed to see/run. */
export const toolsFor = (ctx: CopilotContext): CopilotTool[] =>
  TOOL_REGISTRY.filter((t) => canUse(t, ctx) && (ctx.actor === "platform" || !t.name.startsWith("platform.")));

export interface ToolCoverage extends ApiCoverage {
  /** Total tools in TOOL_REGISTRY (generated + handwritten + platform). */
  toolCount: number;
  /** coveredOps / totalApiOps as a whole percentage. */
  pct: number;
  byNamespace: (ApiCoverage["byNamespace"][number] & { tools: number })[];
}

/**
 * Coverage of the api surface by tools — used by the UI report (§هـ)
 * to show "الأدوات / العمليات: N/M (pct%)" per namespace.
 */
export function toolCoverage(): ToolCoverage {
  return {
    ...API_COVERAGE,
    toolCount: TOOL_REGISTRY.length,
    pct: API_COVERAGE.totalApiOps ? Math.round((API_COVERAGE.coveredOps / API_COVERAGE.totalApiOps) * 100) : 0,
    byNamespace: API_COVERAGE.byNamespace.map((n) => ({
      ...n,
      tools: TOOL_REGISTRY.filter((t) => t.name === n.ns || t.name.startsWith(`${n.ns}.`)).length,
    })),
  };
}

export { generateApiTools } from "./tool-gen";
export { API_GEN_SPEC } from "./registry-data";
export { EXTRA_TOOLS } from "./registry-extra";
export { PLATFORM_TOOLS } from "./registry-platform";
export { MAX_BULK, BLOCKED_TOOLS, assertBulk, chunk, canUse } from "./guards";
