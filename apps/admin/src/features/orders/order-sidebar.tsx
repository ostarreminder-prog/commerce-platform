"use client";

import * as React from "react";
import { AlertTriangle, MessageCircle, Pencil, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAddOrderTag, useConversationList, useCustomerById, useRemoveOrderTag } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { Notes } from "./order-notes";

const HIGH_AMOUNT = 200_000;

export function OrderSidebar({ order, canManage, onEditAddress }: { order: Order; canManage: boolean; onEditAddress: () => void }) {
  const t = useTranslations("sales.order");
  const { locale } = useAppLocale();
  const customer = useCustomerById(order.customerId);
  const addTag = useAddOrderTag();
  const removeTag = useRemoveOrderTag();
  const [newTag, setNewTag] = React.useState("");
  const conversations = useConversationList();
  const conversation = conversations.data?.find((c) => c.id === order.conversationId);
  const whatsapp = conversations.data?.find((c) => c.customerId === order.customerId && c.channel === "whatsapp");
  const closed = order.status === "cancelled";
  const shipped = order.fulfillmentStatus === "shipped" || order.fulfillmentStatus === "delivered";
  const risks = [
    customer.data?.stats.ordersCount === 1 && "firstOrder",
    order.total.amount >= HIGH_AMOUNT && "highAmount",
    order.paymentMethod === "cod" && (customer.data?.stats.returnsCount ?? 0) > 0 && "codWithReturns",
  ].filter(Boolean) as ("firstOrder" | "highAmount" | "codWithReturns")[];

  return (
    <div className="min-w-0 space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">{t("customer")}</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {customer.isPending ? <Skeleton className="h-20" /> : customer.data ? (
            <>
              <EntityLink type="customer" id={customer.data.id} className="text-base" />
              <div className="flex items-center justify-between gap-2">
                <bdi className="num" dir="ltr">{customer.data.phone}</bdi>
                {whatsapp ? (
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/inbox/${whatsapp.id}`}><MessageCircle aria-hidden />{t("whatsapp")}</Link>
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/orders?customer=${customer.data.id}`} className="bg-muted/50 hover:bg-muted rounded-md p-2.5">
                  <span className="text-muted-foreground block text-xs">{t("customerOrders")}</span>
                  <span className="num font-semibold">{formatNumber(customer.data.stats.ordersCount)}</span>
                </Link>
                <div className="bg-muted/50 rounded-md p-2.5">
                  <span className="text-muted-foreground block text-xs">{t("customerSpent")}</span>
                  <span className="num font-semibold">{formatMoney(customer.data.stats.totalSpent.amount, locale)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">{t("customerMissing")}</p>
          )}
        </CardContent>
      </Card>

      {risks.length ? (
        <Card className="border-warning/40">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="text-warning size-4" aria-hidden />{t("risk.title")}</CardTitle></CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 ps-5 text-sm">{risks.map((r) => <li key={r}>{t(`risk.${r}`)}</li>)}</ul>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">{t("shippingAddress")}</CardTitle>
          {canManage && !shipped && !closed ? (
            <Button size="sm" variant="ghost" onClick={onEditAddress}><Pencil aria-hidden />{t("edit")}</Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p className="font-medium">{order.shippingAddress.recipientName}</p>
          <p>{[order.shippingAddress.city, order.shippingAddress.district, order.shippingAddress.street].filter(Boolean).join("، ")}</p>
          {order.shippingAddress.shortAddress ? <p className="num text-muted-foreground" dir="ltr">{order.shippingAddress.shortAddress}</p> : null}
          <bdi className="num text-muted-foreground block" dir="ltr">{order.shippingAddress.phone}</bdi>
          {order.shippingMethod ? <p className="text-muted-foreground pt-2 text-xs">{order.shippingMethod.carrier} · {order.shippingMethod.service}</p> : null}
        </CardContent>
      </Card>

      {/* Billing address (SCREENS_SPEC §4.2) — falls back to shipping when the
       * order didn't carry a separate one. */}
      <Card>
        <CardHeader><CardTitle className="text-base">{t("billingAddress")}</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {order.billingAddress ? (
            <>
              <p className="font-medium">{order.billingAddress.recipientName}</p>
              <p>{[order.billingAddress.city, order.billingAddress.district, order.billingAddress.street].filter(Boolean).join("، ")}</p>
              {order.billingAddress.shortAddress ? <p className="num text-muted-foreground" dir="ltr">{order.billingAddress.shortAddress}</p> : null}
              <bdi className="num text-muted-foreground block" dir="ltr">{order.billingAddress.phone}</bdi>
            </>
          ) : (
            <p className="text-muted-foreground">{t("billingSameAsShipping")}</p>
          )}
        </CardContent>
      </Card>

      {order.customerNote ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("customerNote")}</CardTitle></CardHeader>
          <CardContent className="text-sm">{order.customerNote}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader><CardTitle className="text-base">{t("internalNotes")}</CardTitle></CardHeader>
        <CardContent><Notes order={order} /></CardContent>
      </Card>

      {order.tags.length || canManage ? (
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("tags")}</CardTitle>
            {canManage ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost" disabled={addTag.isPending}><Plus aria-hidden />{t("addTag")}</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const tag = newTag.trim();
                      if (!tag) return;
                      addTag.mutate([[order.id], tag], {
                        onSuccess: () => setNewTag(""),
                        onError: () => toast.error(t("tagFailed")),
                      });
                    }}
                  >
                    <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} aria-label={t("addTag")} placeholder={t("tagPlaceholder")} />
                    <Button type="submit" size="sm" disabled={addTag.isPending}>{t("addTag")}</Button>
                  </form>
                </PopoverContent>
              </Popover>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {order.tags.length ? order.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="gap-1">
                <Link href={`/orders?tag=${encodeURIComponent(tag)}`}>{tag}</Link>
                {canManage ? (
                  <button
                    type="button"
                    aria-label={t("removeTag", { tag })}
                    disabled={removeTag.isPending}
                    className="hover:text-destructive -me-1 rounded-sm disabled:opacity-50"
                    onClick={() => removeTag.mutate([[order.id], tag], { onError: () => toast.error(t("tagFailed")) })}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                ) : null}
              </Badge>
            )) : <p className="text-muted-foreground text-sm">{t("noTags")}</p>}
          </CardContent>
        </Card>
      ) : null}

      {conversation || order.agentId ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("conversation")}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {conversation ? (
              <div className="flex items-center justify-between gap-2">
                <EntityLink type="conversation" id={conversation.id} />
                <StatusBadge entity="conversation" value={conversation.status} />
              </div>
            ) : null}
            {order.agentId ? <p className="text-muted-foreground">{t("createdByAgent")} <EntityLink type="agent" id={order.agentId} /></p> : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
