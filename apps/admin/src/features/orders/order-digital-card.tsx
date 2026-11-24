"use client";

import { FileDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrderDigitalDeliveries } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";

/** Digital deliveries for the order — download links generated after payment
 * (simulated rails, see `commerce.digital`). Hidden when the order has none. */
export function OrderDigitalCard({ order }: { order: Order }) {
  const t = useTranslations("sales.order");
  const { locale } = useAppLocale();
  const deliveries = useOrderDigitalDeliveries(order.id);
  const list = deliveries.data ?? [];
  if (!list.length) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><FileDown className="size-4" aria-hidden /> {t("digitalTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {list.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.name}</p>
              <p className="text-muted-foreground text-xs">{formatDateTime(d.deliveredAt, locale)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{t("digitalDelivered")}</Badge>
              <bdi dir="ltr" className="num text-muted-foreground max-w-48 truncate text-xs">{d.url}</bdi>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
