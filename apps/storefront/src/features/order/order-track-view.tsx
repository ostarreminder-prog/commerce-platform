"use client";

import Link from "next/link";
import { CheckCircle2, ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrderList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { OrderActions } from "./order-actions";
import { OrderReturnsCard } from "./order-returns";
import { OrderFilesCard, OrderItemsCard, OrderMetaCard } from "./order-summary";
import { OrderTimeline } from "./order-timeline";

/**
 * Order confirmation + tracking page. `token` accepts the order id (`ord_*`)
 * or its public number — the order is resolved from the shared orders list.
 */
export function OrderTrackView({ token, confirmation = true }: { token: string; confirmation?: boolean }) {
  const t = useTranslations("store");
  const { dir } = useAppLocale();
  const { data: orders, isPending } = useOrderList();
  const order = orders?.find((o) => o.id === token || String(o.number) === token);
  const Sep = dir === "rtl" ? ChevronLeft : ChevronRight;

  if (isPending)
    return (
      <div className="container max-w-3xl space-y-6 py-10">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );

  if (!order)
    return (
      <div className="container py-16">
        <EmptyState
          icon={PackageSearch}
          title={t("order.notFoundTitle")}
          description={t("order.notFoundText")}
          action={
            <Button asChild variant="outline">
              <Link href="/">{t("backHome")}</Link>
            </Button>
          }
        />
      </div>
    );

  return (
    <div className="container max-w-4xl space-y-8 py-10">
      {confirmation ? (
        <div className="space-y-2 text-center">
          <CheckCircle2 className="text-success mx-auto size-14" aria-hidden />
          <h1 className="text-2xl font-bold sm:text-3xl">{t("order.thanks")}</h1>
          <p className="text-muted-foreground">{t("order.received", { number: formatNumber(order.number) })}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <Link href="/account/orders" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
            <Sep className="size-4 rotate-180" aria-hidden />
            {t("order.backToOrders")}
          </Link>
          <h1 className="text-2xl font-bold">{t("order.orderNumber", { number: formatNumber(order.number) })}</h1>
        </div>
      )}
      <OrderActions order={order} />
      <div className="grid gap-6 md:grid-cols-5">
        <div className="md:col-span-3">
          <OrderItemsCard order={order} />
        </div>
        <div className="space-y-6 md:col-span-2">
          <OrderFilesCard order={order} />
          <OrderTimeline order={order} />
          <OrderReturnsCard order={order} />
          <OrderMetaCard order={order} />
        </div>
      </div>
    </div>
  );
}
