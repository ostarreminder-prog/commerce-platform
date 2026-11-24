"use client";

import { Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useShipmentList } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import { EntityLink } from "@/components/entity/entity-link";

export function OrderShipmentsCard({ order, canManage, canShip, onCreateShipment }: { order: Order; canManage: boolean; canShip: boolean; onCreateShipment: () => void }) {
  const t = useTranslations("sales.order");
  const { locale } = useAppLocale();
  const shipments = useShipmentList();
  const orderShipments = (shipments.data ?? []).filter((s) => s.orderId === order.id);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("shipments")}</CardTitle>
        {canManage && canShip ? <Button size="sm" variant="outline" onClick={onCreateShipment}>{t("actions.createShipment")}</Button> : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {!orderShipments.length ? (
          <p className="text-muted-foreground text-sm">{t("noShipments")}</p>
        ) : (
          orderShipments.map((s) => {
            const last = s.events.at(-1);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border p-3 text-sm">
                <Truck className="text-muted-foreground size-4" aria-hidden />
                <span className="font-medium">{s.carrier}</span>
                <EntityLink type="shipment" id={s.id} className="num" />
                <StatusBadge entity="shipment" value={s.status} />
                {s.type === "return" ? <Badge variant="outline">{t("returnShipment")}</Badge> : null}
                <span className="text-muted-foreground ms-auto text-xs">{last ? `${last.description} · ${formatRelativeTime(last.at, locale, NOW)}` : null}</span>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
