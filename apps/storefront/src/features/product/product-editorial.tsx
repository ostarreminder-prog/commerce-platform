"use client";

import { Star } from "lucide-react";
import type { StoreProduct } from "@/lib/store-product";
import { ProductImage } from "@repo/ui/components/product-image";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { ProductBuyPanel } from "./product-buy-panel";
import { ProductBreadcrumb, ProductTail } from "./product-detail-shared";
import { useProductDetail } from "./use-product-detail";

/**
 * Editorial PDP (`pageExperiences.product = "editorial-showcase"`) — magazine
 * split: a full-bleed hero image band, then a story column (eyebrow, headline,
 * pull-quote styled description) beside a compact buy-module card. Same data
 * and actions as the classic layout — composition only.
 */
export function ProductEditorial({ product: p }: { product: StoreProduct }) {
  const ctx = useProductDetail(p);
  const { t, locale, category } = ctx;
  const name = p.name[locale] ?? p.name.ar;
  const desc = p.description[locale] ?? p.description.ar;
  return (
    <div className="space-y-12 py-6" data-experience="editorial-showcase">
      <div className="container space-y-8">
        <ProductBreadcrumb product={p} ctx={ctx} />
        <ProductImage hue={p.imageHue} label={name} className="aspect-[16/9] w-full rounded-3xl sm:aspect-[21/9]" />
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="max-w-2xl space-y-6">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">{category?.name[locale]}</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{name}</h1>
            <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <span className="flex" aria-hidden>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={cn("size-4", i < Math.round(p.rating) ? "fill-warning text-warning" : "text-muted")} />
                ))}
              </span>
              <span className="num">{formatNumber(p.rating, { maximumFractionDigits: 1 })}</span>
              <span className="num">{t("reviews", { count: formatNumber(p.reviewsCount) })}</span>
            </div>
            {desc ? (
              <blockquote className="border-primary/40 space-y-2 border-s-4 ps-6">
                <p className="text-xl leading-relaxed font-medium sm:text-2xl">{desc}</p>
              </blockquote>
            ) : null}
          </article>
          <div className="bg-card rounded-2xl border p-5 shadow-sm lg:sticky lg:top-20">
            <ProductBuyPanel product={p} ctx={ctx} description="hidden" titleAs="p" />
          </div>
        </div>
      </div>
      <div className="container space-y-16">
        <ProductTail product={p} ctx={ctx} />
      </div>
    </div>
  );
}
