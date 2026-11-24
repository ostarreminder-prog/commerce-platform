"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAbandonedCartById, useCustomerList } from "@repo/api-client";
import type { AbandonedCart } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import Link from "@/components/store-link";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { recallListUrl } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { CustomerCell, SendButton, recoveryProbability, useCartConversation } from "./cart-shared";

function CartDetail({ cart }: { cart: AbandonedCart }) {
  const t = useTranslations("sales.carts");
  const { locale } = useAppLocale();
  const customers = useCustomerList();
  const convFor = useCartConversation();
  const conv = convFor(cart);
  const names = React.useMemo(() => new Map(customers.data?.map((c) => [c.id, c.name ?? c.phone])), [customers.data]);
  return (
    <div className="space-y-6 pb-8">
      <div>
        <Breadcrumbs items={[{ label: t("title"), href: recallListUrl("/abandoned-carts") }, { label: names.get(cart.customerId ?? "") ?? cart.phone }]} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{t("detailTitle")}</h1>
              <StatusBadge entity="abandonedCart" field="recoveryStatus" value={cart.recoveryStatus} />
            </div>
            <p className="text-muted-foreground text-sm">{t("abandoned", { when: formatRelativeTime(cart.abandonedAt, locale, NOW) })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SendButton cart={cart} size="default" />
            {conv ? <Button variant="outline" asChild><Link href={`/inbox/${conv.id}`}><MessageCircle aria-hidden />{t("openConversation")}</Link></Button> : null}
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{t("cols.items")}</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y rounded-md border">
              {cart.items.map((i) => {
                const name = i.name[locale] ?? i.name.ar;
                return (
                  <li key={i.variantId} className="flex items-center gap-3 p-3 text-sm">
                    <MediaThumb url={i.image?.url} label={name} />
                    <EntityLink type="product" id={i.productId} label={name} className="min-w-0 flex-1 truncate" />
                    <span className="num">× {i.quantity}</span>
                    <span className="num w-24 text-end">{formatMoney(i.price.amount * i.quantity, locale)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex justify-between text-base font-semibold"><span>{t("cols.total")}</span><span className="num">{formatMoney(cart.total.amount, locale)}</span></div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("cols.customer")}</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <CustomerCell cart={cart} names={names} />
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("cols.order")}</span>{cart.recoveredOrderId ? <EntityLink type="order" id={cart.recoveredOrderId} className="num" /> : <span>—</span>}</div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("source")}</span><span>{t(`sources.${cart.source}`)}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground">{t("probability")}</span><span className="num">{t("probabilityValue", { n: recoveryProbability(cart) })}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">{t("attemptsTitle")}</CardTitle></CardHeader>
            <CardContent>
              {cart.recoveryAttempts.length ? (
                <ol className="space-y-3 text-sm">
                  {cart.recoveryAttempts.map((a, n) => (
                    <li key={n} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{t(`channels.${a.channel}`)} {a.agentId ? <>· <EntityLink type="agent" id={a.agentId} /></> : null}</p>
                        <p className="text-muted-foreground text-xs">{formatDateTime(a.at, locale)}</p>
                        {a.message ? <p className="text-muted-foreground mt-1 line-clamp-2 text-xs" dir="auto">{a.message}</p> : null}
                      </div>
                      <span className={a.opened ? "text-success text-xs" : "text-muted-foreground text-xs"}>{a.opened ? t("opened") : t("notOpened")}</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="text-muted-foreground text-sm">{t("noAttempts")}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function AbandonedCartView({ id }: { id: string }) {
  const t = useTranslations("sales.carts");
  const query = useAbandonedCartById(id);
  return (
    <DataState
      state={query}
      loading={<div className="space-y-6"><Skeleton className="h-9 w-64" /><Skeleton className="h-72" /></div>}
      error={(retry) =>
        String((query.error as Error | null)?.message ?? "").includes("not found") ? (
          <Card><EmptyState title={t("notFound")} action={<Button asChild variant="outline"><Link href="/abandoned-carts">{t("back")}</Link></Button>} /></Card>
        ) : <ErrorState onRetry={retry ?? undefined} />
      }
    >
      {(c) => <CartDetail cart={c} />}
    </DataState>
  );
}
