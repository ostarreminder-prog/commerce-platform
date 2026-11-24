"use client";

import { CreditCard, Download, FileDown, MapPin, MessageSquareText, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MediaRef, Order } from "@repo/contracts";
import { useOrderDigitalDeliveries } from "@repo/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ProductImage } from "@repo/ui/components/product-image";
import { Separator } from "@repo/ui/components/separator";
import { isRealImageUrl } from "@repo/ui/lib/media";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";

/** Mock media URLs carry the display hue as `placeholder:<hue>` (see packages/mocks). */
const hueOf = (image: MediaRef | null): number => {
  const url = image?.url ?? "";
  const hue = Number(url.startsWith("placeholder:") ? url.slice("placeholder:".length) : NaN);
  return Number.isFinite(hue) ? hue : 160;
};

export function OrderItemsCard({ order: o }: { order: Order }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const count = o.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <Card>
      <CardHeader className="flex-row items-baseline justify-between gap-2 space-y-0">
        <CardTitle className="text-base">{t("order.summary")}</CardTitle>
        <span className="text-muted-foreground num text-sm">{t("order.itemsCount", { count: formatNumber(count) })}</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          {o.items.map((item) => {
            const imageUrl = item.image?.url;
            return (
            <li key={item.id} className="flex items-center gap-3">
              {isRealImageUrl(imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary order-line media url
                <img src={imageUrl} alt={item.productName[locale] ?? ""} className="size-14 shrink-0 rounded-lg object-cover" />
              ) : (
                <ProductImage hue={hueOf(item.image)} label={item.productName[locale] ?? ""} className="size-14 shrink-0 rounded-lg" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.productName[locale]}</p>
                <p className="text-muted-foreground num text-xs">
                  {item.sku}
                  {item.variantLabel ? ` · ${item.variantLabel}` : ""} · {formatNumber(item.quantity)} × {formatMoney(item.unitPrice.amount, locale)}
                </p>
              </div>
              <span className="num text-sm font-semibold">{formatMoney(item.lineTotal.amount, locale)}</span>
            </li>
            );
          })}
        </ul>
        <Separator />
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("subtotal")}</dt>
            <dd className="num">{formatMoney(o.subtotal.amount, locale)}</dd>
          </div>
          {o.discountTotal.amount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("discount")}</dt>
              <dd className="text-success num">-{formatMoney(o.discountTotal.amount, locale)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("shipping")}</dt>
            <dd className="num">{o.shippingTotal.amount === 0 ? t("free") : formatMoney(o.shippingTotal.amount, locale)}</dd>
          </div>
          {o.giftWrapFee?.amount ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t("giftWrap")}</dt>
              <dd className="num">{formatMoney(o.giftWrapFee.amount, locale)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t("vat", { amount: formatMoney(o.taxTotal.amount, locale) })}</dt>
            <dd />
          </div>
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <dt>{t("total")}</dt>
            <dd className="num">{formatMoney(o.total.amount, locale)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}

export function OrderMetaCard({ order: o }: { order: Order }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const a = o.shippingAddress;
  return (
    <Card>
      <CardContent className="space-y-4 p-5 text-sm">
        <div className="flex items-start gap-2.5">
          <CreditCard className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t("order.payment")}</p>
            <p className="text-muted-foreground">
              {t(`order.payMethod.${o.paymentMethod}`)} · {t(`order.pay.${o.paymentStatus}`)}
            </p>
          </div>
        </div>
        {o.shippingMethod ? (
          <div className="flex items-start gap-2.5">
            <Truck className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{o.shippingMethod.carrier}</p>
              <p className="text-muted-foreground">
                {o.shippingMethod.service} · {t("delivery", { days: formatNumber(o.shippingMethod.etaDays) })}
              </p>
            </div>
          </div>
        ) : null}
        <div className="flex items-start gap-2.5">
          <MapPin className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t("order.deliveryAddress")}</p>
            <p className="text-muted-foreground">
              {a.recipientName} · {a.city} · {a.district}
              {a.street ? ` · ${a.street}` : ""}
            </p>
            <p className="text-muted-foreground num text-xs" dir="ltr">
              {a.phone}
            </p>
          </div>
        </div>
        {o.customerNote ? (
          <div className="flex items-start gap-2.5 border-t pt-3">
            <MessageSquareText className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
            <div>
              <p className="font-medium">{t("orderNote")}</p>
              <p className="text-muted-foreground">{o.customerNote}</p>
            </div>
          </div>
        ) : null}
        {o.cancelReason ? (
          <p className="text-destructive border-t pt-3 text-xs">
            {t(`cancelReasons.${o.cancelReason.code}`)}
            {o.cancelReason.text && o.cancelReason.text !== t(`cancelReasons.${o.cancelReason.code}`) ? ` — ${o.cancelReason.text}` : ""}
          </p>
        ) : null}
        <p className="text-muted-foreground border-t pt-3 text-xs">
          {t("order.orderNumber", { number: formatNumber(o.number) })} · {t("order.date")} {formatDate(o.createdAt, locale)}
        </p>
      </CardContent>
    </Card>
  );
}

/** Digital download links for paid digital orders — shown on the
 * order-confirmation + account order pages. Empty for physical orders. */
export function OrderFilesCard({ order: o }: { order: Order }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { data: deliveries } = useOrderDigitalDeliveries(o.id);
  if (!deliveries?.length) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileDown className="text-primary size-4" aria-hidden /> {t("order.files")}</CardTitle></CardHeader>
      <CardContent className="space-y-2 p-5 pt-0">
        {deliveries.map((d) => (
          <a
            key={d.id}
            href={d.url}
            target="_blank"
            rel="noreferrer"
            className="hover:bg-accent/40 flex items-center justify-between gap-2 rounded-lg border p-3 text-sm transition-colors"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{d.name}</span>
              <span className="text-muted-foreground text-xs">{formatDate(d.deliveredAt, locale)}</span>
            </span>
            <span className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium"><Download className="size-3.5" aria-hidden /> {t("order.download")}</span>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
