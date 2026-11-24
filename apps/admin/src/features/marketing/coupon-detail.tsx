"use client";

import * as React from "react";
import { Ticket, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCouponById, useDeleteCoupon, useSaveCoupon, useSetCouponStatus } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import { Actor } from "@/components/entity/actor";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";
import { CouponForm } from "./coupon-form";
import { couponValue } from "./coupon-utils";

export function CouponDetail() {
  const t = useTranslations("marketing.coupon");
  const tList = useTranslations("marketing.coupons");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("marketing.manage");
  const params = useParams<{ id: string }>();
  const coupon = useCouponById(params.id);
  const save = useSaveCoupon();
  const mt = useMsgToast();
  const setStatus = useSetCouponStatus();
  const del = useDeleteCoupon();
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  if (coupon.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-72" /></div>;
  const c = coupon.data;
  if (!c) return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push("/marketing/coupons")}>{t("backToList")}</Button>} /></Card>;

  const toggle = () => setStatus.mutate([c.id, c.status !== "disabled"], {
    onSuccess: () => c.status === "disabled" ? mt.success("common.save.success") : mt.success("coupons.disable.success", { code: c.code }, { undo: () => setStatus.mutate([c.id, false]) }),
  });

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: tList("title"), href: recallListUrl("/marketing/coupons") }, { label: c.code }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="num text-xl font-semibold tracking-wide" dir="ltr">{c.code}</h1>
        <StatusBadge entity="coupon" value={c.status} />
        <div className="ms-auto flex flex-wrap gap-2">
          {canManage ? (
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>{tc("edit")}</Button>
              <Button variant="outline" onClick={toggle} disabled={setStatus.isPending}>{c.status === "disabled" ? t("activate") : t("deactivate")}</Button>
              <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 aria-hidden />{t("delete")}</Button>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {([
          ["usage", `${formatNumber(c.stats.uses)}${c.usageLimit ? ` / ${formatNumber(c.usageLimit)}` : ""}`],
          ["revenue", formatMoney(c.stats.revenue.amount, locale)],
          ["discount", formatMoney(c.stats.discountGiven.amount, locale)],
        ] as const).map(([key, val]) => (
          <Card key={key}><CardContent className="p-4"><p className="text-muted-foreground text-xs">{t(`stats.${key}`)}</p><p className="num mt-1 text-2xl font-semibold">{val}</p></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{t("usageTitle")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            {c.usages.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-muted/50 border-b">{[t("cols.order"), t("cols.customer"), t("cols.date"), t("cols.discount"), t("cols.orderTotal")].map((h) => <th key={h} className="text-muted-foreground px-4 py-2 text-start font-medium">{h}</th>)}</tr></thead>
                  <tbody>
                    {c.usages.map((u, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-4 py-2"><EntityLink type="order" id={u.orderId} /></td>
                        <td className="px-4 py-2">{u.customerId ? <EntityLink type="customer" id={u.customerId} /> : "—"}</td>
                        <td className="text-muted-foreground px-4 py-2 whitespace-nowrap">{formatRelativeTime(u.at, locale, NOW)}</td>
                        <td className="num px-4 py-2">{formatMoney(u.discount.amount, locale)}</td>
                        <td className="num px-4 py-2">{formatMoney(u.orderTotal.amount, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <EmptyState icon={Ticket} title={t("noUsageTitle")} description={t("noUsageDescription")} />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("settings")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {([
              [t("s.type"), tList(`types.${c.type}`)],
              [t("s.value"), couponValue(c, locale) ?? tList("freeShipping")],
              [t("s.maxDiscount"), c.maxDiscount ? formatMoney(c.maxDiscount.amount, locale) : "—"],
              [t("s.period"), `${formatDate(c.startsAt, locale)} ← ${c.endsAt ? formatDate(c.endsAt, locale) : "∞"}`],
              [t("s.minOrder"), c.minOrderAmount ? formatMoney(c.minOrderAmount.amount, locale) : "—"],
              [t("s.perCustomer"), c.usageLimitPerCustomer ? formatNumber(c.usageLimitPerCustomer) : "—"],
              [t("s.appliesTo"), t(`form.applies.${c.appliesTo.type}`)],
              [t("s.excludeSale"), c.excludeSaleItems ? tc("yes") : tc("no")],
            ] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="num text-end">{v}</span></div>
            ))}
            <div className="flex justify-between gap-3 border-t pt-2"><span className="text-muted-foreground">{t("s.createdBy")}</span><Actor actor={c.createdBy} /></div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{t("editTitle")}</DialogTitle></DialogHeader>
          <CouponForm
            initial={{ id: c.id, code: c.code, type: c.type, value: c.value, maxDiscount: c.maxDiscount?.amount ?? null, minOrderAmount: c.minOrderAmount?.amount ?? null, appliesTo: c.appliesTo, excludeSaleItems: c.excludeSaleItems, usageLimit: c.usageLimit, usageLimitPerCustomer: c.usageLimitPerCustomer, customerEligibility: c.customerEligibility, startsAt: c.startsAt.slice(0, 10), endsAt: c.endsAt?.slice(0, 10) ?? null }}
            pending={save.isPending}
            submitLabel={tc("save")}
            onSubmit={(v) => save.mutate([v], { onSuccess: () => { toast.success(t("saved")); setEditOpen(false); }, onError: (e) => toast.error(e.message === "taken" ? tList("codeTaken") : t("failed")) })}
          />
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        titleKey="products.delete.title"
        params={{ name: c.code }}
        body={c.stats.uses ? mt.text("coupons.delete.used", { count: c.stats.uses }) : t("deleteDescription", { count: 0 })}
        confirmLabel={t("confirmDelete")}
        danger
        pending={del.isPending}
        onConfirm={() => del.mutate([c.id], { onSuccess: () => { mt.success("products.delete.success"); router.push("/marketing/coupons"); } })}
      />
    </div>
  );
}
