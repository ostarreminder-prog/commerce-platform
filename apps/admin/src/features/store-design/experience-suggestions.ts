import type { Category, Collection, Product, ThemeSection } from "@repo/contracts";
import type { ExperienceId } from "@repo/storefront-sections/editor";

/* ---- Rule-based experience suggestions (mirrors quality-audit.ts style) ---- */

export interface SuggestionContext {
  products: Product[];
  categories: Category[];
  collections?: Collection[];
}

export type SuggestionReason =
  | "single-product"
  | "few-products"
  | "variants-rich"
  | "media-rich"
  | "mixed-categories"
  | "long-list";

export interface ExperienceSuggestion {
  experienceId: ExperienceId;
  /** Key under `msg.experience.reason` — explains why the rule fired. */
  reasonKey: SuggestionReason;
  params?: Record<string, string | number>;
}

const ids = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const str = (v: unknown, d = "") => (typeof v === "string" ? v : d);
const num = (v: unknown, d = 0) => (typeof v === "number" ? v : d);

/** Products the section would render: picked ids, else active catalog up to `limit`. */
export function sectionProducts(section: ThemeSection, ctx: SuggestionContext): Product[] {
  const byId = new Map(ctx.products.map((p) => [p.id, p]));
  const picked = ids(section.settings.productIds)
    .map((id) => byId.get(id))
    .filter((p): p is Product => Boolean(p));
  const list = picked.length ? picked : ctx.products.filter((p) => p.status === "active");
  return list.slice(0, Math.max(1, num(section.settings.limit, 8)));
}

/**
 * Suggest a `view` experience for a product section from catalog shape +
 * section config. Returns an empty list when the current view already fits.
 */
export function suggestExperiences(ctx: SuggestionContext, template: string, section: ThemeSection): ExperienceSuggestion[] {
  const current = str(section.settings.view, "adaptive-grid");
  const list = sectionProducts(section, ctx);
  const out: ExperienceSuggestion[] = [];
  const push = (experienceId: ExperienceId, reasonKey: SuggestionReason, params?: Record<string, string | number>) => {
    if (experienceId !== current) out.push({ experienceId, reasonKey, params });
  };

  if (!list.length) return out;

  /* A lone product deserves the spotlight, not a one-cell grid. */
  if (list.length === 1) push("immersive-product", "single-product");
  /* Small curated sets shine in a magazine layout. */
  else if (list.length <= 4) push("editorial-showcase", "few-products", { count: list.length });

  /* Option-rich catalogs (most items carry variants) benefit from comparison. */
  const withOptions = list.filter((p) => p.options.length > 0 || p.variants.length > 1).length;
  if (list.length >= 3 && withOptions / list.length >= 0.5) {
    push("comparison", "variants-rich", { count: withOptions });
  }

  /* Media-rich sections (most items carry galleries) suit visual discovery. */
  const mediaRich = list.filter((p) => p.media.length >= 2).length;
  if (list.length >= 3 && mediaRich / list.length >= 0.6) {
    push("visual-discovery", "media-rich", { count: mediaRich });
  }

  /* A catalog slice spanning many categories reads better organized contextually. */
  const categoryCount = new Set(list.flatMap((p) => p.categoryIds)).size;
  if (categoryCount >= 3) push("contextual-shopping", "mixed-categories", { count: categoryCount });

  /* Long lists are safest on the dense grid. */
  if (list.length >= 12) push("adaptive-grid", "long-list", { count: list.length });

  return out.slice(0, 2);
}
