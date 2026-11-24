"use client";

import * as React from "react";
import { AlertTriangle, Search, Truck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERIODS, useCustomerList, useOrderList, useShipmentList } from "@repo/api-client";
import type { ShipmentStatus } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { CardContent } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, TableSkeleton } from "@repo/ui/components/data-table";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import Link from "@/components/store-link";
import { useCan } from "@/lib/permissions";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { useStoreRouter } from "@/lib/store-route";
import { DEFAULTS, buildRows, filterRows, hasFilters } from "./shipments-utils";
import { useShipmentColumns } from "./shipments-columns";
import { ShipmentsBulkActions } from "./shipments-bulk";

const STATUSES: ShipmentStatus[] = ["label_created", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed_attempt", "returned", "cancelled"];

export function ShipmentsView() {
  const t = useTranslations("shipments");
  const ts = useTranslations("sales");
  const router = useStoreRouter();
  const mt = useMsgToast();
  const canManage = useCan("shipments.manage");
  const shipments = useShipmentList();
  const orders = useOrderList();
  const customers = useCustomerList();
  const columns = useShipmentColumns();
  const [f, set] = useUrlState(DEFAULTS);

  useScrollRestore(shipments.isSuccess);
  React.useEffect(() => {
    rememberListUrl("/shipments", `/shipments${window.location.search}`);
  }, [f]);

  const rows = React.useMemo(() => buildRows(shipments.data ?? [], orders.data ?? [], customers.data ?? []), [shipments.data, orders.data, customers.data]);
  const filtered = React.useMemo(() => filterRows(rows, f), [rows, f]);
  const carriers = React.useMemo(() => [...new Set(rows.map((r) => r.shipment.carrier))].sort(), [rows]);
  const services = React.useMemo(() => [...new Set(rows.map((r) => r.shipment.service))].sort(), [rows]);
  const delayedCount = React.useMemo(() => rows.filter((r) => r.delayed).length, [rows]);
  const reset = () => set(Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, DEFAULTS[k as keyof typeof DEFAULTS]])));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      {delayedCount > 0 ? (
        <div className="border-destructive/30 bg-destructive/5 flex items-center gap-3 rounded-lg border p-4 text-sm">
          <AlertTriangle className="text-destructive size-5 shrink-0" aria-hidden />
          <span>{mt.text("shipments.delayed.banner", { count: delayedCount })}</span>
          <Button variant="outline" size="sm" className="ms-auto" onClick={() => set({ delayed: "1" })}>
            {t("filters.delayed")}
          </Button>
        </div>
      ) : null}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
            <div className="relative lg:w-64">
              <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
              <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("search")} aria-label={t("search")} className="ps-9" />
            </div>
            <Select value={f.status} onValueChange={(v) => set({ status: v })}>
              <SelectTrigger className="lg:w-44" aria-label={t("col.status")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={f.carrier} onValueChange={(v) => set({ carrier: v })}>
              <SelectTrigger className="lg:w-40" aria-label={t("col.carrier")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                {carriers.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={f.service} onValueChange={(v) => set({ service: v })}>
              <SelectTrigger className="lg:w-40" aria-label={t("filters.service")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                {services.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={f.date} onValueChange={(v) => set({ date: v })}>
              <SelectTrigger className="lg:w-36" aria-label={t("filters.date")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => <SelectItem key={p} value={p}>{ts(`periods.${p}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap items-center gap-4">
              <Label className="flex items-center gap-2 text-sm font-normal">
                <Checkbox checked={f.delayed === "1"} onCheckedChange={(v) => set({ delayed: v === true ? "1" : "" })} />
                {t("filters.delayed")}
              </Label>
              <Label className="flex items-center gap-2 text-sm font-normal">
                <Checkbox checked={f.cod === "1"} onCheckedChange={(v) => set({ cod: v === true ? "1" : "" })} />
                {t("filters.cod")}
              </Label>
              <Label className="flex items-center gap-2 text-sm font-normal">
                <Checkbox checked={f.stale === "1"} onCheckedChange={(v) => set({ stale: v === true ? "1" : "" })} />
                {t("filters.stale")}
              </Label>
            </div>
            {hasFilters(f) ? (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X aria-hidden />
                {t("filters.reset")}
              </Button>
            ) : null}
            <span className="text-muted-foreground text-sm lg:ms-auto">{t("results", { count: filtered.length })}</span>
          </div>
        </CardContent>
      </Card>
      <DataState state={shipments} loading={<TableSkeleton rows={8} columns={10} />}>
        {() =>
          filtered.length === 0 ? (
            <Card>
              <MsgEmptyState emptyKey="shipments" icon={Truck} />
            </Card>
          ) : (
            <>
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filtered}
                  getRowId={(r) => r.shipment.id}
                  enableRowSelection={canManage}
                  pageSize={12}
                  onRowClick={(r) => router.push(`/shipments/${r.shipment.id}`)}
                  bulkActions={(sel, clear) => <ShipmentsBulkActions rows={sel} clear={clear} />}
                />
              </div>
              <ul className="grid gap-3 md:hidden">
                {filtered.slice(0, 20).map((r) => (
                  <li key={r.shipment.id} className="bg-card rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link href={`/shipments/${r.shipment.id}`} className="num text-sm font-medium" dir="ltr">
                        {r.shipment.trackingNumber ?? r.shipment.id}
                      </Link>
                      <StatusBadge entity="shipment" value={r.shipment.status} />
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {r.customerName} · {r.city || "—"} · {r.shipment.carrier}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )
        }
      </DataState>
    </div>
  );
}
