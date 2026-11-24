"use client";

import * as React from "react";
import { Plus, Search, Ticket, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCouponList, useSaveCoupon } from "@repo/api-client";
import type { Coupon } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { Actor } from "@/components/entity/actor";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { CouponForm } from "./coupon-form";
import { COUPON_TYPES, couponValue } from "./coupon-utils";
export { couponValue } from "./coupon-utils";
export { CouponDetail } from "./coupon-detail";

export function CouponsList() {
  const t = useTranslations("marketing.coupons");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("marketing.manage");
  const [f, set] = useUrlState({ status: "all", type: "all", q: "" });
  const coupons = useCouponList();
  const save = useSaveCoupon();
  const [newOpen, setNewOpen] = React.useState(false);
  useScrollRestore(coupons.isSuccess);
  React.useEffect(() => { rememberListUrl("/marketing/coupons", `/marketing/coupons${window.location.search}`); }, [f]);

  const q = f.q.trim().toLowerCase();
  const visible = (coupons.data ?? []).filter((c) =>
    (f.status === "all" || c.status === f.status) && (f.type === "all" || c.type === f.type) && (!q || c.code.toLowerCase().includes(q)),
  );

  const columns = React.useMemo<ColumnDef<Coupon, unknown>[]>(() => [
    { id: "code", accessorKey: "code", header: t("cols.code"), cell: ({ row }) => <EntityLink type="coupon" id={row.original.id} label={row.original.code} /> },
    { id: "type", header: t("cols.type"), cell: ({ row }) => <span className="text-sm">{t(`types.${row.original.type}`)}</span> },
    { id: "value", header: t("cols.value"), cell: ({ row }) => <span className="num">{couponValue(row.original, locale) ?? t("freeShipping")}</span> },
    { id: "usage", header: t("cols.usage"), cell: ({ row }) => <span className="num text-sm">{formatNumber(row.original.stats.uses)}{row.original.usageLimit ? ` / ${formatNumber(row.original.usageLimit)}` : ""}</span> },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="coupon" value={row.original.status} /> },
    { id: "period", header: t("cols.period"), cell: ({ row }) => <span className="num text-muted-foreground whitespace-nowrap text-xs">{formatDate(row.original.startsAt, locale)} ← {row.original.endsAt ? formatDate(row.original.endsAt, locale) : "∞"}</span> },
    { id: "min", header: t("cols.min"), cell: ({ row }) => <span className="num text-muted-foreground text-sm">{row.original.minOrderAmount ? formatMoney(row.original.minOrderAmount.amount, locale) : "—"}</span> },
    { id: "actor", header: t("cols.by"), cell: ({ row }) => <Actor actor={row.original.createdBy} /> },
  ], [t, locale]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={canManage ? <Button onClick={() => setNewOpen(true)}><Plus aria-hidden />{t("new")}</Button> : null}
      />
      <DataState
        state={coupons}
        loading={<TableSkeleton rows={8} columns={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><MsgEmptyState emptyKey="coupons" icon={Ticket} action={canManage ? <Button onClick={() => setNewOpen(true)}><Plus aria-hidden />{t("new")}</Button> : undefined} /></Card>}
      >
        {() => (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" dir="ltr" />
              </div>
              <Select value={f.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className="w-36" aria-label={t("filters.status")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                  {(["active", "scheduled", "expired", "disabled"] as const).map((s) => <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={f.type} onValueChange={(v) => set({ type: v })}>
                <SelectTrigger className="w-40" aria-label={t("filters.type")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUPON_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              {(f.status !== "all" || f.type !== "all" || q) ? <Button variant="ghost" size="sm" onClick={() => set({ status: "all", type: "all", q: "" })}><X aria-hidden />{tc("reset")}</Button> : null}
              <span className="text-muted-foreground ms-auto text-sm">{t("results", { count: visible.length })}</span>
            </div>
            <div className="hidden md:block">
              <DataTable columns={columns} data={visible} getRowId={(c) => c.id} pageSize={15} onRowClick={(c) => router.push(`/marketing/coupons/${c.id}`)} />
            </div>
            <div className="space-y-3 md:hidden">
              {visible.map((c) => (
                <button key={c.id} type="button" onClick={() => router.push(`/marketing/coupons/${c.id}`)} className="bg-card hover:bg-accent/40 flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-start">
                  <div>
                    <bdi dir="ltr" className="num font-medium">{c.code}</bdi>
                    <p className="num text-muted-foreground mt-0.5 text-xs">{couponValue(c, locale) ?? t("freeShipping")}</p>
                  </div>
                  <StatusBadge entity="coupon" value={c.status} />
                </button>
              ))}
            </div>
          </div>
        )}
      </DataState>
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{t("newTitle")}</DialogTitle><DialogDescription>{t("newDescription")}</DialogDescription></DialogHeader>
          <CouponForm
            initial={{ type: "percentage", value: 10, appliesTo: { type: "all", ids: [] }, customerEligibility: { type: "all", customerIds: [] }, excludeSaleItems: false, startsAt: new Date().toISOString().slice(0, 10), endsAt: null }}
            pending={save.isPending}
            submitLabel={t("create")}
            onSubmit={(v) => save.mutate([v], {
              onSuccess: (c) => { mt.success("coupons.created", { code: c.code }); setNewOpen(false); router.push(`/marketing/coupons/${c.id}`); },
              onError: (e) => toast.error(e.message === "taken" ? t("codeTaken") : e.message === "code" ? t("codeInvalid") : t("failed")),
            })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
