"use client";

import { CreditCard, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrderPayments, useOrderRefunds } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney } from "@repo/ui/lib/format";

export function OrderPaymentsCard({ order }: { order: Order }) {
  const t = useTranslations("sales.order");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const payments = useOrderPayments(order.id);
  const refunds = useOrderRefunds(order.id);
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("payments")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {payments.isPending ? <Skeleton className="h-12" /> : !payments.data?.length ? (
          <p className="text-muted-foreground text-sm">{t("noPayments", { method: ts(`paymentMethods.${order.paymentMethod}`) })}</p>
        ) : (
          payments.data.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border p-3 text-sm">
              <CreditCard className="text-muted-foreground size-4" aria-hidden />
              <span className="font-medium">{ts(`paymentMethods.${p.method}`)}</span>
              {p.cardLast4 ? <bdi className="num text-muted-foreground" dir="ltr">{p.cardBrand} ••••{p.cardLast4}</bdi> : null}
              <StatusBadge entity="payment" value={p.status} />
              <span className="num font-medium">{formatMoney(p.amount.amount, locale)}</span>
              <span className="text-muted-foreground num text-xs" dir="ltr">{p.providerRef}</span>
              <span className="text-muted-foreground ms-auto text-xs">{formatDateTime(p.createdAt, locale)}</span>
              {p.failureReason ? <p className="text-destructive w-full text-xs">{p.failureReason}</p> : null}
            </div>
          ))
        )}
        {refunds.data?.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-dashed p-3 text-sm">
            <RotateCcw className="text-muted-foreground size-4" aria-hidden />
            <span className="font-medium">{t("refundLine")}</span>
            <StatusBadge entity="refund" value={r.status} />
            <span className="num font-medium">{formatMoney(-r.amount.amount, locale)}</span>
            <span className="text-muted-foreground">{r.reason}</span>
            <span className="text-muted-foreground ms-auto text-xs">{r.actor.name} · {formatDateTime(r.createdAt, locale)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
