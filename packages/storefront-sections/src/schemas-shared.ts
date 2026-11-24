import { z } from "zod";
import type { FieldMeta, SectionDefinition, SectionType, SelectOption } from "./types";

export const str = (d = "") => z.string().default(d);
export const num = (d = 0) => z.number().default(d);
export const bool = (d = false) => z.boolean().default(d);
export const idList = () => z.array(z.string()).default([]);

/** Localized text is stored as two flat keys: `<base>Ar` / `<base>En`. */
export const loc = (base: string, ar = "", en = "") => ({
  [`${base}Ar`]: z.string().default(ar),
  [`${base}En`]: z.string().default(en),
});

export const f = (key: string, kind: FieldMeta["kind"], extra: Partial<FieldMeta> = {}): FieldMeta => ({
  key,
  kind,
  labelKey: key,
  ...extra,
});

export const opt = (value: string): SelectOption => ({ value, labelKey: value });
export const opts = (...values: string[]) => values.map(opt);

export const ICON_OPTIONS = opts("truck", "shield", "refresh", "gift", "star", "chat", "leaf", "gem");

/* ---- shared section shape: color scheme + per-device setting overrides ---- */
const overrideMap = () => z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional();
const COMMON_SCHEMA = { colorScheme: str(""), mobile: overrideMap(), tablet: overrideMap() };
const SCHEME_FIELD = f("colorScheme", "select", { optionsSource: "colorSchemes", labelKey: "colorScheme" });

/** Wrap a section def: injects shared schema keys + the color-scheme field. */
export const def = (
  type: SectionType,
  schema: z.ZodObject<z.ZodRawShape>,
  fields: FieldMeta[],
  extra: Partial<SectionDefinition> = {},
): SectionDefinition => ({
  type,
  schema: schema.extend(COMMON_SCHEMA),
  fields: [...fields, SCHEME_FIELD],
  ...extra,
});
