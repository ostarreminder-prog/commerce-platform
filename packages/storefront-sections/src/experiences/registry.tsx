import { Eye, LayoutGrid, Newspaper, Package, PanelsTopLeft, Scale } from "lucide-react";
import { z } from "zod";
import { bool, f, num, opts, str } from "../schemas-shared";
import type { ExperienceId, ExperienceRegistryEntry } from "./types";
import { AdaptiveGridExperience } from "./adaptive-grid";
import { EditorialShowcaseExperience } from "./editorial-showcase";
import { ImmersiveProductExperience } from "./immersive-product";
import { VisualDiscoveryExperience } from "./visual-discovery";
import { ContextualShoppingExperience } from "./contextual-shopping";
import { ComparisonExperience } from "./comparison";

const entry = (partial: Omit<ExperienceRegistryEntry, "labelKey">): ExperienceRegistryEntry => ({
  labelKey: partial.id,
  ...partial,
});

/**
 * Commerce experience registry — the `view` setting on product sections
 * resolves through here to pick a renderer. Experience-owned settings keys
 * live both here (schema/fields/defaults) and on the host section schema so
 * they survive `parseSettings`/theme import.
 */
export const EXPERIENCE_REGISTRY: Record<ExperienceId, ExperienceRegistryEntry> = {
  "adaptive-grid": entry({
    id: "adaptive-grid",
    icon: LayoutGrid,
    schema: z.object({}),
    fields: [],
    defaults: {},
    component: AdaptiveGridExperience,
    dataNeeds: ["products", "cart"],
  }),
  "editorial-showcase": entry({
    id: "editorial-showcase",
    icon: Newspaper,
    schema: z.object({}),
    fields: [],
    defaults: {},
    component: EditorialShowcaseExperience,
    dataNeeds: ["products"],
  }),
  "visual-discovery": entry({
    id: "visual-discovery",
    icon: Eye,
    schema: z.object({
      source: z.enum(["products", "categories"]).default("products"),
      categoryIds: z.array(z.string()).default([]),
      density: z.enum(["compact", "normal"]).default("normal"),
      showPrice: bool(true),
    }),
    fields: [
      f("source", "select", { options: opts("products", "categories") }),
      f("categoryIds", "entity-list", { entity: "category" }),
      f("density", "select", { options: opts("compact", "normal") }),
      f("showPrice", "boolean"),
    ],
    defaults: { source: "products", categoryIds: [], density: "normal", showPrice: true },
    component: VisualDiscoveryExperience,
    dataNeeds: ["products", "scenes"],
  }),
  "immersive-product": entry({
    id: "immersive-product",
    icon: Package,
    schema: z.object({ productId: str("") }),
    fields: [f("productId", "entity-ref", { entity: "product" })],
    defaults: { productId: "" },
    component: ImmersiveProductExperience,
    dataNeeds: ["products", "cart", "persona"],
  }),
  "contextual-shopping": entry({
    id: "contextual-shopping",
    icon: PanelsTopLeft,
    schema: z.object({ sceneImage: str(""), sceneHue: num(200) }),
    fields: [
      f("sceneImage", "image"),
      f("sceneHue", "number", { min: 0, max: 360, labelKey: "imageHue" }),
      f("hotspots", "blocks", { blockType: "hotspot", max: 12, labelKey: "hotspots" }),
    ],
    defaults: { sceneImage: "", sceneHue: 200 },
    component: ContextualShoppingExperience,
    dataNeeds: ["products", "scenes", "persona"],
  }),
  comparison: entry({
    id: "comparison",
    icon: Scale,
    schema: z.object({ maxColumns: num(4), highlightDiffs: bool(true) }),
    fields: [f("maxColumns", "number", { min: 2, max: 6 }), f("highlightDiffs", "boolean")],
    defaults: { maxColumns: 4, highlightDiffs: true },
    component: ComparisonExperience,
    dataNeeds: ["products"],
    /* A lone product has nothing to compare — the grid takes over. */
    deviceRules: { minProducts: 2 },
  }),
};

/** Resolve a raw `view` setting value to its registry entry (grid fallback). */
export function experienceEntry(view: unknown): ExperienceRegistryEntry {
  return EXPERIENCE_REGISTRY[typeof view === "string" && view in EXPERIENCE_REGISTRY ? (view as ExperienceId) : "adaptive-grid"];
}
