"use client";

import * as React from "react";
import { Download, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERIODS, inPeriod, useCustomerList, useOrderList, useShipmentList } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, TableSkeleton } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge, useStatusLabel } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { useStoreRouter } from "@/lib/store-route";
import { OrderChannelIcon } from "@repo/ui/components/order-channel-icon";
import { DEFAULTS, FULFILLMENT, PAYMENT_STATUSES, TABS, exportCsv, matches, type Filters, type Row } from "./orders-utils";
import type { Order } from "@repo/contracts";
import { useColumns } from "./orders-columns";
import { MoreFilters } from "./orders-more-filters";
import { BulkActions } from "./orders-bulk-actions";

function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-2xl" />
      <Skeleton className="h-10 w-full max-w-3xl" />
      <TableSkeleton rows={10} columns={8} />
    </div>
  );
}

export function OrdersList() {
  const t = useTranslations("sales.orders");
  const ts = useTranslations("sales");
  const label = useStatusLabel();
  const router = useStoreRouter();
  const canManage = useCan("orders.manage");
  const [f, set] = useUrlState(DEFAULTS);
  const orders = useOrderList();
  const customers = useCustomerList();
  const shipments = useShipmentList();
  const columns = useColumns();
  useScrollRestore(orders.isSuccess);

  React.useEffect(() => {
    rememberListUrl("/orders", `/orders${window.location.search}`);
  }, [f]);

  const rows = React.useMemo<Row[]>(() => {
    const cmap = new Map(customers.data?.map((c) => [c.id, c]));
    const smap = new Map(shipments.data?.map((s) => [s.orderId, s]));
    return (orders.data ?? []).map((order) => ({ order, customer: cmap.get(order.customerId), shipment: smap.get(order.id) }));
  }, [orders.data, customers.data, shipments.data]);

  const q = f.q.trim().toLowerCase();
  const withoutTab = rows.filter((r) => matches(r, { ...f, status: "all" }, q));
  const visible = withoutTab.filter((r) => matches(r, f, q));
  const countFor = (tab: (typeof TABS)[number]) => withoutTab.filter((r) => matches(r, { ...f, status: tab }, q)).length;
  const hasFilters = Object.entries(f).some(([k, v]) => k !== "status" && k !== "sort" && v !== DEFAULTS[k as keyof Filters]);
  const reset = () => set(Object.fromEntries(Object.keys(DEFAULTS).filter((k) => k !== "status").map((k) => [k, DEFAULTS[k as keyof Filters]])));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button variant="outline" onClick={() => exportCsv(visible)} disabled={!visible.length}>
              <Download aria-hidden />
              {t("export")}
            </Button>
            {canManage ? (
              <Button asChild>
                <Link href="/orders/new"><Plus aria-hidden />{t("newOrder")}</Link>
              </Button>
            ) : null}
          </>
        }
      />
      <DataState
        state={orders}
        loading={<Loading />}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <EmptyState
              icon={ShoppingBag}
              title={t("noOrdersTitle")}
              description={t("noOrdersDescription")}
              action={canManage ? <Button asChild><Link href="/orders/new"><Plus aria-hidden />{t("newOrder")}</Link></Button> : undefined}
            />
          </Card>
        }
      >
        {() => (
          <div className="space-y-4">
            <StatsRow orders={orders.data ?? []} />
            <Tabs value={f.status} onValueChange={(v) => set({ status: v })}>
              <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <TabsList className="w-max">
                  {TABS.map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="gap-1.5">
                      {t(`tabs.${tab}`)}
                      <span className="num text-muted-foreground text-xs">{formatNumber(countFor(tab))}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Select value={f.period} onValueChange={(v) => set({ period: v })}>
                  <SelectTrigger className="sm:w-36" aria-label={t("filters.period")}><SelectValue /></SelectTrigger>
                  <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{ts(`periods.${p}`)}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={f.payment} onValueChange={(v) => set({ payment: v })}>
                  <SelectTrigger className="sm:w-44" aria-label={t("filters.payment")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allPayments")}</SelectItem>
                    {PAYMENT_STATUSES.map((p) => <SelectItem key={p} value={p}>{label("order", "paymentStatus", p)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={f.fulfillment} onValueChange={(v) => set({ fulfillment: v })}>
                  <SelectTrigger className="sm:w-44" aria-label={t("filters.fulfillment")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allFulfillment")}</SelectItem>
                    {FULFILLMENT.map((p) => <SelectItem key={p} value={p}>{label("order", "fulfillmentStatus", p)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <MoreFilters f={f} set={set} />
              </div>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={reset} className="self-start lg:self-auto">
                  <X aria-hidden />
                  {t("resetFilters")}
                </Button>
              ) : null}
              <span className="text-muted-foreground text-sm lg:ms-auto">{t("results", { count: visible.length })}</span>
            </div>
            {f.customer || f.product ? (
              <div className="flex flex-wrap gap-2 text-sm">
                {f.customer ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    {t("filters.customer")}: <EntityLink type="customer" id={f.customer} />
                    <button type="button" aria-label={t("resetFilters")} onClick={() => set({ customer: "" })}><X className="size-3" /></button>
                  </Badge>
                ) : null}
                {f.product ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    {t("filters.product")}: <EntityLink type="product" id={f.product} />
                    <button type="button" aria-label={t("resetFilters")} onClick={() => set({ product: "" })}><X className="size-3" /></button>
                  </Badge>
                ) : null}
              </div>
            ) : null}
            {visible.length === 0 ? (
              <Card>
                <EmptyState icon={Search} title={t("emptyTitle")} description={t("emptyDescription")} action={<Button variant="outline" onClick={reset}>{t("resetFilters")}</Button>} />
              </Card>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {visible.slice(0, 30).map((r) => (
                    <Link key={r.order.id} href={`/orders/${r.order.id}`} className="bg-card hover:bg-accent/40 block rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="num font-semibold">#{r.order.number}</span>
                            <OrderChannelIcon channel={r.order.channel} />
                          </div>
                          <div className="mt-1 truncate text-sm">{r.customer?.name ?? r.customer?.phone}</div>
                        </div>
                        <span className="num text-sm font-semibold">{formatMoney(r.order.total.amount)}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <StatusBadge entity="order" field="paymentStatus" value={r.order.paymentStatus} />
                        <StatusBadge entity="order" field="fulfillmentStatus" value={r.order.fulfillmentStatus} />
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="hidden md:block">
                  <DataTable
                    columns={columns}
                    data={visible}
                    getRowId={(r) => r.order.id}
                    enableRowSelection={canManage}
                    pageSize={15}
                    onRowClick={(r) => router.push(`/orders/${r.order.id}`)}
                    bulkActions={(sel, clear) => <BulkActions rows={sel} clear={clear} />}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </DataState>
    </div>
  );
}

/* Lightweight stats strip (SCREENS_SPEC §4.1): needs-action count, today's
 * orders, today's revenue — each cell links to its filtered view. Uses the
 * dataset clock via inPeriod so "today" matches the seeded order dates. */
function StatsRow({ orders }: { orders: Order[] }) {
  const t = useTranslations("sales.orders.stats");
  const needsAction = orders.filter((o) => o.status === "needs_action").length;
  const todayOrders = orders.filter((o) => inPeriod(o.createdAt, "today"));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total.amount, 0);
  const cells = [
    { label: t("needsAction"), value: formatNumber(needsAction), href: "/orders?status=needs_action" },
    { label: t("todayOrders"), value: formatNumber(todayOrders.length), href: "/orders?period=today" },
    { label: t("todayRevenue"), value: formatMoney(todayRevenue), href: "/reports/sales?range=today" },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {cells.map((c) => (
        <Card key={c.label}>
          <Link href={c.href} className="hover:bg-accent/40 block p-4 transition-colors">
            <p className="text-muted-foreground text-sm">{c.label}</p>
            <p className="num mt-1 text-xl font-semibold">{c.value}</p>
          </Link>
        </Card>
      ))}
    </div>
  );
}
