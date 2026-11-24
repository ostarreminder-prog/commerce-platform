"use client";

import * as React from "react";
import { ChevronDown, GitCompareArrows, Heart, Minus, Plus, ShieldCheck, Star, Truck } from "lucide-react";
import type { StoreProduct } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { InstallmentsLine } from "@/components/installments";
import { ScarcityBadge, ViewersNow } from "@/components/scarcity";
import { VariantSelect } from "@/components/variant-select";
import { BackInStockButton } from "./back-in-stock";
import { DeliveryEstimate } from "./delivery-estimate";
import { ProductShippingInfo } from "./product-shipping-info";
import { ShareMenu } from "./share-menu";
import { SizeGuideButton } from "./size-guide";
import type { ProductDetailCtx } from "./use-product-detail";

/** How the description renders inside the buy column across page experiences. */
export type DescriptionMode = "inline" | "collapsed" | "hidden";

/**
 * PDP purchase column — title/rating/price/variants/qty/CTAs/trust. Shared by
 * every page-experience layout; `description` adapts its reveal mode and
 * `titleAs` keeps a single h1 when the layout shows its own (editorial).
 */
export function ProductBuyPanel({
  product: p,
  ctx,
  description = "inline",
  titleAs = "h1",
}: {
  product: StoreProduct;
  ctx: ProductDetailCtx;
  description?: DescriptionMode;
  titleAs?: "h1" | "p";
}) {
  const { t, locale, on, wishlist, compare, qty, setQty, variant, variantError, selectVariant, buyRef, stock, price, compareAt, out, sale, category, addToCart, toggleWishlist, toggleCompare } = ctx;
  const [expanded, setExpanded] = React.useState(false);
  const Title = titleAs;
  const desc = p.description[locale] ?? p.description.ar;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-primary text-sm font-medium">{category?.name[locale]}</p>
        <div className="flex items-start justify-between gap-3">
          <Title className={cn("font-bold", titleAs === "h1" ? "text-2xl sm:text-3xl" : "text-xl")}>{(p.name[locale] ?? p.name.ar)}</Title>
          <div className="flex shrink-0 items-center gap-1 pt-1">
            {on("wishlist") ? (
              <Button variant="outline" size="icon" aria-label={t("wishlist.title")} aria-pressed={wishlist.has(p.id)} onClick={toggleWishlist}>
                <Heart className={cn("size-4", wishlist.has(p.id) && "fill-destructive text-destructive")} aria-hidden />
              </Button>
            ) : null}
            {on("compare") ? (
              <Button variant="outline" size="icon" aria-label={t("compare.add")} aria-pressed={compare.has(p.id)} onClick={toggleCompare}>
                <GitCompareArrows className={cn("size-4", compare.has(p.id) && "text-primary")} aria-hidden />
              </Button>
            ) : null}
            <ShareMenu product={p} />
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <span className="flex" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Star key={i} className={cn("size-4", i < Math.round(p.rating) ? "fill-warning text-warning" : "text-muted")} />
            ))}
          </span>
          <span className="num">{formatNumber(p.rating, { maximumFractionDigits: 1 })}</span>
          <span className="num">{t("reviews", { count: formatNumber(p.reviewsCount) })}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-baseline gap-3">
          <span className="num text-3xl font-bold">{formatMoney(price, locale)}</span>
          {sale > 0 && compareAt ? (
            <>
              <span className="text-muted-foreground num text-lg line-through">{formatMoney(compareAt, locale)}</span>
              <span className="bg-destructive/10 text-destructive rounded-full px-2 py-0.5 text-xs font-semibold">{t("sale", { percent: formatPercent(sale, 0) })}</span>
            </>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">{t("vatIncluded")}</p>
      </div>
      {on("installments") ? (
        <div className="rounded-lg border border-dashed border-success/40 bg-success/5 px-3 py-2">
          <InstallmentsLine price={price} />
        </div>
      ) : null}
      {description === "inline" ? <p className="text-muted-foreground leading-relaxed">{desc}</p> : null}
      {description === "collapsed" ? (
        <div className="rounded-xl border">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start text-sm font-semibold"
            aria-expanded={expanded}
            onClick={() => setExpanded((o) => !o)}
          >
            {t("description")}
            <ChevronDown className={cn("text-muted-foreground size-4 shrink-0 transition-transform", expanded && "rotate-180")} aria-hidden />
          </button>
          {expanded ? <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed">{desc}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className={cn("text-sm font-medium", out ? "text-destructive" : stock <= p.lowStockThreshold ? "text-warning" : "text-success")}>
          {out ? t("outOfStock") : stock <= p.lowStockThreshold ? t("lowStock", { count: formatNumber(stock) }) : t("inStock")}
        </p>
        <ScarcityBadge product={p} />
        <ViewersNow seed={p.id} />
      </div>
      <div>
        <VariantSelect product={p} value={variant} onSelect={selectVariant} />
        {variantError ? (
          <p className="text-destructive mt-1.5 text-xs" role="alert">
            {t("pickVariant")}
          </p>
        ) : null}
        {variant ? <p className="text-muted-foreground num mt-1.5 text-xs">{t("sku", { sku: variant.sku })}</p> : null}
      </div>
      <SizeGuideButton categoryId={p.categoryId} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-lg border" role="group" aria-label={t("quantity")}>
          <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("decrease")} disabled={out}>
            <Minus aria-hidden />
          </Button>
          <span className="num w-10 text-center font-semibold" aria-live="polite">
            {formatNumber(qty)}
          </span>
          <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(Math.max(1, stock), q + 1))} aria-label={t("increase")} disabled={out}>
            <Plus aria-hidden />
          </Button>
        </div>
        {out && p.stock <= 0 ? (
          <BackInStockButton product={p} />
        ) : (
          <>
            <Button ref={buyRef} size="lg" className="flex-1" onClick={() => addToCart()}>
              {t("addToCart")}
            </Button>
            <Button size="lg" variant="outline" className="flex-1" onClick={() => addToCart(true)}>
              {t("buyNow")}
            </Button>
          </>
        )}
      </div>
      <DeliveryEstimate />
      <ul className="bg-muted/40 space-y-2 rounded-lg p-4 text-sm">
        <li className="flex items-center gap-2">
          <Truck className="text-primary size-4" aria-hidden />
          {t("delivery", { days: "1-4" })}
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck className="text-primary size-4" aria-hidden />
          {t("trust.returns")} · {t("trust.secure")}
        </li>
      </ul>
      <ProductShippingInfo />
    </div>
  );
}
