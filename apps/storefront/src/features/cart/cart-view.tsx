"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Star, Trash2, Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCouponList, useLoyaltyAccount, useLoyaltySettings } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { ProductImage } from "@repo/ui/components/product-image";
import { Progress } from "@repo/ui/components/progress";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { FREE_SHIPPING_FROM, SHIPPING_FEE, useCart } from "@/components/cart-context";
import { useSession } from "@/components/session-context";
import { evaluateCoupon, readCouponCode, writeCouponCode, type CouponFail } from "@/lib/coupon";
import { SummaryRows } from "./order-summary";

export function CartView() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { lines, count, subtotal, ready, setQty, remove } = useCart();
  const { data: coupons = [], isPending: couponsPending } = useCouponList();
  const { effective: customer } = useSession();
  const [code, setCode] = React.useState("");
  const [applied, setApplied] = React.useState<string | null>(null);
  const [fail, setFail] = React.useState<CouponFail | null>(null);

  /* A saved coupon survives refresh — restored once, then re-evaluated live
   * so scope/min-order changes follow the cart contents. */
  React.useEffect(() => {
    setApplied(readCouponCode());
  }, []);

  const result = React.useMemo(
    () => (applied && !couponsPending ? evaluateCoupon(applied, coupons, lines, customer) : null),
    [applied, coupons, couponsPending, lines, customer],
  );
  React.useEffect(() => {
    if (applied && result && !result.ok) {
      setApplied(null);
      writeCouponCode(null);
      setFail(result.reason ?? "invalid");
    }
  }, [applied, result]);

  if (!ready)
    return (
      <div className="container grid gap-8 py-10 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    );

  if (lines.length === 0)
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShoppingBag}
          title={t("cartEmpty")}
          description={t("cartEmptyText")}
          action={
            <Button asChild>
              <Link href="/">{t("continue")}</Link>
            </Button>
          }
        />
      </div>
    );

  const discount = result?.ok ? result.discount : 0;
  const shipping = result?.freeShipping || subtotal - discount >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const left = FREE_SHIPPING_FROM - (subtotal - discount);

  return (
    <div className="container space-y-6 py-8">
      <h1 className="text-2xl font-bold">
        {t("cartTitle")} <span className="text-muted-foreground num text-base font-normal">({t("items", { count: formatNumber(count) })})</span>
      </h1>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-primary/5 space-y-2 rounded-xl border p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Truck className="text-primary size-4" aria-hidden />
              {left > 0 ? t("freeShippingLeft", { amount: formatMoney(left, locale) }) : t("freeShippingDone")}
            </p>
            <Progress value={Math.min(100, ((subtotal - discount) / FREE_SHIPPING_FROM) * 100)} aria-label={t("shipping")} />
          </div>
          <ul className="divide-y rounded-xl border">
            {lines.map(({ key, product: p, variant, qty }) => (
              <li key={key} className="flex gap-4 p-4">
                <Link href={`/products/${p.id}`} className="shrink-0">
                  <ProductImage hue={p.imageHue} label={(p.name[locale] ?? p.name.ar)} className="size-20 rounded-lg sm:size-24" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/products/${p.id}`} className="line-clamp-2 font-medium hover:underline">
                      {(p.name[locale] ?? p.name.ar)}
                    </Link>
                    <span className="num shrink-0 font-semibold">{formatMoney(variant.price * qty, locale)}</span>
                  </div>
                  <p className="text-muted-foreground num text-xs">
                    {variant.label ? `${variant.label} · ` : ""}
                    {formatMoney(variant.price, locale)}
                    {variant.trackInventory && variant.stock < qty ? ` · ${t("lowStock", { count: formatNumber(Math.max(0, variant.stock)) })}` : ""}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-lg border" role="group" aria-label={`${t("quantity")}: ${(p.name[locale] ?? p.name.ar)}`}>
                      <Button variant="ghost" size="icon-sm" onClick={() => setQty(key, qty - 1)} aria-label={t("decrease")}>
                        <Minus aria-hidden />
                      </Button>
                      <span className="num w-8 text-center text-sm font-semibold">{formatNumber(qty)}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={variant.trackInventory && qty >= variant.stock}
                        onClick={() => setQty(key, qty + 1)}
                        aria-label={t("increase")}
                      >
                        <Plus aria-hidden />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => remove(key)}>
                      <Trash2 aria-hidden />
                      {t("remove")}
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <Card className="h-fit lg:sticky lg:top-36">
          <CardContent className="space-y-5 p-5">
            <h2 className="font-semibold">{t("summary")}</h2>
            <form
              className="space-y-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                const next = code.trim();
                if (!next) return;
                const r = evaluateCoupon(next, coupons, lines, customer);
                if (r.ok) {
                  setApplied(next.toUpperCase());
                  writeCouponCode(next);
                  setFail(null);
                } else {
                  setApplied(null);
                  writeCouponCode(null);
                  setFail(r.reason ?? "invalid");
                }
              }}
            >
              <div className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("coupon")} aria-label={t("coupon")} dir="ltr" className="uppercase" />
                <Button type="submit" variant="outline">
                  {t("apply")}
                </Button>
              </div>
              {result?.ok ? (
                <p className="text-success flex items-center justify-between gap-2 text-xs">
                  <span>
                    {t("couponAppliedCode", { code: applied ?? "" })}
                    {result.freeShipping ? ` · ${t("free")}` : result.discount > 0 ? ` · -${formatMoney(result.discount, locale)}` : ""}
                  </span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
                    onClick={() => {
                      setApplied(null);
                      setCode("");
                      writeCouponCode(null);
                    }}
                  >
                    <X className="size-3.5" aria-hidden />
                    {t("couponRemove")}
                  </button>
                </p>
              ) : null}
              {fail ? (
                <p className="text-destructive text-xs" role="alert">
                  {t(`couponErrors.${fail}`)}
                </p>
              ) : null}
            </form>
            <SummaryRows subtotal={subtotal} shipping={shipping} discount={discount} />
            <EarnPointsLine subtotal={subtotal} discount={discount} />
            <Button size="lg" className="w-full" asChild>
              <Link href="/checkout">{t("checkout")}</Link>
            </Button>
            <Button variant="link" className="w-full" asChild>
              <Link href="/">{t("continue")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** "You'll earn N points" teaser — shown when the loyalty program is on. */
function EarnPointsLine({ subtotal, discount }: { subtotal: number; discount: number }) {
  const t = useTranslations("store");
  const { data: settings } = useLoyaltySettings();
  const { effective } = useSession();
  const { data: account } = useLoyaltyAccount(effective?.id ?? "");
  if (!settings?.enabled || subtotal <= 0) return null;
  const earn = Math.floor(((subtotal - discount) / 100) * settings.earnRate);
  if (earn <= 0) return null;
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Star className="text-primary size-3.5" aria-hidden />
      {t("earnPoints", { points: formatNumber(earn) })}
      {account ? ` · ${t("pointsBalance", { points: formatNumber(account.points) })}` : ""}
    </p>
  );
}
