"use client";

import type { StoreProduct } from "@/lib/store-product";
import { ProductBuyPanel } from "./product-buy-panel";
import { ProductBreadcrumb, ProductTail } from "./product-detail-shared";
import { ProductGallery } from "./product-gallery";
import { useProductDetail } from "./use-product-detail";

/**
 * Immersive PDP (`pageExperiences.product = "immersive-product"`) — media
 * leads: the gallery takes ~60% of the row while the purchase column pins
 * itself to the viewport and reveals the long description behind a
 * progressive-disclosure toggle to keep the buy actions above the fold.
 */
export function ProductImmersive({ product: p }: { product: StoreProduct }) {
  const ctx = useProductDetail(p);
  return (
    <div className="container space-y-16 py-6" data-experience="immersive-product">
      <ProductBreadcrumb product={p} ctx={ctx} />
      <div className="grid items-start gap-8 lg:grid-cols-[3fr_2fr] lg:gap-10">
        <ProductGallery product={p} />
        <div className="lg:sticky lg:top-20">
          <ProductBuyPanel product={p} ctx={ctx} description="collapsed" />
        </div>
      </div>
      <ProductTail product={p} ctx={ctx} />
    </div>
  );
}
