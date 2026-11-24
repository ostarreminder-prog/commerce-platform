"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { Order, Shipment } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { useStatusLabel } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDate, formatDateTime, formatMoney } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 text-end font-medium">{children}</dd>
    </div>
  );
}

const DOT: Partial<Record<Shipment["status"], string>> = {
  delivered: "bg-success",
  failed_attempt: "bg-destructive",
  cancelled: "bg-destructive",
  returned: "bg-muted-foreground/40",
};

export function ShipmentTimeline({ shipment }: { shipment: Shipment }) {
  const t = useTranslations("shipments");
  const label = useStatusLabel();
  const { locale } = useAppLocale();
  const events = [...shipment.events].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("timeline")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-4">
          {events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="relative flex gap-3">
              {i < events.length - 1 ? <span aria-hidden className="bg-border absolute inset-y-0 start-[0.6875rem] top-6 w-px" /> : null}
              <span className="bg-background relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border">
                <span className={cn("size-2 rounded-full", DOT[e.status] ?? "bg-info")} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-medium">{label("shipment", "status", e.status)}</p>
                  <time dateTime={e.at} className="text-muted-foreground text-xs">
                    {formatDateTime(e.at, locale)}
                  </time>
                </div>
                <p className="text-muted-foreground text-sm">
                  {e.description}
                  {e.location ? ` · ${e.location}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function ShipmentItemsCard({ shipment, order }: { shipment: Shipment; order: Order | null }) {
  const t = useTranslations("shipments");
  const { locale } = useAppLocale();
  const items = shipment.items.map((line) => ({ line, item: order?.items.find((i) => i.id === line.orderItemId) ?? null }));
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("items")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.map(({ line, item }) => {
            const name = item ? (item.productName[locale] ?? item.productName.ar) : line.orderItemId;
            return (
              <li key={line.orderItemId} className="flex items-center gap-3 px-6 py-3 text-sm">
                <MediaThumb url={item?.image?.url} label={name} className="size-10" />
                <div className="min-w-0 flex-1">
                  {item ? <EntityLink type="product" id={item.productId} label={name} className="line-clamp-1" /> : <span className="truncate">{name}</span>}
                  <p className="text-muted-foreground num text-xs">
                    {item?.sku ?? "—"}
                    {item?.variantLabel ? ` · ${item.variantLabel}` : ""}
                  </p>
                </div>
                <span className="num text-muted-foreground shrink-0">× {line.quantity}</span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

export function ShipmentCarrierCard({ shipment }: { shipment: Shipment }) {
  const t = useTranslations("shipments");
  const { locale } = useAppLocale();
  const grams = shipment.packages.reduce((s, p) => s + p.weightGrams, 0);
  const trackable = Boolean(shipment.trackingUrl && shipment.trackingUrl !== "#");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("carrier")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2.5">
          <Field label={t("col.carrier")}>{shipment.carrier}</Field>
          <Field label={t("service")}>{shipment.service}</Field>
          <Field label={t("col.tracking")}>
            <bdi dir="ltr" className="num">{shipment.trackingNumber ?? "—"}</bdi>
          </Field>
          {trackable ? (
            <Field label={t("trackExternal")}>
              <a href={shipment.trackingUrl ?? "#"} target="_blank" rel="noreferrer" className="text-primary num hover:underline" dir="ltr">
                {shipment.trackingUrl}
              </a>
            </Field>
          ) : null}
          <Field label={t("packages")}>
            <span className="num">
              {shipment.packages.length} · {(grams / 1000).toFixed(2)} kg
            </span>
          </Field>
          <Field label={t("cost")}>
            <span className="num">{formatMoney(shipment.cost.amount, locale)}</span>
          </Field>
          <Field label={t("col.cod")}>
            <span className="num">{shipment.codAmount ? formatMoney(shipment.codAmount.amount, locale) : "—"}</span>
          </Field>
          <Field label={t("eta")}>{shipment.estimatedDelivery ? formatDate(shipment.estimatedDelivery, locale) : "—"}</Field>
        </dl>
      </CardContent>
    </Card>
  );
}

export function ShipmentAddressCard({ order }: { order: Order | null }) {
  const t = useTranslations("shipments");
  const address = order?.shippingAddress ?? null;
  if (!address) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("address")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p className="font-medium">{address.recipientName}</p>
        <p className="text-muted-foreground">
          {address.city} · {address.district}
          {address.street ? ` · ${address.street}` : ""}
          {address.buildingNumber ? ` · ${address.buildingNumber}` : ""}
        </p>
        <bdi dir="ltr" className="text-muted-foreground num block text-xs">
          {address.phone}
        </bdi>
        {address.notes ? (
          <p className="text-muted-foreground border-t pt-2 text-xs">
            <span className="text-foreground font-medium">{t("driverNotes")}:</span> {address.notes}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function ShipmentLinksCard({ shipment }: { shipment: Shipment }) {
  const t = useTranslations("shipments");
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("links")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2.5">
          <Field label={t("col.order")}>
            <EntityLink type="order" id={shipment.orderId} />
          </Field>
          <Field label={t("col.customer")}>
            <EntityLink type="customer" id={shipment.customerId} />
          </Field>
        </dl>
      </CardContent>
    </Card>
  );
}
