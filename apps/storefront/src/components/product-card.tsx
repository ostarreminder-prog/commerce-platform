"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, Heart, Plus, Scale, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StoreProduct } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { ProductImage } from "@repo/ui/components/product-image";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { QuickViewDialog } from "@/features/product/quick-view-dialog";
import { useStoreFeatures } from "@/lib/features";
import { useCart } from "./cart-context";
import { COMPARE_MAX, useCompare } from "./compare-context";
import { InstallmentsLine } from "./installments";
import { ScarcityBadge, ViewersNow } from "./scarcity";
import { useWishlist } from "./wishlist-context";

/** Small overlay icon button (wishlist / quick view / compare) on the card image. */
function CardIcon({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "bg-background/90 flex size-8 items-center justify-center rounded-full shadow-sm transition-colors hover:bg-background",
        active && "text-destructive",
      )}
    >
      {children}
    </button>
  );
}

export function ProductCard({ product: p, className }: { product: StoreProduct; className?: string }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { add } = useCart();
  const { on } = useStoreFeatures();
  const wishlist = useWishlist();
  const compare = useCompare();
  const [quickView, setQuickView] = React.useState(false);
  const out = p.stock <= 0;
  const sale = p.compareAtPrice && p.compareAtPrice > p.price ? 1 - p.price / p.compareAtPrice : 0;

  const toggleWishlist = () => {
    const saved = wishlist.toggle(p.id);
    toast.success(saved ? t("wishlist.added") : t("wishlist.removed"), { description: (p.name[locale] ?? p.name.ar) });
  };
  const toggleCompare = () => {
    const result = compare.add(p);
    if (result === "added") toast.success(t("compare.added"), { description: (p.name[locale] ?? p.name.ar) });
    else if (result === "max") toast.error(t("compare.maxReached", { max: formatNumber(COMPARE_MAX) }));
    else if (result === "category") toast.error(t("compare.sameCategory"));
  };

  return (
    <div className={cn("group relative flex flex-col", className)}>
      <Link href={`/products/${p.id}`} className="relative block overflow-hidden rounded-xl">
        <ProductImage hue={p.imageHue} label={(p.name[locale] ?? p.name.ar)} className="aspect-square w-full transition-transform duration-300 group-hover:scale-105" />
        {sale > 0 ? (
          <span className="bg-destructive text-destructive-foreground absolute start-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold">
            {t("sale", { percent: formatPercent(sale, 0) })}
          </span>
        ) : null}
        {out ? <span className="bg-background/90 absolute inset-x-2 bottom-2 rounded-md py-1 text-center text-xs font-medium">{t("outOfStock")}</span> : null}
      </Link>
      <div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5">
        {on("wishlist") ? (
          <CardIcon label={t("wishlist.title")} active={wishlist.has(p.id)} onClick={toggleWishlist}>
            <Heart className={cn("size-4", wishlist.has(p.id) && "fill-destructive")} aria-hidden />
          </CardIcon>
        ) : null}
        {on("quickView") ? (
          <CardIcon label={t("quickView")} onClick={() => setQuickView(true)}>
            <Eye className="size-4" aria-hidden />
          </CardIcon>
        ) : null}
        {on("compare") ? (
          <CardIcon label={t("compare.add")} active={compare.has(p.id)} onClick={toggleCompare}>
            <Scale className="size-4" aria-hidden />
          </CardIcon>
        ) : null}
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-1">
        <Link href={`/products/${p.id}`} className="line-clamp-2 text-sm font-medium hover:underline">
          {(p.name[locale] ?? p.name.ar)}
        </Link>
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Star className="size-3 fill-warning text-warning" aria-hidden />
          <span className="num">{formatNumber(p.rating, { maximumFractionDigits: 1 })}</span>
          <span className="num">{t("reviews", { count: formatNumber(p.reviewsCount) })}</span>
        </span>
        <ScarcityBadge product={p} />
        <ViewersNow seed={p.id} />
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="num font-semibold">{formatMoney(p.price, locale)}</p>
            {sale > 0 && p.compareAtPrice ? <p className="text-muted-foreground num text-xs line-through">{formatMoney(p.compareAtPrice, locale)}</p> : null}
            {on("installments") ? <InstallmentsLine price={p.price} compact /> : null}
          </div>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={out}
            aria-label={`${t("addToCart")}: ${(p.name[locale] ?? p.name.ar)}`}
            onClick={() => {
              add(p.id);
              toast.success(t("added"), { description: (p.name[locale] ?? p.name.ar) });
            }}
          >
            <Plus aria-hidden />
          </Button>
        </div>
      </div>
      {quickView ? <QuickViewDialog product={p} open={quickView} onOpenChange={setQuickView} /> : null}
    </div>
  );
}
