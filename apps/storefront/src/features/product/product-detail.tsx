"use client";

import type { StoreProduct } from "@/lib/store-product";
import { ProductBuyPanel } from "./product-buy-panel";
import { ProductBreadcrumb, ProductTail } from "./product-detail-shared";
import { ProductGallery } from "./product-gallery";
import { useProductDetail } from "./use-product-detail";

/**
 * Classic PDP layout (default `pageExperiences.product`) — two-column
 * gallery + purchase column. The `data-experience` marker mirrors the
 * section-level attribute so e2e/analytics can detect the active variant.
 */
export function ProductDetail({ product: p }: { product: StoreProduct }) {
  const ctx = useProductDetail(p);
  return (
    <div className="container space-y-16 py-6" data-experience="classic">
      <ProductBreadcrumb product={p} ctx={ctx} />
      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <ProductGallery product={p} />
        <ProductBuyPanel product={p} ctx={ctx} />
      </div>
      <ProductTail product={p} ctx={ctx} />
    </div>
  );
}
