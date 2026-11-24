"use client";

import { useTranslations } from "next-intl";
import { Separator } from "@repo/ui/components/separator";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";

export function SummaryRows({ subtotal, shipping, discount = 0, giftCard = 0, giftWrap = 0 }: { subtotal: number; shipping: number; discount?: number; giftCard?: number; giftWrap?: number }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const total = subtotal - discount + shipping + giftWrap;
  const payable = Math.max(0, total - giftCard);
  const vat = Math.round((total * 15) / 115);
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">{t("subtotal")}</dt>
        <dd className="num">{formatMoney(subtotal, locale)}</dd>
      </div>
      {discount > 0 ? (
        <div className="text-success flex justify-between">
          <dt>{t("discount")}</dt>
          <dd className="num">{formatMoney(-discount, locale)}</dd>
        </div>
      ) : null}
      <div className="flex justify-between">
        <dt className="text-muted-foreground">{t("shipping")}</dt>
        <dd className="num">{shipping === 0 ? t("free") : formatMoney(shipping, locale)}</dd>
      </div>
      {giftWrap > 0 ? (
        <div className="flex justify-between">
          <dt className="text-muted-foreground">{t("giftWrap")}</dt>
          <dd className="num">{formatMoney(giftWrap, locale)}</dd>
        </div>
      ) : null}
      <Separator className="my-3" />
      <div className="flex justify-between text-base font-semibold">
        <dt>{t("total")}</dt>
        <dd className="num">{formatMoney(total, locale)}</dd>
      </div>
      {giftCard > 0 ? (
        <>
          <div className="text-success flex justify-between">
            <dt>{t("giftCard")}</dt>
            <dd className="num">{formatMoney(-giftCard, locale)}</dd>
          </div>
          <div className="flex justify-between font-semibold">
            <dt>{t("payable")}</dt>
            <dd className="num">{formatMoney(payable, locale)}</dd>
          </div>
        </>
      ) : null}
      <p className="text-muted-foreground text-xs">{t("vat", { amount: formatMoney(vat, locale) })}</p>
    </dl>
  );
}
