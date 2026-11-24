"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Plus, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { defaultVariant, type StoreProduct, type StoreVariant } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { ProductImage } from "@repo/ui/components/product-image";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { useCart } from "@/components/cart-context";
import { InstallmentsLine } from "@/components/installments";
import { VariantSelect } from "@/components/variant-select";
import { useStoreFeatures } from "@/lib/features";

/**
 * Quick-view dialog opened from the product card — mount it only while open
 * (`{open && <QuickViewDialog …>}`) so it stays lazy.
 */
export function QuickViewDialog({ product: p, open, onOpenChange }: { product: StoreProduct; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { add } = useCart();
  const { on } = useStoreFeatures();
  const [qty, setQty] = React.useState(1);
  const [variant, setVariant] = React.useState<StoreVariant | null>(null);
  const [variantError, setVariantError] = React.useState(false);
  const needsPick = p.product.options.length > 0;
  const effVariant = needsPick ? variant : (variant ?? defaultVariant(p));
  const stock = effVariant ? effVariant.stock : p.stock;
  const price = effVariant?.price ?? p.price;
  const compareAt = effVariant ? effVariant.compareAtPrice : p.compareAtPrice;
  const out = needsPick ? Boolean(variant) && stock <= 0 : stock <= 0;
  const sale = compareAt && compareAt > price ? 1 - price / compareAt : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{(p.name[locale] ?? p.name.ar)}</DialogTitle>
          <DialogDescription className="sr-only">{t("quickView")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative">
            <ProductImage hue={p.imageHue} label={(p.name[locale] ?? p.name.ar)} className="aspect-square w-full rounded-xl" />
            {sale > 0 ? (
              <span className="bg-destructive text-destructive-foreground absolute start-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                {t("sale", { percent: formatPercent(sale, 0) })}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Star className="size-3 fill-warning text-warning" aria-hidden />
              <span className="num">{formatNumber(p.rating, { maximumFractionDigits: 1 })}</span>
              <span className="num">{t("reviews", { count: formatNumber(p.reviewsCount) })}</span>
            </span>
            <div className="flex items-baseline gap-2">
              <span className="num text-2xl font-bold">{formatMoney(price, locale)}</span>
              {sale > 0 && compareAt ? (
                <span className="text-muted-foreground num line-through">{formatMoney(compareAt, locale)}</span>
              ) : null}
            </div>
            {on("installments") ? <InstallmentsLine price={price} compact /> : null}
            <div>
              <VariantSelect product={p} value={variant} onSelect={(v) => { setVariant(v); setVariantError(false); }} />
              {variantError ? (
                <p className="text-destructive mt-1.5 text-xs" role="alert">
                  {t("pickVariant")}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border" role="group" aria-label={t("quantity")}>
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t("decrease")} disabled={out}>
                  <Minus aria-hidden />
                </Button>
                <span className="num w-8 text-center text-sm font-semibold">{formatNumber(qty)}</span>
                <Button variant="ghost" size="icon" onClick={() => setQty((q) => Math.min(Math.max(1, stock), q + 1))} aria-label={t("increase")} disabled={out}>
                  <Plus aria-hidden />
                </Button>
              </div>
              <Button
                className="flex-1"
                disabled={out}
                onClick={() => {
                  if (needsPick && !variant) {
                    setVariantError(true);
                    return;
                  }
                  add(p.id, qty, effVariant?.id);
                  toast.success(t("added"), { description: variant?.label ? `${(p.name[locale] ?? p.name.ar)} — ${variant.label}` : (p.name[locale] ?? p.name.ar) });
                  onOpenChange(false);
                }}
              >
                {out ? t("outOfStock") : t("addToCart")}
              </Button>
            </div>
            <Button variant="ghost" asChild className="self-start">
              <Link href={`/products/${p.id}`}>{t("viewProduct")}</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
