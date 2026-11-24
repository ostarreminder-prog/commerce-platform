import type { LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import type { z } from "zod";
import type { Product, ThemeSettingValue } from "@repo/contracts";
import type { FieldMeta, SectionSettings, ThemeSection } from "../types";
import type { SectionCommerceAdapter } from "../commerce-context";

/**
 * Commerce "experiences" — alternate renderings a product section can adopt
 * via its `view` setting. Each id maps to a registry entry with its own
 * settings fields, defaults and component.
 */
export const EXPERIENCE_IDS = [
  "adaptive-grid",
  "editorial-showcase",
  "visual-discovery",
  "immersive-product",
  "contextual-shopping",
  "comparison",
] as const;

export type ExperienceId = (typeof EXPERIENCE_IDS)[number];

export const isExperienceId = (value: unknown): value is ExperienceId =>
  typeof value === "string" && (EXPERIENCE_IDS as readonly string[]).includes(value);

/**
 * Full-page experience options — which registry experiences each real route
 * (PDP / PLP) can adopt via `Theme.pageExperiences`. `"classic"` is always
 * first and means the built-in hardcoded layout.
 */
export const PAGE_EXPERIENCE_OPTIONS: Record<"product" | "category", readonly string[]> = {
  product: ["classic", "immersive-product", "editorial-showcase"],
  category: ["classic", "adaptive-grid", "visual-discovery"],
};

/** Valid `Theme.pageExperiences[tpl]` value — unknown ids fall back to classic. */
export const isPageExperience = (tpl: "product" | "category", value: unknown): value is string =>
  typeof value === "string" && PAGE_EXPERIENCE_OPTIONS[tpl].includes(value);

/** What the host section hands the experience component. */
export interface ExperienceProps {
  /** Resolved product list (picked ids / catalog fallback, already limited). */
  products: Product[];
  /** The section being rendered (device-resolved settings). */
  section: ThemeSection;
  /** Convenience alias for `section.settings`. */
  settings: SectionSettings;
  /** Commerce adapter — null in contexts without cart/wishlist wiring. */
  adapter?: SectionCommerceAdapter | null;
}

export interface ExperienceRegistryEntry {
  id: ExperienceId;
  /** Label key under the `msg.experience` namespace. */
  labelKey: string;
  icon: LucideIcon;
  /** Zod schema for the experience's own settings keys (merged onto the host section). */
  schema: z.ZodTypeAny;
  /** Extra settings fields rendered under the host section's form. */
  fields: FieldMeta[];
  /** Default values for the experience's own settings keys. */
  defaults: Record<string, ThemeSettingValue>;
  component: ComponentType<ExperienceProps>;
  /** Data the experience consumes beyond the section's product list. */
  dataNeeds?: ("products" | "scenes" | "cart" | "persona")[];
  /** Host-level guards — e.g. fall back to the grid when too few products. */
  deviceRules?: { minProducts?: number; hideOnMobile?: boolean };
}
