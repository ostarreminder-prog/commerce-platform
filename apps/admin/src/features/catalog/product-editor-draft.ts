import type { MediaRef, Product } from "@repo/contracts";

export const uid = () => `v_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export interface VariantDraft {
  id: string;
  optionValues: string[];
  sku: string;
  barcode: string;
  price: string;
  compareAtPrice: string;
  cost: string;
  weightGrams: string;
  /** MediaRef id inside `Draft.media` assigned to this variant (spec §5.8 image column). */
  imageId: string | null;
}

export interface Draft {
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  shortDescriptionAr: string;
  slug: string;
  status: Product["status"];
  categoryIds: string[];
  collectionIds: string[];
  brand: string;
  tags: string[];
  requiresShipping: boolean;
  taxable: boolean;
  aiNotes: string;
  seoTitle: string;
  seoDescription: string;
  media: MediaRef[];
  options: { nameAr: string; values: string }[];
  variants: VariantDraft[];
}

export const blankVariant = (): VariantDraft => ({ id: uid(), optionValues: [], sku: "", barcode: "", price: "", compareAtPrice: "", cost: "", weightGrams: "250", imageId: null });

export const blank: Draft = {
  nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "", shortDescriptionAr: "", slug: "", status: "draft",
  categoryIds: [], collectionIds: [], brand: "", tags: [], requiresShipping: true, taxable: true, aiNotes: "",
  seoTitle: "", seoDescription: "", media: [], options: [],
  variants: [blankVariant()],
};

export const fromProduct = (p: Product): Draft => ({
  nameAr: p.name.ar, nameEn: p.name.en ?? "", descriptionAr: p.description.ar, descriptionEn: p.description.en ?? "",
  shortDescriptionAr: p.shortDescription.ar, slug: p.slug, status: p.status, categoryIds: p.categoryIds, collectionIds: p.collectionIds,
  brand: p.brand ?? "", tags: p.tags, requiresShipping: p.requiresShipping, taxable: p.taxable, aiNotes: p.aiNotes,
  seoTitle: p.seo.title, seoDescription: p.seo.description, media: p.media,
  options: p.options.map((o) => ({ nameAr: o.name.ar, values: o.values.map((v) => v.ar).join("، ") })),
  variants: p.variants.map((v) => ({
    id: v.id, optionValues: v.optionValues, sku: v.sku, barcode: v.barcode ?? "",
    price: String(v.price.amount / 100), compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice.amount / 100) : "",
    cost: v.cost ? String(v.cost.amount / 100) : "", weightGrams: String(v.weightGrams), imageId: v.imageId,
  })),
});

/** sessionStorage-backed autosave for the *new product* form (draft lifecycle). */
const DRAFT_KEY = "product-draft:new";
export const draftStore = {
  load: (): Draft | null => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw) as Draft;
      return d && Array.isArray(d.variants) ? d : null;
    } catch {
      return null;
    }
  },
  save: (d: Draft) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      /* quota/serialization edge — autosave is best-effort */
    }
  },
  clear: () => sessionStorage.removeItem(DRAFT_KEY),
};

/** Cartesian product of option values; existing variant fields are preserved by optionValues key. */
export function buildVariants(options: Draft["options"], prev: VariantDraft[]): VariantDraft[] {
  const sets = options
    .map((o) => ({ name: o.nameAr.trim(), values: o.values.split(/[،,]/).map((s) => s.trim()).filter(Boolean) }))
    .filter((o) => o.name && o.values.length);
  if (!sets.length) return prev.length ? prev.filter((v) => !v.optionValues.length).slice(0, 1) : [blankVariant()];
  const combos = sets.reduce<string[][]>((acc, s) => acc.flatMap((a) => s.values.map((v) => [...a, v])), [[]]);
  return combos.map((optionValues) => {
    const key = optionValues.join(" / ");
    const keep = prev.find((v) => v.optionValues.join(" / ") === key);
    return keep ?? { ...blankVariant(), optionValues, price: prev[0]?.price ?? "", weightGrams: prev[0]?.weightGrams ?? "250" };
  });
}
