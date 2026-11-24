"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { DataTableColumnHeader, type ColumnDef } from "@repo/ui/components/data-table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { OrderChannelIcon } from "@repo/ui/components/order-channel-icon";
import type { Row } from "./orders-utils";

export function useColumns(): ColumnDef<Row, unknown>[] {
  const t = useTranslations("sales.orders.columns");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  return React.useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        id: "number",
        accessorFn: (r) => r.order.number,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("number")} />,
        cell: ({ row }) => <EntityLink type="order" id={row.original.order.id} className="num" />,
      },
      {
        id: "date",
        accessorFn: (r) => r.order.createdAt,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("date")} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap" title={formatDateTime(row.original.order.createdAt, locale)}>
            {formatRelativeTime(row.original.order.createdAt, locale, NOW)}
          </span>
        ),
      },
      {
        id: "customer",
        header: t("customer"),
        cell: ({ row }) => (
          <div className="min-w-0">
            <EntityLink type="customer" id={row.original.order.customerId} className="block truncate" />
            <bdi className="text-muted-foreground num block text-xs" dir="ltr">{row.original.customer?.phone}</bdi>
          </div>
        ),
      },
      {
        id: "channel",
        header: t("channel"),
        cell: ({ row }) => (
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <OrderChannelIcon channel={row.original.order.channel} />
            {row.original.order.agentId ? <EntityLink type="agent" id={row.original.order.agentId} className="text-xs" /> : null}
          </span>
        ),
      },
      {
        id: "items",
        header: t("items"),
        cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{tc("items", { count: row.original.order.items.reduce((s, i) => s + i.quantity, 0) })}</span>,
      },
      {
        id: "total",
        accessorFn: (r) => r.order.total.amount,
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("total")} />,
        cell: ({ row }) => <span className="num whitespace-nowrap font-medium">{formatMoney(row.original.order.total.amount, locale)}</span>,
      },
      { id: "payment", header: t("payment"), cell: ({ row }) => <StatusBadge entity="order" field="paymentStatus" value={row.original.order.paymentStatus} /> },
      { id: "fulfillment", header: t("fulfillment"), cell: ({ row }) => <StatusBadge entity="order" field="fulfillmentStatus" value={row.original.order.fulfillmentStatus} /> },
      {
        id: "shipment",
        header: t("shipment"),
        cell: ({ row }) =>
          row.original.shipment ? <EntityLink type="shipment" id={row.original.shipment.id} className="num text-xs" /> : <span className="text-muted-foreground">—</span>,
      },
      {
        id: "tags",
        header: t("tags"),
        cell: ({ row }) => (
          <span className="flex flex-wrap gap-1">
            {row.original.order.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>
            ))}
          </span>
        ),
      },
    ],
    [t, tc, locale],
  );
}
