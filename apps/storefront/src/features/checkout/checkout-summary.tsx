"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { ProductImage } from "@repo/ui/components/product-image";
import { Textarea } from "@repo/ui/components/textarea";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { SummaryRows } from "../cart/order-summary";
import { GIFT_WRAP_FEE } from "./checkout-constants";
import type { CartLine } from "@/components/cart-context";
import type { CouponFail } from "@/lib/coupon";

export function OrderSummaryCard({
  lines,
  subtotal,
  shipping,
  discount,
  giftCard = 0,
  giftWrap,
  note,
  onNote,
  onGiftWrap,
  couponFail,
}: {
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  discount: number;
  giftCard?: number;
  /** Gift-wrap state — `onGiftWrap` toggles it (fee added to the total). */
  giftWrap: boolean;
  note: string;
  onNote: (v: string) => void;
  onGiftWrap: (v: boolean) => void;
  couponFail?: CouponFail | null;
}) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  return (
    <Card className="h-fit lg:sticky lg:top-36">
      <CardContent className="space-y-5 p-5">
        <h2 className="font-semibold">{t("summary")}</h2>
        <ul className="space-y-3">
          {lines.map(({ key, product: p, variant, qty }) => (
            <li key={key} className="flex items-center gap-3">
              <span className="relative shrink-0">
                <ProductImage hue={p.imageHue} label={(p.name[locale] ?? p.name.ar)} className="size-14 rounded-lg" />
                <span className="bg-foreground text-background num absolute -end-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold">
                  {formatNumber(qty)}
                </span>
              </span>
              <span className="line-clamp-2 flex-1 text-sm">
                {(p.name[locale] ?? p.name.ar)}
                {variant.label ? <span className="text-muted-foreground block text-xs">{variant.label}</span> : null}
              </span>
              <span className="num text-sm font-medium">{formatMoney(variant.price * qty, locale)}</span>
            </li>
          ))}
        </ul>
        {couponFail ? (
          <p className="text-destructive text-xs" role="alert">
            {t(`couponErrors.${couponFail}`)}
          </p>
        ) : null}
        <div className="space-y-3 border-t pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={giftWrap} onCheckedChange={(v) => onGiftWrap(v === true)} aria-label={t("giftWrap")} />
            <span className="flex-1">{t("giftWrap")}</span>
            <span className="text-muted-foreground num text-xs">+{formatMoney(GIFT_WRAP_FEE, locale)}</span>
          </label>
          <Textarea rows={2} value={note} onChange={(e) => onNote(e.target.value)} placeholder={t("orderNotePlaceholder")} aria-label={t("orderNote")} />
        </div>
        <SummaryRows subtotal={subtotal} shipping={shipping} discount={discount} giftCard={giftCard} giftWrap={giftWrap ? GIFT_WRAP_FEE : 0} />
      </CardContent>
    </Card>
  );
}
