"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrderList } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Card, CardContent } from "@repo/ui/components/card";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Button } from "@repo/ui/components/button";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { AccountNav } from "./account-nav";
import { GuestGate } from "./guest-gate";
import { useSession } from "@/components/session-context";

function OrderRow({ order: o }: { order: Order }) {
  const t = useTranslations("store");
  const { locale, dir } = useAppLocale();
  const Sep = dir === "rtl" ? ChevronLeft : ChevronRight;
  const count = o.items.reduce((s, i) => s + i.quantity, 0);
  const statusKey =
    o.status === "cancelled" ? "cancelled" : o.fulfillmentStatus === "returned" ? "returned" : o.fulfillmentStatus === "delivered" ? "delivered" : o.fulfillmentStatus === "shipped" ? "shipped" : o.fulfillmentStatus === "processing" ? "processing" : "placed";
  return (
    <Link href={`/account/orders/${o.id}`} className="block">
      <Card className="hover:border-primary/40 transition-colors">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="num font-semibold">{t("order.orderNumber", { number: formatNumber(o.number) })}</span>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[11px] font-medium">{t(`order.steps.${statusKey}`)}</span>
            </div>
            <p className="text-muted-foreground num text-xs">
              {formatDate(o.createdAt, locale)} · {t("order.itemsCount", { count: formatNumber(count) })}
            </p>
          </div>
          <span className="num shrink-0 font-semibold">{formatMoney(o.total.amount, locale)}</span>
          <Sep className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </CardContent>
      </Card>
    </Link>
  );
}

/** Customer orders for the signed-in customer. */
export function OrdersView() {
  const t = useTranslations("store");
  const { customer, status } = useSession();
  const { data: orders = [], isPending: ordersPending } = useOrderList();
  const loading = status === "loading" || ordersPending;

  return (
    <div className="container max-w-3xl py-8">
      <GuestGate>
        <AccountNav />
        <h1 className="mb-6 text-2xl font-bold">{t("account.orders")}</h1>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : customer ? (
          (() => {
            const mine = orders.filter((o) => o.customerId === customer.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            return mine.length ? (
              <div className="space-y-3">
                {mine.map((o) => (
                  <OrderRow key={o.id} order={o} />
                ))}
              </div>
            ) : (
              <MsgEmptyState
                emptyKey="orders"
                action={
                  <Button asChild>
                    <Link href="/">{t("continue")}</Link>
                  </Button>
                }
              />
            );
          })()
        ) : null}
      </GuestGate>
    </div>
  );
}
