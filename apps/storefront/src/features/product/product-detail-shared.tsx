"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import type { StoreProduct } from "@/lib/store-product";
import { ProductCard } from "@/components/product-card";
import { RecentlyViewedStrip } from "@/features/recently-viewed/recently-viewed-strip";
import { ProductQA } from "./product-qa";
import { ProductReviews } from "./product-reviews";
import { ProductSiblings } from "./product-siblings";
import { ProductSpecs } from "./product-specs";
import { StickyBuyBar } from "./sticky-buy-bar";
import type { ProductDetailCtx } from "./use-product-detail";

/** Breadcrumb shared by all PDP page experiences. */
export function ProductBreadcrumb({ product: p, ctx }: { product: StoreProduct; ctx: ProductDetailCtx }) {
  const { t, locale, dir, category } = ctx;
  const Sep = dir === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <nav aria-label="breadcrumb" className="text-muted-foreground flex items-center gap-1 text-sm">
      <Link href="/" className="hover:text-foreground">
        {t("home")}
      </Link>
      <Sep className="size-4" aria-hidden />
      <span>{category?.name[locale]}</span>
      <Sep className="size-4" aria-hidden />
      <span className="text-foreground truncate">{(p.name[locale] ?? p.name.ar)}</span>
    </nav>
  );
}

/**
 * Everything below the buy area — specs, siblings, Q&A, reviews, related,
 * recently-viewed, the mobile sticky bar and the chat FAB. Identical across
 * page experiences so each variant stays a pure layout change.
 */
export function ProductTail({ product: p, ctx }: { product: StoreProduct; ctx: ProductDetailCtx }) {
  const { t, variant, buyRef, price, out, related, contractVariant, addToCart } = ctx;
  return (
    <>
      <ProductSpecs product={p} variant={contractVariant} />
      <ProductSiblings product={p} />
      <ProductQA productId={p.id} />
      <ProductReviews product={p} />
      {related.length > 0 ? (
        <section className="space-y-5">
          <h2 className="text-xl font-bold">{t("related")}</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      ) : null}
      <RecentlyViewedStrip excludeId={p.id} />
      <StickyBuyBar product={p} price={price} variant={variant?.label ?? null} disabled={out} watchRef={buyRef} onAdd={() => addToCart()} />
      <button
        type="button"
        className="bg-primary text-primary-foreground fixed bottom-5 end-5 z-30 flex items-center gap-2 rounded-full px-4 py-3 text-sm font-medium shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle className="size-5" aria-hidden />
        <span className="hidden sm:inline">{t("chat")}</span>
        <span className="sr-only sm:hidden">{t("chat")}</span>
      </button>
    </>
  );
}
