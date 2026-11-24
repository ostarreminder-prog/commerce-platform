"use client";

import { useTranslations } from "next-intl";
import { useAffiliates, useInvoiceList, useLocations, useReturnList } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";

export function OrderMetaCards({ order }: { order: Order }) {
  const t = useTranslations("sales.order");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const returns = useReturnList();
  const invoices = useInvoiceList();
  const affiliates = useAffiliates();
  const locations = useLocations();
  const affiliate = order.affiliateCode ? affiliates.data?.find((a) => a.code === order.affiliateCode) : null;
  const location = order.locationId ? locations.data?.find((l) => l.id === order.locationId) : null;
  const orderReturns = (returns.data ?? []).filter((r) => r.orderId === order.id);
  const invoice = invoices.data?.find((i) => i.id === order.invoiceId) ?? invoices.data?.find((i) => i.orderId === order.id && i.type !== "credit_note");
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">{t("invoice")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {invoice ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <EntityLink type="invoice" id={invoice.id} className="num" />
                <StatusBadge entity="invoice" field="zatcaStatus" value={invoice.zatcaStatus} />
              </div>
              <p className="text-muted-foreground text-xs">{ts(`invoiceTypes.${invoice.type}`)} · {formatDateTime(invoice.issuedAt, locale)}</p>
            </>
          ) : (
            <p className="text-muted-foreground">{t("noInvoice")}</p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">{t("returns")}</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {orderReturns.length ? (
            orderReturns.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2">
                <EntityLink type="return" id={r.id} className="num" />
                <StatusBadge entity="return" value={r.status} />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">{t("noReturns")}</p>
          )}
        </CardContent>
      </Card>
      {affiliate || location ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("attribution")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {affiliate ? (
              <p><span className="text-muted-foreground">{t("affiliate")}</span> {affiliate.name} <bdi dir="ltr" className="num font-mono text-xs">({affiliate.code})</bdi></p>
            ) : order.affiliateCode ? (
              <p><span className="text-muted-foreground">{t("affiliate")}</span> <bdi dir="ltr" className="num font-mono text-xs">{order.affiliateCode}</bdi></p>
            ) : null}
            {location ? <p><span className="text-muted-foreground">{t("locationLabel")}</span> {location.name}</p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
