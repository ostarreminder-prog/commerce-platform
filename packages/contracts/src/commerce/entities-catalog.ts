import type { ActorRef, EntityRef, ISODate, LocalizedText, MediaRef, Money, Seo, Slug } from "../common";

/* 4.3 Product */
export type ProductType = "physical" | "digital" | "service";
export type ProductStatus = "draft" | "active" | "archived";

export interface Variant {
  id: string;
  optionValues: string[];
  sku: string;
  barcode: string | null;
  price: Money;
  compareAtPrice: Money | null;
  cost: Money | null;
  weightGrams: number;
  dimensionsCm: { l: number; w: number; h: number } | null;
  trackInventory: boolean;
  allowBackorder: boolean;
  imageId: string | null;
}

export interface Product {
  id: string;
  name: LocalizedText;
  slug: Slug;
  description: LocalizedText;
  shortDescription: LocalizedText;
  type: ProductType;
  status: ProductStatus;
  media: MediaRef[];
  categoryIds: string[];
  collectionIds: string[];
  brand: string | null;
  tags: string[];
  options: { name: LocalizedText; values: LocalizedText[] }[];
  variants: Variant[];
  seo: Seo;
  requiresShipping: boolean;
  taxable: boolean;
  aiNotes: string;
  publishedAt: ISODate | null;
  stats: { sold30d: number; revenue30d: Money; views30d: number; conversations30d: number };
  /** Aggregated review metrics (spec §8.3) — storefront cards + sorting. */
  rating: number;
  reviewsCount: number;
}

/**
 * Media library entry — uploaded/editable images referenced by url across
 * products, categories, theme sections and the store logo. `url` is either a
 * real image (`https:`/`data:`/`blob:`) or a `placeholder:<hue>` fixture url.
 */
export interface Media {
  id: string;
  url: string;
  altAr?: string;
  altEn?: string;
  width?: number;
  height?: number;
  mime: string;
  sizeBytes: number;
  createdAt: ISODate;
}

/**
 * Merchant-managed brand (`/brands`). `Product.brand` stays the display string
 * (it feeds collection rules, storefront labels and imports) — the catalog API
 * keeps it in sync with `name.ar` on rename and clears it on delete.
 */
export interface Brand {
  id: string;
  name: LocalizedText;
  slug: Slug;
  description: LocalizedText;
  logo: MediaRef | null;
  website: string | null;
  status: "active" | "archived";
  createdAt: ISODate;
}

/**
 * Storefront product Q&A — a customer question pending a merchant answer.
 * Asked publicly on the product page; the merchant answers from the catalog
 * side (mock: stays `pending` until staff answers — honest, not auto-answered).
 */
export interface ProductQuestion {
  id: string;
  productId: string;
  authorName: string;
  question: string;
  answer: string | null;
  answeredBy: ActorRef | null;
  status: "pending" | "answered";
  createdAt: ISODate;
}

/* 4.4 Category / Collection */
export interface Category {
  id: string;
  name: LocalizedText;
  slug: Slug;
  description: LocalizedText;
  image: MediaRef | null;
  seo: Seo;
  parentId: string | null;
  sortOrder: number;
}

export type CollectionRuleField = "price" | "tag" | "category" | "brand" | "stock";

export interface Collection {
  id: string;
  name: LocalizedText;
  slug: Slug;
  description: LocalizedText;
  image: MediaRef | null;
  seo: Seo;
  type: "manual" | "automatic";
  productIds: string[];
  rules: { field: CollectionRuleField; op: "eq" | "neq" | "gt" | "lt" | "contains"; value: string }[];
  match: "all" | "any";
}

/* 4.5 Inventory */
export interface Location {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  /** Order stock is decremented from the default location unless one is picked. */
  isDefault: boolean;
  status: "active" | "inactive";
}

export interface InventoryLevel {
  variantId: string;
  locationId: string;
  onHand: number;
  reserved: number;
  available: number;
  lowStockThreshold: number;
}

export type MovementReason = "sale" | "return" | "adjustment" | "import" | "cancellation" | "damage";

export interface InventoryMovement {
  id: string;
  variantId: string;
  /** Location the stock moved at — null on legacy rows (single-warehouse era). */
  locationId?: string | null;
  delta: number;
  reason: MovementReason;
  note: string | null;
  reference: EntityRef | null;
  actor: ActorRef;
  at: ISODate;
  balanceAfter: number;
}
