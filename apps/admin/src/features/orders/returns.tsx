"use client";

import * as React from "react";
import { RotateCcw, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERIODS, inPeriod, useOrderList, useReturnList } from "@repo/api-client";
import type { Return, ReturnReason, ReturnStatus } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, DataTableColumnHeader, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge, useStatusLabel } from "@repo/ui/components/status-badge";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { itemsOf } from "./return-utils";

export { ReturnView } from "./return-detail";

const STATUSES: ReturnStatus[] = ["requested", "info_requested", "approved", "rejected", "in_transit", "received", "refunded", "closed"];
/* Refund progress per row (SCREENS_SPEC §5.1): nothing owed / owed / paid. */
const refundStatusOf = (r: Return): "none" | "pending" | "refunded" =>
  !r.refundAmount || r.refundAmount.amount <= 0 ? "none" : r.status === "refunded" || r.status === "closed" ? "refunded" : "pending";
const REASONS: ReturnReason[] = ["damaged", "wrong_item", "not_as_described", "size_issue", "changed_mind", "other"];

export function ReturnsList() {
  const t = useTranslations("sales.returns");
  const ts = useTranslations("sales");
  const label = useStatusLabel();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const [f, set] = useUrlState({ status: "all", reason: "all", period: "all", q: "" });
  const returns = useReturnList();
  const orders = useOrderList();
  useScrollRestore(returns.isSuccess);
  React.useEffect(() => { rememberListUrl("/returns", `/returns${window.location.search}`); }, [f]);

  const omap = React.useMemo(() => new Map(orders.data?.map((o) => [o.id, o])), [orders.data]);
  const q = f.q.trim().replace(/^#/, "");
  const visible = (returns.data ?? []).filter((r) =>
    (f.status === "all" || r.status === f.status) && (f.reason === "all" || r.reason === f.reason) && inPeriod(r.createdAt, f.period) &&
    (!q || String(r.number).includes(q) || String(omap.get(r.orderId)?.number ?? "").includes(q)));

  const columns = React.useMemo<ColumnDef<Return, unknown>[]>(() => [
    { id: "number", accessorKey: "number", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.number")} />, cell: ({ row }) => <EntityLink type="return" id={row.original.id} className="num" /> },
    { id: "order", header: t("cols.order"), cell: ({ row }) => <EntityLink type="order" id={row.original.orderId} className="num" /> },
    { id: "customer", header: t("cols.customer"), cell: ({ row }) => <EntityLink type="customer" id={row.original.customerId} /> },
    {
      id: "items", header: t("cols.items"),
      cell: ({ row }) => {
        const o = omap.get(row.original.orderId);
        return (
          <div className="flex">
            {itemsOf(row.original, o).slice(0, 3).map(({ line, item }) => <MediaThumb key={line.orderItemId} url={item?.image?.url} label={item?.productName[locale] ?? "—"} className="ring-background size-8 ring-2 -ms-2 first:ms-0" />)}
          </div>
        );
      },
    },
    { id: "reason", header: t("cols.reason"), cell: ({ row }) => ts(`returnReasons.${row.original.reason}`) },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="return" value={row.original.status} /> },
    { id: "refund", accessorFn: (r) => r.refundAmount?.amount ?? 0, header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.refundAmount")} />, cell: ({ row }) => <span className="num whitespace-nowrap">{row.original.refundAmount ? formatMoney(row.original.refundAmount.amount, locale) : "—"}</span> },
    { id: "refundStatus", header: t("cols.refundStatus"), cell: ({ row }) => <StatusBadge entity="return" field="refundStatus" value={refundStatusOf(row.original)} /> },
    { id: "date", accessorKey: "createdAt", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.date")} />, cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap" title={formatDateTime(row.original.createdAt, locale)}>{formatRelativeTime(row.original.createdAt, locale, NOW)}</span> },
  ], [t, ts, locale, omap]);

  const hasFilters = f.status !== "all" || f.reason !== "all" || f.period !== "all" || !!f.q;
  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataState
        state={returns}
        loading={<TableSkeleton rows={7} columns={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={RotateCcw} title={t("noneTitle")} description={t("noneDescription")} /></Card>}
      >
        {() => (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1 lg:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("search")} aria-label={t("search")} className="ps-9" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Select value={f.status} onValueChange={(v) => set({ status: v })}>
                  <SelectTrigger className="sm:w-40" aria-label={t("cols.status")}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">{t("allStatuses")}</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{label("return", "status", s)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={f.reason} onValueChange={(v) => set({ reason: v })}>
                  <SelectTrigger className="sm:w-44" aria-label={t("cols.reason")}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">{t("allReasons")}</SelectItem>{REASONS.map((r) => <SelectItem key={r} value={r}>{ts(`returnReasons.${r}`)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={f.period} onValueChange={(v) => set({ period: v })}>
                  <SelectTrigger className="sm:w-36" aria-label={ts("orders.filters.period")}><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{ts(`periods.${p}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {hasFilters ? <Button variant="ghost" size="sm" onClick={() => set({ status: "all", reason: "all", period: "all", q: "" })}><X aria-hidden />{ts("orders.resetFilters")}</Button> : null}
            </div>
            {visible.length ? (
              <DataTable columns={columns} data={visible} getRowId={(r) => r.id} pageSize={15} onRowClick={(r) => router.push(`/returns/${r.id}`)} />
            ) : (
              <Card><EmptyState icon={Search} title={ts("orders.emptyTitle")} description={ts("orders.emptyDescription")} /></Card>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
