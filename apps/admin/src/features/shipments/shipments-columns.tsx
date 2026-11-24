"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { DataTableColumnHeader, type ColumnDef } from "@repo/ui/components/data-table";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatRelativeTime } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import type { Row } from "./shipments-utils";

export function useShipmentColumns(): ColumnDef<Row, unknown>[] {
  const t = useTranslations("shipments");
  const { locale } = useAppLocale();
  return React.useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        accessorKey: "tracking",
        header: t("col.tracking"),
        cell: ({ row }) => (
          <Link href={`/shipments/${row.original.shipment.id}`} className="num font-medium hover:underline" dir="ltr" onClick={(e) => e.stopPropagation()}>
            {row.original.shipment.trackingNumber ?? row.original.shipment.id}
          </Link>
        ),
      },
      { id: "order", header: t("col.order"), cell: ({ row }) => (row.original.order ? <EntityLink type="order" id={row.original.order.id} /> : "—") },
      {
        id: "customer",
        header: t("col.customer"),
        cell: ({ row }) => (
          <div className="min-w-28">
            <EntityLink type="customer" id={row.original.shipment.customerId} label={row.original.customerName} />
            <bdi dir="ltr" className="num text-muted-foreground block text-xs">{row.original.phone || "—"}</bdi>
          </div>
        ),
      },
      { id: "carrier", header: t("col.carrier"), cell: ({ row }) => row.original.shipment.carrier },
      { id: "service", header: t("col.service"), cell: ({ row }) => <span className="text-muted-foreground">{row.original.shipment.service}</span> },
      {
        id: "created",
        header: t("col.created"),
        cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.createdAt ? formatDate(row.original.createdAt, locale) : "—"}</span>,
      },
      {
        id: "eta",
        header: t("col.eta"),
        cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.shipment.estimatedDelivery ? formatDate(row.original.shipment.estimatedDelivery, locale) : "—"}</span>,
      },
      { id: "cost", header: t("col.cost"), cell: ({ row }) => <span className="num whitespace-nowrap">{formatMoney(row.original.shipment.cost.amount, locale)}</span> },
      {
        id: "status",
        header: t("col.status"),
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5">
            <StatusBadge entity="shipment" value={row.original.shipment.status} />
            {row.original.delayed ? <Badge variant="destructive">{t("delayed")}</Badge> : null}
            {row.original.stale && !row.original.delayed ? <Badge variant="warning">{t("stale")}</Badge> : null}
          </span>
        ),
      },
      {
        id: "payment",
        header: t("col.payment"),
        cell: ({ row }) => (row.original.order ? <StatusBadge entity="order" field="paymentStatus" value={row.original.order.paymentStatus} /> : "—"),
      },
      {
        id: "cod",
        header: t("col.cod"),
        cell: ({ row }) =>
          row.original.shipment.codAmount ? (
            <span className="num whitespace-nowrap font-medium">{formatMoney(row.original.shipment.codAmount.amount, locale)}</span>
          ) : (
            "—"
          ),
      },
      {
        id: "updated",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("col.updated")} />,
        accessorFn: (r) => r.lastUpdate ?? "",
        cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.lastUpdate ? formatRelativeTime(row.original.lastUpdate, locale) : "—"}</span>,
      },
    ],
    [t, locale],
  );
}
