"use client";

import * as React from "react";
import { Download, MessageCircle, ShoppingBag, Tag, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  useAbandonedCarts, useAddCustomerNote, useConversationList, useCouponList, useCustomerById,
  useDeleteCustomer, useOrderList, useReturnList, useUpdateCustomer,
} from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDate, formatDateTime, formatMoney, formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl, useUrlState } from "@/lib/url-state";
import { CustomerTabs } from "./customer-tabs";
import { CustomerLoyaltyCard } from "./customer-loyalty-card";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { exportCsv } from "./customer-utils";

export function CustomerProfile() {
  const t = useTranslations("customers.profile");
  const tc = useTranslations("common");
  const tcust = useTranslations("customers");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const params = useParams<{ id: string }>();
  const canManage = useCan("customers.manage");
  const canExport = useCan("customers.export");
  const customer = useCustomerById(params.id);
  const orders = useOrderList();
  const conversations = useConversationList();
  const carts = useAbandonedCarts();
  const returns = useReturnList();
  const coupons = useCouponList();
  const update = useUpdateCustomer();
  const addNote = useAddCustomerNote();
  const mt = useMsgToast();
  const del = useDeleteCustomer();
  const [tab, setTab] = useUrlState({ tab: "orders" });
  const [editOpen, setEditOpen] = React.useState(false);
  const [couponOpen, setCouponOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [noteInput, setNoteInput] = React.useState("");
  const [tagInput, setTagInput] = React.useState("");

  if (customer.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><div className="grid gap-4 lg:grid-cols-3"><Skeleton className="h-96 lg:col-span-2" /><Skeleton className="h-96" /></div></div>;
  const c = customer.data;
  if (!c) return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push(recallListUrl("/customers"))}>{t("backToList")}</Button>} /></Card>;

  const myOrders = (orders.data ?? []).filter((o) => o.customerId === c.id);
  const myConvs = (conversations.data ?? []).filter((x) => x.customerId === c.id);
  const myCarts = (carts.data ?? []).filter((x) => x.customerId === c.id);
  const myReturns = (returns.data ?? []).filter((x) => x.customerId === c.id);
  const timeline = [
    ...myOrders.map((o) => ({ at: o.createdAt, label: t("timeline.order", { number: o.number }), actor: { type: "customer", id: c.id, name: c.name ?? c.phone } as const })),
    ...myConvs.map((x) => ({ at: x.updatedAt, label: t("timeline.conversation"), actor: { type: "system", id: "system", name: "" } as const })),
    ...myReturns.map((x) => ({ at: x.createdAt, label: t("timeline.return", { number: x.number }), actor: { type: "customer", id: c.id, name: c.name ?? c.phone } as const })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const openConv = myConvs.find((x) => x.status !== "closed" && x.status !== "resolved") ?? myConvs[0];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("crumb"), href: recallListUrl("/customers") }, { label: c.name ?? c.phone }]} />
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold">{c.name ?? c.phone}</h1>
            <StatusBadge entity="customer" field="segment" value={c.segment} />
            {c.tags.map((tag) => <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>)}
          </div>
          <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 text-sm">
            <bdi dir="ltr" className="num">{c.phone}</bdi>
            <span>{t("since", { date: formatDate(c.createdAt, locale) })}</span>
          </p>
        </div>
        {openConv ? <Button variant="outline" size="sm" asChild><Link href={`/inbox/${openConv.id}`}><MessageCircle aria-hidden />{t("message")}</Link></Button> : null}
        {canManage ? <Button size="sm" asChild><Link href={`/orders/new?customer=${c.id}`}><ShoppingBag aria-hidden />{t("newOrder")}</Link></Button> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {([
          { key: "orders", value: formatNumber(c.stats.ordersCount), href: `/orders?customer=${c.id}` },
          { key: "total", value: formatMoney(c.stats.totalSpent.amount, locale), href: `/orders?customer=${c.id}` },
          { key: "avg", value: formatMoney(c.stats.avgOrder.amount, locale), href: null },
          { key: "returns", value: formatNumber(c.stats.returnsCount), href: `/returns?customer=${c.id}` },
        ] as const).map((s) => (
          <Card key={s.key} className={cn(s.href && "hover:border-primary/50 transition-colors")}>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">{t(`stats.${s.key}`)}</p>
              {s.href ? <Link href={s.href} className="num mt-1 block text-2xl font-semibold hover:underline">{s.value}</Link> : <p className="num mt-1 text-2xl font-semibold">{s.value}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustomerTabs c={c} tab={tab.tab} setTab={setTab} myOrders={myOrders} myConvs={myConvs} myCarts={myCarts} myReturns={myReturns} timeline={timeline} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">{t("data")}</CardTitle>
              {canManage ? <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>{tc("edit")}</Button> : null}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("email")}</span><bdi dir="ltr">{c.email ?? "—"}</bdi></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("source")}</span><span>{tcust(`sources.${c.source}`)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("gender")}</span><span>{tcust(`edit.genders.${c.gender}`)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("birthDate")}</span><span>{c.birthDate ?? "—"}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("consents")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(["whatsapp", "sms", "email"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                  <span>{t(`channels.${k}`)}</span>
                  <Switch checked={c.marketingConsent[k]} disabled={!canManage} onCheckedChange={(v) => update.mutate([c.id, { marketingConsent: { ...c.marketingConsent, [k]: v } }])} aria-label={t(`channels.${k}`)} />
                </div>
              ))}
              <p className="text-muted-foreground text-xs">{t("consentUpdated", { date: formatDate(c.marketingConsent.updatedAt, locale) })}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("tags")}</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {c.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">{tag}
                  {canManage ? <button type="button" aria-label={t("removeTag")} onClick={() => update.mutate([c.id, { tags: c.tags.filter((x) => x !== tag) }])}><X className="size-3" /></button> : null}
                </Badge>
              ))}
              {canManage ? <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && tagInput.trim()) { e.preventDefault(); update.mutate([c.id, { tags: [...c.tags, tagInput.trim()] }]); setTagInput(""); } }} placeholder={t("tagPlaceholder")} className="h-7 w-28" /> : null}
            </CardContent>
          </Card>
          <CustomerLoyaltyCard customerId={c.id} />
          <Card>
            <CardHeader><CardTitle className="text-base">{t("staffNotes")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {(c.staffNotes ?? []).map((n) => (
                  <li key={n.id} className="rounded-md border p-2.5 text-sm">
                    <p className="whitespace-pre-wrap">{n.text}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{n.actor.name} · {formatDateTime(n.at, locale)}</p>
                  </li>
                ))}
                {!(c.staffNotes?.length) && c.notes ? <li className="rounded-md border p-2.5 text-sm"><p className="whitespace-pre-wrap">{c.notes}</p></li> : null}
                {!(c.staffNotes?.length) && !c.notes ? <li className="text-muted-foreground text-xs">{t("emptyNotes")}</li> : null}
              </ul>
              {canManage ? (
                <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); const text = noteInput.trim(); if (!text) return; addNote.mutate([c.id, text], { onSuccess: () => { setNoteInput(""); toast.success(t("noteAdded")); } }); }}>
                  <Textarea rows={2} value={noteInput} onChange={(e) => setNoteInput(e.target.value)} placeholder={t("notePlaceholder")} aria-label={t("staffNotes")} />
                  <Button type="submit" size="sm" variant="outline" disabled={addNote.isPending || !noteInput.trim()}>{t("addNote")}</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("actions")}</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setCouponOpen(true)}><Tag aria-hidden />{t("sendCoupon")}</Button>
              {canExport ? <Button variant="outline" size="sm" className="w-full" onClick={() => { exportCsv([c]); toast.success(t("exportDone")); }}><Download aria-hidden />{t("exportData")}</Button> : null}
              {canManage ? <Button variant="destructive" size="sm" className="w-full" onClick={() => setDeleteOpen(true)}><Trash2 aria-hidden />{t("deleteData")}</Button> : null}
            </CardContent>
          </Card>
        </div>
      </div>

      <EditCustomerDialog c={c} open={editOpen} onOpenChange={setEditOpen} />
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("sendCoupon")}</DialogTitle><DialogDescription>{t("sendCouponDescription")}</DialogDescription></DialogHeader>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {(coupons.data ?? []).filter((x) => x.status === "active").map((x) => (
              <li key={x.id} className="flex items-center justify-between rounded-md border p-3">
                <bdi dir="ltr" className="num font-medium">{x.code}</bdi>
                <Button size="sm" onClick={() => { setCouponOpen(false); toast.success(t("couponSent", { code: x.code })); }}>{t("send")}</Button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        titleKey="customers.deleteData.title"
        bodyKey="customers.deleteData.body"
        params={{ name: c.name ?? "" }}
        confirmLabel={t("confirmDelete")}
        danger
        requireText={locale === "ar" ? "حذف" : "delete"}
        pending={del.isPending}
        onConfirm={() => del.mutate([c.id], { onSuccess: () => { mt.success("customers.deleteData.success"); setDeleteOpen(false); router.push("/customers"); } })}
      />
    </div>
  );
}
