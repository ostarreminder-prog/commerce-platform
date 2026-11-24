import { z } from "zod";
import type { CopilotContext, CopilotTool, ToolArgs, ToolKind } from "./types";
import { assertBulk } from "./guards";
import { API_GEN_SPEC, type ArgShapeId, type GenMethodSpec, type GenNsSpec } from "./registry-data";

/* ------------------------------------------------------------------ *
 * tool-gen — turns API_GEN_SPEC (registry-data.ts) into Copilot tools.
 *
 * Every declared method on a commerce namespace becomes one tool named
 * `<ns>.<method>` (or `<ns>.<name>` when renamed, e.g. `save`→`create`).
 * Generated tools coexist with the handwritten registries: when a spec
 * method's tool name already exists in the handwritten set the generated
 * one is skipped — the api op still counts as covered.
 *
 * Arg shapes are auto-derived presets (id / ids / input / id+input …);
 * complex signatures declare `args:"custom"` with their own schema+call
 * mapper. Ops that can't map (`skip:`) are reported in the coverage
 * `excluded` list together with whole-namespace exclusions (`skipNs`).
 * ------------------------------------------------------------------ */

type ArgCall = (a: ToolArgs) => unknown[];

const id = z.string().min(1);
const rec = z.record(z.string(), z.unknown());

const SHAPES: Record<Exclude<ArgShapeId, "custom">, { schema: z.ZodTypeAny; call: ArgCall }> = {
  /* `limit` is accepted on every zero-arg call — array results are
   * sliced to it (legacy CRUD `list` semantics; plan steps pass it). */
  none:    { schema: z.object({ limit: z.number().int().min(1).max(500).optional() }).strict(), call: () => [] },
  id:      { schema: z.object({ id }).strict(), call: (a) => [a.id] },
  ids:     { schema: z.object({ ids: z.array(id).min(1) }).strict(), call: (a) => [assertBulk(a.ids as string[])] },
  idOpt:   { schema: z.object({ id: id.optional() }).strict(), call: (a) => [a.id] },
  input:   { schema: z.object({ input: rec }).strict(), call: (a) => [a.input] },
  idInput: { schema: z.object({ id, input: rec.default({}) }).strict(), call: (a) => [a.id, a.input] },
  idPatch: { schema: z.object({ id, patch: rec }).strict(), call: (a) => [a.id, a.patch] },
  idText:  { schema: z.object({ id, text: z.string().min(1) }).strict(), call: (a) => [a.id, a.text] },
  idBool:  { schema: z.object({ id, enabled: z.boolean().default(true) }).strict(), call: (a) => [a.id, a.enabled] },
};

/* ------------------------------------------------------- ns resolution */

type AnyFn = (...a: never[]) => Promise<unknown>;

const resolveNs = (spec: GenNsSpec, ctx: CopilotContext): Record<string, unknown> | null | undefined =>
  spec.resolve
    ? spec.resolve(ctx.api)
    : (spec.path ?? spec.ns).split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | null | undefined)?.[k], ctx.api) as
        | Record<string, unknown>
        | null
        | undefined;

const callNs = (ctx: CopilotContext, spec: GenNsSpec, method: string, callArgs: unknown[]): Promise<unknown> => {
  const scope = resolveNs(spec, ctx);
  const fn = scope?.[method];
  if (typeof fn !== "function") return Promise.reject(new Error(`api.${spec.ns}.${method} is not available`));
  return (fn as AnyFn)(...(callArgs as never[]));
};

/* --------------------------------------------------------- tool build */

const VERBS: Record<string, [string, string]> = {
  list: ["عرض قائمة", "list"], listAll: ["عرض كل", "list all"], get: ["قراءة", "get"],
  create: ["إنشاء", "create"], save: ["حفظ", "save"], update: ["تحديث", "update"],
  remove: ["حذف", "delete"], setStatus: ["تغيير حالة", "set status"],
};
const KIND_VERB: Record<ToolKind, [string, string]> = {
  read: ["قراءة", "read"], write: ["تنفيذ", "run"], dangerous: ["إجراء خطير على", "dangerous op on"],
};

