"use client";

import * as React from "react";
import { CheckCircle2, Download } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  sampleOrders,
  type SampleOrder,
  type SampleOrderStatus,
} from "@repo/api-client";
import { Badge, type BadgeProps } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { DataTable, DataTableColumnHeader, type ColumnDef } from "@repo/ui/components/data-table";
import { Money } from "@repo/ui/components/money";
import { toast } from "@repo/ui/components/toaster";
import { formatDate, type Locale } from "@repo/ui/lib/format";

const STATUS_VARIANT: Record<SampleOrderStatus, NonNullable<BadgeProps["variant"]>> = {
  paid: "success",
  pending: "warning",
  refunded: "secondary",
  failed: "destructive",
};

export function TableDemo() {
  const t = useTranslations("designSystem");
  const locale = useLocale() as Locale;

  const columns = React.useMemo<ColumnDef<SampleOrder, unknown>[]>(
    () => [
      {
        accessorKey: "number",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.number")} />,
        cell: ({ row }) => <span className="num font-medium">{row.original.number}</span>,
      },
      {
        accessorKey: "customer",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t("table.customer")} />
        ),
      },
      {
        accessorKey: "total",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.total")} />,
        cell: ({ row }) => <Money amount={row.original.total} />,
      },
      {
        accessorKey: "status",
        header: t("table.status"),
        enableSorting: false,
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]}>
            {t(`badges.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("table.date")} />,
        cell: ({ row }) => (
          <span className="num text-muted-foreground">
            {formatDate(row.original.createdAt, locale)}
          </span>
        ),
      },
    ],
    [t, locale],
  );

  return (
    <DataTable
      columns={columns}
      data={sampleOrders}
      getRowId={(order) => order.id}
      enableRowSelection
      pageSize={5}
      bulkActions={(rows, clear) => (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.success(t("table.markPaid"), {
                description: rows.map((row) => row.number).join("، "),
              });
              clear();
            }}
          >
            <CheckCircle2 aria-hidden />
            {t("table.markPaid")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast(t("table.exported"))}>
            <Download aria-hidden />
            {t("table.export")}
          </Button>
        </>
      )}
    />
  );
}
