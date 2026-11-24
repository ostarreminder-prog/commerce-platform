"use client";

import * as React from "react";
import { useInventoryLevels, useProductById, useProductList, useStoreList } from "@repo/api-client";
import type { InventoryLevel, LocalizedText, Product, ProductStatus } from "@repo/contracts";
import { placeholderHue } from "@repo/ui/lib/media";

/**
 * Flat storefront product view — joins the commerce `Product` (variants +
 * `placeholder:<hue>` media + `stats`) with its inventory levels so the
 * presentational components keep a single record: price/stock/rating/hue.
 */

/** Flat variant view — the unit the cart actually carries (price/stock per variant). */
export interface StoreVariant {
  id: string;
  sku: string;
  /** Joined option labels (e.g. "L" or "أحمر / L") — null for single-variant products. */
  label: string | null;
  optionValues: string[];
  price: number;
  compareAtPrice: number | null;
  stock: number;
  trackInventory: boolean;
}

export interface StoreProduct {
  id: string;
  /** Original commerce record (variants, media, stats) for commerce-aware consumers. */
  product: Product;
  name: LocalizedText;
  description: LocalizedText;
  status: ProductStatus;
  slug: string;
  categoryId: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  imageHue: number;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  variants: StoreVariant[];
}

/** Default cart variant — first in-stock, else the first variant. */
export const defaultVariant = (p: StoreProduct): StoreVariant | undefined => p.variants.find((v) => v.stock > 0) ?? p.variants[0];

export function toStoreProduct(p: Product, levels: InventoryLevel[]): StoreProduct {
  const variantIds = new Set(p.variants.map((v) => v.id));
  const mine = levels.filter((l) => variantIds.has(l.variantId));
  const stock = mine.reduce((sum, l) => sum + l.available, 0);
  const v0 = p.variants[0];
  return {
    id: p.id,
    product: p,
    name: p.name,
    description: p.description,
    status: p.status,
    slug: p.slug,
    categoryId: p.categoryIds[0] ?? "",
    sku: v0?.sku ?? "",
    price: v0?.price.amount ?? 0,
    compareAtPrice: v0?.compareAtPrice?.amount ?? null,
    stock,
    lowStockThreshold: mine[0]?.lowStockThreshold ?? 5,
    imageHue: placeholderHue(p.media[0]?.url) ?? 160,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    salesCount: p.stats.sold30d,
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      optionValues: v.optionValues,
      label: v.optionValues.length ? v.optionValues.join(" / ") : null,
      price: v.price.amount,
      compareAtPrice: v.compareAtPrice?.amount ?? null,
      stock: levels.filter((l) => l.variantId === v.id).reduce((s, l) => s + l.available, 0),
      trackInventory: v.trackInventory,
    })),
  };
}

/** All products joined with stock — the storefront's replacement for `useProducts`. */
export function useStoreProducts() {
  const products = useProductList();
  const levels = useInventoryLevels();
  const data = React.useMemo(
    () => (products.data && levels.data ? products.data.map((p) => toStoreProduct(p, levels.data)) : undefined),
    [products.data, levels.data],
  );
  return { ...products, data, isPending: products.isPending || levels.isPending };
}

/** Single product joined with stock — replaces `useProduct`. */
export function useStoreProduct(id: string) {
  const product = useProductById(id);
  const levels = useInventoryLevels();
  const data = React.useMemo(
    () => (product.data && levels.data ? toStoreProduct(product.data, levels.data) : undefined),
    [product.data, levels.data],
  );
  return { ...product, data, isPending: product.isPending || levels.isPending };
}

/** The single storefront tenant (spec store "nakhla" is `stores[0]`). */
export function useStore() {
  const q = useStoreList();
  return { ...q, data: q.data?.[0] };
}