const buildTool = (spec: GenNsSpec, ms: GenMethodSpec, kind: ToolKind): CopilotTool => {
  const preset = ms.args && ms.args !== "custom" ? SHAPES[ms.args] : SHAPES.none;
  const schema = ms.schema ?? preset.schema;
  const call = ms.call ?? preset.call;
  const write = kind !== "read";
  const [vAr, vEn] = VERBS[ms.m] ?? KIND_VERB[kind];
  return {
    name: `${spec.ns}.${ms.name ?? ms.m}`,
    descriptionAr: ms.descAr ?? `${vAr} ${spec.entityAr}`,
    descriptionEn: ms.descEn ?? `${vEn} ${spec.entityEn}`,
    schema,
    kind,
    undoable: ms.undoable ?? false,
    permission: ms.permission ?? (write ? spec.writePermission ?? spec.readPermission : spec.readPermission),
    handler: async (args: ToolArgs, ctx: CopilotContext) => {
      const out = await callNs(ctx, spec, ms.m, call(args));
      const limit = args.limit as number | undefined;
      return Array.isArray(out) && limit ? out.slice(0, limit) : out;
    },
  };
};

/* ----------------------------------------------------------- coverage */

export interface ApiOpExclusion {
  op: string;
  reason: string;
}
export interface NsCoverage {
  ns: string;
  entityAr: string;
  ops: number;
  excluded: number;
}
export interface ApiCoverage {
  /** Declared api operations across every namespace (covered + excluded). */
  totalApiOps: number;
  /** Ops reachable through a tool (generated or same-named handwritten). */
  coveredOps: number;
  excludedOps: number;
  excluded: ApiOpExclusion[];
  byNamespace: NsCoverage[];
}

const KINDS: [keyof Pick<GenNsSpec, "read" | "write" | "danger">, ToolKind][] = [
  ["read", "read"],
  ["write", "write"],
  ["danger", "dangerous"],
];

/**
 * Generates one tool per spec method. `reserved` = names already taken by
 * handwritten tools — colliding methods count as covered but emit no tool.
 */
export function generateApiTools(reserved: ReadonlySet<string> = new Set()): { tools: CopilotTool[]; coverage: ApiCoverage } {
  const tools: CopilotTool[] = [];
  const seen = new Set(reserved);
  const excluded: ApiOpExclusion[] = [];
  const byNamespace: NsCoverage[] = [];
  let totalApiOps = 0;
  let coveredOps = 0;
  let excludedOps = 0;

  for (const spec of API_GEN_SPEC) {
    if (spec.skipNs) {
      const ops = spec.skipOps?.length ?? 0;
      totalApiOps += ops;
      excludedOps += ops;
      excluded.push({ op: `${spec.ns}.*`, reason: spec.skipNs });
      byNamespace.push({ ns: spec.ns, entityAr: spec.entityAr, ops, excluded: ops });
      continue;
    }
    let ops = 0;
    let nsExcluded = 0;
    for (const [key, kind] of KINDS) {
      for (const ms of spec[key] ?? []) {
        ops += 1;
        totalApiOps += 1;
        if (ms.skip) {
          excludedOps += 1;
          nsExcluded += 1;
          excluded.push({ op: `${spec.ns}.${ms.m}`, reason: ms.skip });
          continue;
        }
        coveredOps += 1;
        const name = `${spec.ns}.${ms.name ?? ms.m}`;
        if (seen.has(name)) continue; // handwritten (or earlier generated) covers it
        seen.add(name);
        tools.push(buildTool(spec, ms, kind));
      }
    }
    byNamespace.push({ ns: spec.ns, entityAr: spec.entityAr, ops, excluded: nsExcluded });
  }

  return { tools, coverage: { totalApiOps, coveredOps, excludedOps, excluded, byNamespace } };
}
