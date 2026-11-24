import { z } from "zod";
import type { CopilotApi } from "./types";

/* --------------------------------------------------------------- *
 * spec-helpers — leaf module: spec types + shared zod arg builders
 * used by the spec-*.ts domain tables. Kept import-free of the spec
 * files so registry-data.ts can aggregate them without a cycle.
 * --------------------------------------------------------------- */

export type ArgShapeId =
  | "none" | "id" | "ids" | "idOpt" | "input" | "idInput" | "idPatch" | "idText" | "idBool" | "custom";

export interface GenMethodSpec {
  m: string;
  name?: string;
  args?: ArgShapeId;
  schema?: z.ZodTypeAny;
  call?: (a: Record<string, unknown>) => unknown[];
  permission?: string;
  undoable?: boolean;
  descAr?: string;
  descEn?: string;
  skip?: string;
}

export interface GenNsSpec {
  /** Tool-name prefix and default api path (dotted paths allowed). */
  ns: string;
  /** Api path on ctx.api when different from `ns`. */
  path?: string;
  /** Resolves the target object directly (session/platform wrappers). */
  resolve?: (api: CopilotApi) => Record<string, unknown> | null | undefined;
  entityAr: string;
  entityEn: string;
  readPermission?: string;
  writePermission?: string;
  read?: GenMethodSpec[];
  write?: GenMethodSpec[];
  danger?: GenMethodSpec[];
  /** Whole-namespace exclusion — no tools generated; ops still counted. */
  skipNs?: string;
  skipOps?: string[];
}

export const zId = z.string().min(1);
export const zIds = z.array(z.string().min(1)).min(1);
export const zRec = z.record(z.string(), z.unknown());

/** {id, <flag>: boolean} — flag name passed through as the 2nd call arg. */
export const idFlag = (key: string) => ({
  args: "custom" as const,
  schema: z.object({ id: zId, [key]: z.boolean().default(true) }).strict(),
  call: (a: Record<string, unknown>) => [a.id, a[key]],
});
/** {ids, <key>: string} bulk helper — call as [ids, value]. */
export const idsWith = (key: string, schema: z.ZodTypeAny = z.string().min(1)) => ({
  args: "custom" as const,
  schema: z.object({ ids: zIds, [key]: schema }).strict(),
  call: (a: Record<string, unknown>) => [a.ids, a[key]],
});
