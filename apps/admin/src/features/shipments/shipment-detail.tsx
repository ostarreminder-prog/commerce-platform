"use client";

import * as React from "react";
import { BellRing, PenLine, Printer, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEntityRecord, useNotifyShipmentCustomer, useShipmentById } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { PageError } from "@repo/ui/components/page-error";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { useCan } from "@/lib/permissions";
import { recallListUrl } from "@/lib/url-state";
import { printShippingLabels } from "@/features/orders/print-labels";
import { ShipmentAddressCard, ShipmentCarrierCard, ShipmentItemsCard, ShipmentLinksCard, ShipmentTimeline } from "./shipment-cards";
import { ShipmentStatusDialog, ShipmentTrackingDialog, nextStatuses } from "./shipment-actions";

export function ShipmentDetail({ id }: { id: string }) {
  const t = useTranslations("shipments");
  const to = useTranslations("sales.order");
  const { dir } = useAppLocale();
  const mt = useMsgToast();
  const canManage = useCan("shipments.manage");
  const query = useShipmentById(id);
  const orderQuery = useEntityRecord("order", query.data?.orderId ?? "", Boolean(query.data?.orderId));
  const notify = useNotifyShipmentCustomer();
  const [dialog, setDialog] = React.useState<"status" | "tracking" | null>(null);

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }
  const s = query.data;
  if (!s) return <PageError errorKey="404" onRetry={() => query.refetch()} />;

  const order = orderQuery.data ?? null;
  const movable = canManage && nextStatuses(s.status).length > 0;

  const printLabel = () => {
    if (!order) return;
    const ok = printShippingLabels(
      [{ order, shipment: s }],
      {
        order: to("labelFields.order"), to: to("labelFields.to"), cod: to("labelFields.cod"),
        weight: to("labelFields.weight"), tracking: to("labelFields.tracking"), label: to("labelFields.label"), packages: to("labelFields.packages"),
      },
      dir,
    );
    if (!ok) toast.error(to("popupBlocked"));
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("title"), href: recallListUrl("/shipments") }, { label: s.trackingNumber ?? s.id }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="num flex items-center gap-3 text-2xl font-semibold tracking-tight" dir="ltr">
            {s.trackingNumber ?? s.id}
          </h1>
          <div className="flex items-center gap-2">
            <StatusBadge entity="shipment" value={s.status} />
            <span className="text-muted-foreground text-sm">{t(`type.${s.type}`)}</span>
          </div>
        </div>
        {canManage ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setDialog("status")} disabled={!movable}>
              <RefreshCcw aria-hidden />
              {t("updateStatus")}
            </Button>
            <Button variant="outline" onClick={() => setDialog("tracking")}>
              <PenLine aria-hidden />
              {t("updateTracking")}
            </Button>
            <Button variant="outline" onClick={printLabel} disabled={!order}>
              <Printer aria-hidden />
              {t("printLabel")}
            </Button>
            <Button
              variant="outline"
              loading={notify.isPending}
              onClick={() =>
                notify.mutate([s.id], {
                  onSuccess: () => mt.success("shipments.customerNotified"),
                  onError: () => mt.error("shipments.notifyFailed"),
                })
              }
            >
              <BellRing aria-hidden />
              {t("notifyCustomer")}
            </Button>
          </div>
        ) : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <ShipmentTimeline shipment={s} />
          <ShipmentItemsCard shipment={s} order={order} />
        </div>
        <div className="space-y-6">
          <ShipmentCarrierCard shipment={s} />
          <ShipmentAddressCard order={order} />
          <ShipmentLinksCard shipment={s} />
        </div>
      </div>
      <ShipmentStatusDialog shipment={s} open={dialog === "status"} onOpenChange={(o) => setDialog(o ? "status" : null)} />
      <ShipmentTrackingDialog shipment={s} open={dialog === "tracking"} onOpenChange={(o) => setDialog(o ? "tracking" : null)} />
    </div>
  );
}
