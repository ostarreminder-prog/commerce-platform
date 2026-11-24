"use client";

import * as React from "react";
import { MapPin, MessageCircle, Pencil, Plus, ShoppingBag, Star, Trash2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AbandonedCart, ActorRef, Address, Conversation, Customer, Order, Return } from "@repo/contracts";
import { useDeleteCustomerAddress, useSetDefaultCustomerAddress } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import Link from "@/components/store-link";
import { Actor } from "@/components/entity/actor";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";
import { AddressDialog } from "./address-dialog";

function SimpleTable({ cols, children }: { cols: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/50">{cols.map((c) => <th key={c} className="px-3 py-2 text-start font-medium text-muted-foreground">{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function CustomerTabs({ c, tab, setTab, myOrders, myConvs, myCarts, myReturns, timeline }: {
  c: Customer;
  tab: string;
  setTab: (patch: { tab: string }, opts?: { resetPage?: boolean }) => void;
  myOrders: Order[];
  myConvs: Conversation[];
  myCarts: AbandonedCart[];
  myReturns: Return[];
  timeline: { at: string; label: string; actor: ActorRef }[];
}) {
  const t = useTranslations("customers.profile");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const canManage = useCan("customers.manage");
  const setDefault = useSetDefaultCustomerAddress();
  const removeAddress = useDeleteCustomerAddress();
  const [addrDialog, setAddrDialog] = React.useState<{ open: boolean; address: Address | null }>({ open: false, address: null });
  const [deleteAddr, setDeleteAddr] = React.useState<Address | null>(null);
  return (
    <Tabs value={tab} onValueChange={(v) => setTab({ tab: v }, { resetPage: false })}>
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <TabsList className="w-max">
          {(["orders", "conversations", "carts", "returns", "addresses", "timeline"] as const).map((k) => <TabsTrigger key={k} value={k}>{t(`tabs.${k}`)}</TabsTrigger>)}
        </TabsList>
      </div>
      <TabsContent value="orders" className="mt-4">
        {myOrders.length ? (
          <SimpleTable cols={[t("cols.number"), t("cols.date"), t("cols.total"), t("cols.status")]}>
            {myOrders.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-3 py-2"><EntityLink type="order" id={o.id} /></td>
                <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{formatRelativeTime(o.createdAt, locale, NOW)}</td>
                <td className="num px-3 py-2 whitespace-nowrap">{formatMoney(o.total.amount, locale)}</td>
                <td className="px-3 py-2"><StatusBadge entity="order" value={o.status} /></td>
              </tr>
            ))}
          </SimpleTable>
        ) : <Card><EmptyState icon={ShoppingBag} title={t("emptyOrders")} description="" /></Card>}
      </TabsContent>
      <TabsContent value="conversations" className="mt-4 space-y-2">
        {myConvs.length ? myConvs.map((x) => (
          <Link key={x.id} href={`/inbox/${x.id}`} className="hover:bg-accent/40 flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="min-w-0">
              <p className="truncate text-sm">{x.aiSummary || x.messages.at(-1)?.content}</p>
              <p className="text-muted-foreground text-xs">{formatRelativeTime(x.updatedAt, locale, NOW)}</p>
            </div>
            <StatusBadge entity="conversation" value={x.status} />
          </Link>
        )) : <Card><EmptyState icon={MessageCircle} title={t("emptyConversations")} description="" /></Card>}
      </TabsContent>
      <TabsContent value="carts" className="mt-4 space-y-2">
        {myCarts.length ? myCarts.map((x) => (
          <Link key={x.id} href={`/abandoned-carts/${x.id}`} className="hover:bg-accent/40 flex items-center gap-3 rounded-md border p-3">
            <span className="flex">{x.items.slice(0, 3).map((i) => <MediaThumb key={i.variantId} url={i.image?.url} label={i.name.ar} className="ring-background size-8 ring-2 -ms-2 first:ms-0" />)}</span>
            <span className="num min-w-0 flex-1">{formatMoney(x.total.amount, locale)}</span>
            <StatusBadge entity="abandonedCart" field="recoveryStatus" value={x.recoveryStatus} />
          </Link>
        )) : <Card><EmptyState icon={ShoppingBag} title={t("emptyCarts")} description="" /></Card>}
      </TabsContent>
      <TabsContent value="returns" className="mt-4">
        {myReturns.length ? (
          <SimpleTable cols={[t("cols.number"), t("cols.order"), t("cols.status"), t("cols.date")]}>
            {myReturns.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="px-3 py-2"><EntityLink type="return" id={r.id} /></td>
                <td className="px-3 py-2"><EntityLink type="order" id={r.orderId} /></td>
                <td className="px-3 py-2"><StatusBadge entity="return" value={r.status} /></td>
                <td className="text-muted-foreground px-3 py-2 whitespace-nowrap">{formatRelativeTime(r.createdAt, locale, NOW)}</td>
              </tr>
            ))}
          </SimpleTable>
        ) : <Card><EmptyState icon={ShoppingBag} title={t("emptyReturns")} description="" /></Card>}
      </TabsContent>
      <TabsContent value="addresses" className="mt-4 space-y-2">
        {canManage ? (
          <Button variant="outline" size="sm" onClick={() => setAddrDialog({ open: true, address: null })}><Plus aria-hidden />{t("addAddress")}</Button>
        ) : null}
        {c.addresses.map((a) => (
          <div key={a.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground size-4" aria-hidden />
              <span className="font-medium">{a.label ?? a.recipientName}</span>
              {a.isDefault ? <Badge variant="secondary" className="font-normal">{t("default")}</Badge> : null}
              {canManage ? (
                <span className="ms-auto flex gap-1">
                  {!a.isDefault ? (
                    <Button variant="ghost" size="sm" onClick={() => setDefault.mutate([c.id, a.id], { onSuccess: () => toast.success(t("defaultSet")) })}><Star aria-hidden />{t("setDefault")}</Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => setAddrDialog({ open: true, address: a })}><Pencil aria-hidden />{tc("edit")}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteAddr(a)}><Trash2 aria-hidden />{tc("delete")}</Button>
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1">{a.city}{"، "}{a.district}{a.street ? `، ${a.street}` : ""}{a.buildingNumber ? `، ${a.buildingNumber}` : ""}{a.postalCode ? `، ${a.postalCode}` : ""}</p>
            <bdi dir="ltr" className="num text-muted-foreground text-xs">{a.phone}</bdi>
            {a.notes ? <p className="text-muted-foreground mt-1 text-xs">{a.notes}</p> : null}
          </div>
        ))}
        {!c.addresses.length ? <Card><EmptyState icon={UserRound} title={t("emptyAddresses")} description="" /></Card> : null}
      </TabsContent>
      <TabsContent value="timeline" className="mt-4">
        <ol className="relative space-y-4 border-s ps-5">
          {timeline.map((e, i) => (
            <li key={i} className="relative">
              <span className="bg-primary absolute -start-6 top-1 size-2.5 rounded-full" />
              <p className="text-sm">{e.label}</p>
              <p className="text-muted-foreground flex items-center gap-2 text-xs"><Actor actor={e.actor} />{formatDateTime(e.at, locale)}</p>
            </li>
          ))}
          {!timeline.length ? <p className="text-muted-foreground text-sm">{t("emptyTimeline")}</p> : null}
        </ol>
      </TabsContent>
      <AddressDialog customerId={c.id} address={addrDialog.address} open={addrDialog.open} onOpenChange={(v) => setAddrDialog((s) => ({ ...s, open: v }))} />
      <ConfirmDialog
        open={Boolean(deleteAddr)}
        onOpenChange={(v) => !v && setDeleteAddr(null)}
        title={t("deleteAddress")}
        body={t("deleteAddressBody")}
        confirmLabel={tc("delete")}
        danger
        pending={removeAddress.isPending}
        onConfirm={() => deleteAddr && removeAddress.mutate([c.id, deleteAddr.id], { onSuccess: () => { toast.success(t("addressDeleted")); setDeleteAddr(null); } })}
      />
    </Tabs>
  );
}
