import type { ColorScheme, Theme, ThemeDevice, ThemeSection } from "@repo/contracts";
import type { ZodTypeAny } from "zod";

export const SECTION_TYPES = [
  "header",
  "footer",
  "hero",
  "slider",
  "categories",
  "featured-products",
  "banner",
  "image-text",
  "testimonials",
  "features",
  "faq",
  "newsletter",
  "main-product",
  "rich-text",
  "video",
  "collage",
  "logo-list",
  "contact-form",
  "map",
  "countdown",
  "tabs",
  "recently-viewed",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const isSectionType = (type: string): type is SectionType => (SECTION_TYPES as readonly string[]).includes(type);

export type SectionSettings = ThemeSection["settings"];
export type SectionBlock = ThemeSection["blocks"][number];
export type ThemeGlobals = Theme["globals"];
export type { Theme, ThemeSection, ColorScheme, ThemeDevice };
export type Device = ThemeDevice;

/**
 * Preview persona — editor sends it over postMessage and the preview stores it
 * in `SectionData.previewPersona` so cart/customer-aware sections can adapt
 * (sections may ignore it until they implement persona logic).
 */
export type PreviewPersona = "guest" | "customer" | "with-cart";

/** Field kinds that drive the auto-generated settings form. */
export type FieldKind =
  | "text"
  | "localized"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "image"
  | "entity-ref"
  | "entity-list"
  | "blocks";

export interface SelectOption {
  value: string;
  /** Key under `msg.editor.options`. */
  labelKey: string;
}

export interface FieldMeta {
  /**
   * Settings key. For `localized` fields this is the base key — the actual
   * settings hold `<key>Ar` / `<key>En` flat keys.
   */
  key: string;
  kind: FieldKind;
  /** Key under `msg.editor.fields` for the field label. */
  labelKey: string;
  /** `select` options. */
  options?: SelectOption[];
  /** Dynamic `select` options source — resolved from context at render. */
  optionsSource?: "colorSchemes" | "experiences";
  /** Which entity an `entity-ref` / `entity-list` field picks. */
  entity?: "product" | "category";
  /** `number` bounds / `blocks` cap. */
  min?: number;
  max?: number;
  /**
   * `blocks` definition. `blockType` = legacy single-type list (fields via
   * `blockFields` or `BLOCK_REGISTRY`); `blockTypes` = multi-type palette
   * limited to the listed block types.
   */
  blockType?: string;
  blockTypes?: string[];
  blockFields?: FieldMeta[];
}

export interface SectionDefinition {
  type: SectionType;
  /** Zod schema — source of truth for validation and defaults. */
  schema: ZodTypeAny;
  /** Field metadata — drives the auto-generated settings form (order = render order). */
  fields: FieldMeta[];
  /**
   * Generic block palette for this section — the settings form's blocks
   * editor filters its add-menu to `types` and caps at `max`.
   */
  blocks?: { types: string[]; max: number };
  /** Setting keys the device tabs (mobile/tablet) are allowed to override. */
  deviceOverrides?: string[];
}
