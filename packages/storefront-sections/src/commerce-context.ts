"use client";

import * as React from "react";
import type { Product } from "@repo/contracts";

/**
 * Bridge between the pure section/experience components and the host app's
 * commerce layer (cart, wishlist, quick view, client-side links). The
 * storefront supplies a real adapter; admin/preview contexts may supply a
 * partial one or none — components degrade to plain links gracefully.
 */
export interface SectionCommerceAdapter {
  /**
   * Host link component (e.g. `next/link`) — receives `href`, `className`
   * and `children`. Sections fall back to a plain `<a>` when absent.
   */
  linkComponent?: React.ElementType;
  /** Product detail href — defaults to `/p/<slug|id>` when absent. */
  productHref?: (product: Product) => string;
  /** Add a variant (or the product's default variant) to the cart. */
  addToCart?: (product: Product, options?: { variantId?: string; qty?: number }) => void;
  /** True when the product (any variant, or a specific one) sits in the cart. */
  inCart?: (productId: string, variantId?: string) => boolean;
  /** Guest/customer wishlist — `toggle` flips the product's saved state. */
  wishlist?: {
    has: (productId: string) => boolean;
    toggle: (product: Product) => void;
  };
  /** Open the host's quick-view dialog for the product. */
  quickView?: (product: Product) => void;
}

const CommerceAdapterContext = React.createContext<SectionCommerceAdapter | null>(null);

export function SectionCommerceProvider({
  adapter,
  children,
}: {
  adapter: SectionCommerceAdapter | null;
  children: React.ReactNode;
}) {
  return React.createElement(CommerceAdapterContext.Provider, { value: adapter }, children);
}

/** The injected commerce adapter, or null when the host app didn't provide one. */
export function useSectionCommerce(): SectionCommerceAdapter | null {
  return React.useContext(CommerceAdapterContext);
}

/** Product href via the adapter, with the `/p/<slug|id>` fallback sections used before adapters. */
export function productHref(adapter: SectionCommerceAdapter | null | undefined, product: Product): string {
  return adapter?.productHref?.(product) ?? `/p/${product.slug || product.id}`;
}

/** Adapter link component or a plain anchor fallback. */
export function commerceLink(adapter: SectionCommerceAdapter | null | undefined): React.ElementType {
  return adapter?.linkComponent ?? "a";
}
