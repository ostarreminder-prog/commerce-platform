"use client";

import * as React from "react";
import { MessageCircle, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAbandonedCarts, useCustomerList } from "@repo/api-client";
import type { AbandonedCart, RecoveryStatus } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, DataTableColumnHeader, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney, formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge, useStatusLabel } from "@repo/ui/components/status-badge";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { RecoverySettings } from "./cart-recovery-settings";
import { RecoveryTemplatesCard } from "./cart-templates";
import { CustomerCell, SendButton, useCartConversation } from "./cart-shared";

export { AbandonedCartView } from "./cart-detail";

const STATUSES: RecoveryStatus[] = ["not_contacted", "message_sent", "recovered", "lost"];

export function AbandonedCartsList() {
  const t = useTranslations("sales.carts");
  const label = useStatusLabel();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const [f, set] = useUrlState({ status: "all" });
  const carts = useAbandonedCarts();
  const customers = useCustomerList();
  const convFor = useCartConversation();
  useScrollRestore(carts.isSuccess);
  React.useEffect(() => { rememberListUrl("/abandoned-carts", `/abandoned-carts${window.location.search}`); }, [f]);
  const names = React.useMemo(() => new Map(customers.data?.map((c) => [c.id, c.name ?? c.phone])), [customers.data]);
  const all = carts.data ?? [];
  const visible = all.filter((c) => f.status === "all" || c.recoveryStatus === f.status);
  const recovered = all.filter((c) => c.recoveryStatus === "recovered");

  const columns = React.useMemo<ColumnDef<AbandonedCart, unknown>[]>(() => [
    { id: "customer", header: t("cols.customer"), cell: ({ row }) => <CustomerCell cart={row.original} names={names} /> },
    {
      id: "items", header: t("cols.items"),
      cell: ({ row }) => (
        <div className="flex">
          {row.original.items.slice(0, 4).map((i) => <MediaThumb key={i.variantId} url={i.image?.url} label={i.name[locale] ?? i.name.ar} className="ring-background size-8 ring-2 -ms-2 first:ms-0" />)}
        </div>
      ),
    },
    { id: "total", accessorFn: (c) => c.total.amount, header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.total")} />, cell: ({ row }) => <span className="num whitespace-nowrap font-medium">{formatMoney(row.original.total.amount, locale)}</span> },
    { id: "abandonedAt", accessorKey: "abandonedAt", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.abandonedAt")} />, cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap" title={formatDateTime(row.original.abandonedAt, locale)}>{formatRelativeTime(row.original.abandonedAt, locale, NOW)}</span> },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="abandonedCart" field="recoveryStatus" value={row.original.recoveryStatus} /> },
    { id: "attempts", header: t("cols.attempts"), cell: ({ row }) => <span className="num">{formatNumber(row.original.recoveryAttempts.length)}</span> },
    { id: "order", header: t("cols.order"), cell: ({ row }) => (row.original.recoveredOrderId ? <EntityLink type="order" id={row.original.recoveredOrderId} className="num" /> : <span className="text-muted-foreground">—</span>) },
    {
      id: "actions", header: () => <span className="sr-only">{t("cols.actions")}</span>,
      cell: ({ row }) => {
        const conv = convFor(row.original);
        return (
          <div className="flex justify-end gap-1">
            <SendButton cart={row.original} />
            {conv ? (
              <Button size="sm" variant="ghost" asChild onClick={(e) => e.stopPropagation()}>
                <Link href={`/inbox/${conv.id}`}><MessageCircle aria-hidden />{t("openConversation")}</Link>
              </Button>
            ) : null}
          </div>
        );
      },
    },
  ], [t, locale, names, convFor]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description", { recovered: recovered.length, total: all.length })} />
      <RecoverySettings />
      <RecoveryTemplatesCard />
      <DataState
        state={carts}
        loading={<TableSkeleton rows={8} columns={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={ShoppingCart} title={t("noneTitle")} description={t("noneDescription")} /></Card>}
      >
        {() => (
          <div className="space-y-4">
            <Tabs value={f.status} onValueChange={(v) => set({ status: v })}>
              <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <TabsList className="w-max">
                  <TabsTrigger value="all" className="gap-1.5">{t("all")}<span className="num text-muted-foreground text-xs">{all.length}</span></TabsTrigger>
                  {STATUSES.map((s) => (
                    <TabsTrigger key={s} value={s} className="gap-1.5">{label("abandonedCart", "recoveryStatus", s)}<span className="num text-muted-foreground text-xs">{all.filter((c) => c.recoveryStatus === s).length}</span></TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
            {visible.length ? (
              <DataTable columns={columns} data={visible} getRowId={(c) => c.id} pageSize={15} onRowClick={(c) => router.push(`/abandoned-carts/${c.id}`)} />
            ) : (
              <Card><EmptyState icon={ShoppingCart} title={t("emptyTitle")} /></Card>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}
