"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@repo/ui/components/badge";
import { DataTableColumnHeader, type ColumnDef } from "@repo/ui/components/data-table";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import type { Row } from "./invoices-utils";

const ISSUE_TONE: Record<string, "info" | "success" | "warning" | "destructive" | "secondary" | "outline"> = {
  issued: "info",
  paid: "success",
  unpaid: "warning",
  partially_refunded: "warning",
  refunded: "secondary",
  cancelled: "destructive",
};

export function useInvoiceColumns(): ColumnDef<Row, unknown>[] {
  const t = useTranslations("invoices");
  const { locale } = useAppLocale();
  return React.useMemo<ColumnDef<Row, unknown>[]>(
    () => [
      {
        accessorKey: "number",
        header: t("col.number"),
        cell: ({ row }) => (
          <Link href={`/invoices/${row.original.invoice.id}`} className="num font-medium hover:underline" dir="ltr" onClick={(e) => e.stopPropagation()}>
            {row.original.invoice.number}
          </Link>
        ),
      },
      {
        id: "type",
        header: t("col.type"),
        cell: ({ row }) => <Badge variant={row.original.invoice.type === "credit_note" ? "warning" : "secondary"}>{t(`type.${row.original.invoice.type}`)}</Badge>,
      },
      { id: "order", header: t("col.order"), cell: ({ row }) => (row.original.order ? <EntityLink type="order" id={row.original.order.id} /> : "—") },
      {
        id: "customer",
        header: t("col.customer"),
        cell: ({ row }) => <EntityLink type="customer" id={row.original.invoice.customerId} label={row.original.invoice.customer.name} />,
      },
      {
        accessorKey: "issuedAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("col.date")} />,
        cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(row.original.invoice.issuedAt, locale)}</span>,
      },
      {
        id: "subtotal",
        header: t("col.subtotal"),
        cell: ({ row }) => <span className="num whitespace-nowrap">{formatMoney(row.original.invoice.subtotal.amount, locale)}</span>,
      },
      {
        accessorKey: "vatAmount",
        header: t("col.vat"),
        cell: ({ row }) => <span className="num whitespace-nowrap">{formatMoney(row.original.invoice.vatAmount.amount, locale)}</span>,
      },
      {
        accessorKey: "total",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("col.total")} />,
        cell: ({ row }) => <span className="num whitespace-nowrap font-medium">{formatMoney(row.original.invoice.total.amount, locale)}</span>,
      },
      {
        id: "issueStatus",
        header: t("col.status"),
        cell: ({ row }) => <Badge variant={ISSUE_TONE[row.original.issueStatus] ?? "outline"}>{t(`issueStatus.${row.original.issueStatus}`)}</Badge>,
      },
      { id: "zatca", header: t("col.zatca"), cell: ({ row }) => <StatusBadge entity="invoice" field="zatcaStatus" value={row.original.invoice.zatcaStatus} /> },
      {
        id: "original",
        header: t("col.original"),
        cell: ({ row }) =>
          row.original.invoice.type === "credit_note" ? (
            row.original.invoice.relatedInvoiceId ? (
              <EntityLink type="invoice" id={row.original.invoice.relatedInvoiceId} className="num" />
            ) : (
              <Badge variant="destructive">{t("orphan")}</Badge>
            )
          ) : (
            "—"
          ),
      },
    ],
    [t, locale],
  );
}
