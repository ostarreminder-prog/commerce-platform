"use client";

import Link from "next/link";
import { ChevronDown, RotateCcw, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReturnPolicy, useShippingSettings } from "@repo/api-client";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";

/**
 * "Shipping & returns" accordion block on the product page — real values from
 * the merchant's shipping zones + return policy (settings screens), not copy.
 */
export function ProductShippingInfo() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { data: shipping } = useShippingSettings();
  const { data: policy } = useReturnPolicy();
  const zones = shipping?.zones ?? [];

  return (
    <div className="divide-y rounded-xl border">
      <details className="group px-4 py-3 open:bg-muted/30">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <Truck className="text-primary size-4" aria-hidden />
          {t("shippingInfo.title")}
          <ChevronDown className="text-muted-foreground ms-auto size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="text-muted-foreground space-y-2 pt-3 text-sm">
          {shipping?.freeShippingThreshold ? <p>{t("shippingInfo.free", { amount: formatMoney(shipping.freeShippingThreshold.amount, locale) })}</p> : null}
          {zones.length ? (
            zones.map((z) => (
              <div key={z.id}>
                <p className="text-foreground font-medium">{z.name}</p>
                <ul className="space-y-1">
                  {z.rates.map((r, i) => (
                    <li key={i} className="num flex items-center justify-between gap-3">
                      <span>{r.conditions || t(`shippingInfo.rateType.${r.type}`)}</span>
                      <span>{formatMoney(r.price.amount, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p>{t("delivery", { days: "1-4" })}</p>
          )}
          {shipping ? <p>{t("shippingInfo.handling", { days: formatNumber(shipping.handlingDays) })}</p> : null}
        </div>
      </details>
      <details className="group px-4 py-3 open:bg-muted/30">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium [&::-webkit-details-marker]:hidden">
          <RotateCcw className="text-primary size-4" aria-hidden />
          {t("shippingInfo.returns")}
          <ChevronDown className="text-muted-foreground ms-auto size-4 transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <div className="text-muted-foreground space-y-1.5 pt-3 text-sm">
          <p>{t("shippingInfo.returnsText", { days: formatNumber(policy?.windowDays ?? 0) })}</p>
          <Link href="/returns/request" className="text-primary hover:underline">
            {t("returns.title")}
          </Link>
        </div>
      </details>
    </div>
  );
}
