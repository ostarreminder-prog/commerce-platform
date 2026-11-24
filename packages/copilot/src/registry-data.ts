import { CATALOG_SPEC } from "./spec-catalog";
import { GROWTH_SPEC } from "./spec-growth";
import { OPS_SPEC } from "./spec-ops";
import { STORE_SPEC } from "./spec-store";
import { AGENTS_PLATFORM_SPEC } from "./spec-agents-platform";
import type { GenNsSpec } from "./spec-helpers";

/* ------------------------------------------------------------------ *
 * API_GEN_SPEC — the metadata table that drives tool generation.
 * Every `commerce.<ns>` namespace (plus the studio `agents` surface and
 * `commerce.platform`) is declared once in the spec-*.ts domain files;
 * `tool-gen.ts` turns each declared method into a Copilot tool unless a
 * handwritten tool with the same name already covers it.
 *
 * Method entry fields:
 *   m        api method name on the namespace object
 *   name     tool suffix override (e.g. upsert `save` → tool `*.create`)
 *   args     arg-shape preset (see tool-gen.ts SHAPES); "custom" = bespoke
 *   schema   custom zod schema (args:"custom")
 *   call     maps parsed args → positional call args (args:"custom")
 *   permission  overrides the namespace read/write permission
 *   undoable flags a reversible write
 *   skip     exclusion reason — op counted but no tool generated
 * ------------------------------------------------------------------ */

export const API_GEN_SPEC: GenNsSpec[] = [
  ...CATALOG_SPEC,
  ...GROWTH_SPEC,
  ...OPS_SPEC,
  ...STORE_SPEC,
  ...AGENTS_PLATFORM_SPEC,
];

export type { ArgShapeId, GenMethodSpec, GenNsSpec } from "./spec-helpers";
