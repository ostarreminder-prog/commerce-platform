"use client";

import * as React from "react";
import { Bot, Check, ChevronLeft, Circle, Eye, MessageSquare, Percent, Receipt, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useApprovals, useConversationList, useCustomerList, useHomeAnalytics, useInventoryLevels, useMe, useOrderList, useProductList, useStudioSummary,
} from "@repo/api-client";
import type { OrderChannel } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ErrorState } from "@repo/ui/components/error-state";
import { Progress } from "@repo/ui/components/progress";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard, StatCardSkeleton } from "@repo/ui/components/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber, formatPercent, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import Link from "@/components/store-link";
import { SalesChart } from "@/features/dashboard/sales-chart";
import { ListCard } from "@/features/dashboard/list-card";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { ORDER_CHANNELS } from "@repo/api-client";
import { OrderChannelIcon } from "@repo/ui/components/order-channel-icon";

const DAY = 86_400_000;
const startOfToday = NOW - (NOW % DAY) - 3 * 3_600_000;
const SETUP_LINKS = { products: "/products/new", payments: "/settings/payments", shipping: "/settings/shipping", whatsapp: "/agents/channels", domain: "/storefront/domains", published: "/storefront" } as const;

export function Home() {
  const t = useTranslations("sales.home");
  const tch = useTranslations("channels");
  const { locale } = useAppLocale();
  const me = useMe();
  const orders = useOrderList();
  const customers = useCustomerList();
  const conversations = useConversationList();
  const approvals = useApprovals();
  const levels = useInventoryLevels();
  const products = useProductList();
  const analytics = useHomeAnalytics();
  const studio = useStudioSummary();
  const [metric, setMetric] = React.useState<"revenue" | "orders">("revenue");

  const data = React.useMemo(() => {
    const list = (orders.data ?? []).filter((o) => o.status !== "cancelled");
    const at = (o: { createdAt: string }) => new Date(o.createdAt).getTime();
    const today = list.filter((o) => at(o) >= startOfToday);
    const yesterday = list.filter((o) => at(o) >= startOfToday - DAY && at(o) < startOfToday);
    const sum = (xs: typeof list) => xs.reduce((s, o) => s + o.total.amount, 0);
    const last30 = list.filter((o) => at(o) >= NOW - 30 * DAY);
    const byChannel = ORDER_CHANNELS.map((c) => ({ channel: c, count: last30.filter((o) => o.channel === c).length })).filter((x) => x.count > 0);
    const agentSales = sum(last30.filter((o) => o.agentId));
    return { today, yesterday, salesToday: sum(today), salesYesterday: sum(yesterday), byChannel, total30: last30.length, agentSales };
  }, [orders.data]);

  const names = React.useMemo(() => new Map(customers.data?.map((c) => [c.id, c.name ?? c.phone])), [customers.data]);
  const needsAction = (orders.data ?? []).filter((o) => o.status === "needs_action");
  const waiting = (conversations.data ?? []).filter((c) => c.status === "waiting_human").sort((a, b) => (a.waitingSince ?? "").localeCompare(b.waitingSince ?? ""));
  const pendingApprovals = (approvals.data ?? []).filter((a) => a.status === "pending");
  const lowStock = React.useMemo(() => {
    const byVariant = new Map<string, { available: number; threshold: number }>();
    (levels.data ?? []).forEach((l) => {
      const cur = byVariant.get(l.variantId) ?? { available: 0, threshold: 0 };
      byVariant.set(l.variantId, { available: cur.available + l.available, threshold: Math.max(cur.threshold, l.lowStockThreshold) });
    });
    return (products.data ?? []).flatMap((p) => p.variants.flatMap((v) => {
      const s = byVariant.get(v.id);
      return s && v.trackInventory && s.available <= s.threshold ? [{ product: p, variant: v, available: s.available }] : [];
    })).sort((a, b) => a.available - b.available);
  }, [levels.data, products.data]);

  const delta = data.salesYesterday ? (data.salesToday - data.salesYesterday) / data.salesYesterday : undefined;
  const visitors = analytics.data?.visitors;
  const setup = analytics.data?.setup;
  const setupDone = setup ? Object.values(setup).filter(Boolean).length : 0;
  const setupTotal = setup ? Object.keys(setup).length : 0;

  if (orders.isError) return <ErrorState onRetry={() => orders.refetch()} />;
  const kpiLoading = orders.isPending || analytics.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{me.data ? t("greeting", { name: me.data.name.split(" ")[0] ?? "" }) : <Skeleton className="h-8 w-48" />}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("subtitle")}</p>
      </div>

      {setup && setupDone < setupTotal ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">{t("setup.title")}</CardTitle>
              <span className="text-muted-foreground num text-sm">{t("setup.progress", { done: setupDone, total: setupTotal })}</span>
            </div>
            <Progress value={(setupDone / setupTotal) * 100} className="mt-2 h-1.5" />
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(SETUP_LINKS) as (keyof typeof SETUP_LINKS)[]).map((k) => (
              <Link key={k} href={SETUP_LINKS[k]} className={cn("hover:bg-accent/50 flex items-center gap-3 rounded-md border p-3 text-sm", setup[k] && "text-muted-foreground")}>
                {setup[k] ? <Check className="text-success size-4" aria-hidden /> : <Circle className="text-muted-foreground size-4" aria-hidden />}
                <span className={cn(setup[k] && "line-through")}>{t(`setup.${k}`)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiLoading ? Array.from({ length: 5 }, (_, i) => <StatCardSkeleton key={i} />) : (
          <>
            <Link href="/reports/sales?range=today" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <StatCard label={t("kpi.salesToday")} value={formatMoney(data.salesToday, locale)} icon={Wallet} delta={delta} hint={t("kpi.vsYesterday")} className="hover:border-primary/40 h-full" />
            </Link>
            <Link href="/orders?period=today" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <StatCard label={t("kpi.ordersToday")} value={formatNumber(data.today.length)} icon={ShoppingBag} className="hover:border-primary/40 h-full" />
            </Link>
            <Link href="/reports/sales?range=today" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <StatCard label={t("kpi.aov")} value={formatMoney(data.today.length ? Math.round(data.salesToday / data.today.length) : 0, locale)} icon={Receipt} className="hover:border-primary/40 h-full" />
            </Link>
            <Link href="/reports/traffic?range=today" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <StatCard label={t("kpi.visitors")} value={formatNumber(visitors?.today ?? 0)} icon={Eye} delta={visitors ? (visitors.today - visitors.yesterday) / visitors.yesterday : undefined} hint={t("kpi.vsYesterday")} className="hover:border-primary/40 h-full" />
            </Link>
            <Link href="/reports/traffic?range=today" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <StatCard label={t("kpi.conversion")} value={formatPercent(visitors?.today ? data.today.length / visitors.today : 0)} icon={Percent} className="hover:border-primary/40 h-full" />
            </Link>
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ListCard title={t("lists.needsAction")} href="/orders?status=needs_action" count={needsAction.length} loading={orders.isPending} empty={t("lists.noneNeedsAction")}>
          {needsAction.slice(0, 5).map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <EntityLink type="order" id={o.id} className="num font-medium" />
                <p className="text-muted-foreground truncate text-xs">{names.get(o.customerId)} · {formatRelativeTime(o.createdAt, locale, NOW)}</p>
              </div>
              <StatusBadge entity="order" field="paymentStatus" value={o.paymentStatus} />
            </li>
          ))}
        </ListCard>
        <ListCard title={t("lists.waiting")} href="/inbox?status=waiting_human" count={waiting.length} loading={conversations.isPending} empty={t("lists.noneWaiting")}>
          {waiting.slice(0, 5).map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <EntityLink type="conversation" id={c.id} className="font-medium" />
                <p className="text-muted-foreground line-clamp-1 text-xs">{c.aiSummary}</p>
              </div>
              <span className="text-warning shrink-0 text-xs">{c.waitingSince ? formatRelativeTime(c.waitingSince, locale, NOW) : null}</span>
            </li>
          ))}
        </ListCard>
        <ListCard title={t("lists.approvals")} href="/approvals" count={pendingApprovals.length} loading={approvals.isPending} empty={t("lists.noneApprovals")}>
          {pendingApprovals.slice(0, 5).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <Link href={`/approvals?id=${a.id}`} className="font-medium hover:underline">{t(`approvalActions.${a.action}`)}</Link>
                <p className="text-muted-foreground truncate text-xs"><EntityLink type="agent" id={a.agentId} /> · {a.reason}</p>
              </div>
              {a.amount ? <span className="num shrink-0 text-xs font-medium">{formatMoney(a.amount.amount, locale)}</span> : null}
            </li>
          ))}
        </ListCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">{t("charts.sales30")}</CardTitle>
            <Tabs value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
              <TabsList className="h-8">
                <TabsTrigger value="revenue" className="text-xs">{t("charts.revenue")}</TabsTrigger>
                <TabsTrigger value="orders" className="text-xs">{t("charts.orders")}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>{analytics.data ? <SalesChart data={analytics.data.salesSeries} metric={metric} /> : <Skeleton className="h-64" />}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("charts.byChannel")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {orders.isPending ? <Skeleton className="h-40" /> : data.byChannel.map(({ channel, count }) => (
              <Link key={channel} href={`/orders?channel=${channel}&period=30d`} className="group block space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 group-hover:underline"><OrderChannelIcon channel={channel as OrderChannel} />{tch(channel)}</span>
                  <span className="num text-muted-foreground">{formatNumber(count)} · {formatPercent(count / Math.max(1, data.total30))}</span>
                </div>
                <Progress value={(count / Math.max(1, data.total30)) * 100} className="h-2" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ListCard title={t("lists.lowStock")} href="/inventory?stock=low" count={lowStock.length} loading={levels.isPending || products.isPending} empty={t("lists.noneLowStock")}>
          {lowStock.slice(0, 5).map(({ product, variant, available }) => (
            <li key={variant.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="min-w-0">
                <EntityLink type="product" id={product.id} className="line-clamp-1 font-medium" />
                <p className="num text-muted-foreground text-xs" dir="ltr">{variant.sku}</p>
              </div>
              <span className={cn("num shrink-0 text-xs font-medium", available === 0 ? "text-destructive" : "text-warning")}>{t("lists.left", { n: available })}</span>
            </li>
          ))}
        </ListCard>
        <ListCard title={t("lists.latest")} href="/orders" loading={orders.isPending} empty={t("lists.noneLatest")}>
          {(orders.data ?? []).slice(0, 5).map((o) => (
            <li key={o.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <OrderChannelIcon channel={o.channel} />
                <div className="min-w-0">
                  <EntityLink type="order" id={o.id} className="num font-medium" />
                  <p className="text-muted-foreground truncate text-xs">{names.get(o.customerId)}</p>
                </div>
              </div>
              <span className="num shrink-0 font-medium">{formatMoney(o.total.amount, locale)}</span>
            </li>
          ))}
        </ListCard>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Bot className="text-primary size-4" aria-hidden />{t("agents.title")}</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/agents">{t("viewAll")}<ChevronLeft className="ltr:rotate-180" aria-hidden /></Link></Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {studio.isPending ? <Skeleton className="h-32" /> : studio.data ? (
              <>
                <Link href="/agents/history?range=today" className="hover:bg-accent/50 flex items-center justify-between rounded-md border p-3 text-sm">
                  <span className="flex items-center gap-2"><MessageSquare className="text-muted-foreground size-4" aria-hidden />{t("agents.conversationsToday")}</span>
                  <span className="num font-semibold">{formatNumber(studio.data.conversationsToday)}</span>
                </Link>
                <Link href="/agents/history?outcome=resolved" className="hover:bg-accent/50 flex items-center justify-between rounded-md border p-3 text-sm">
                  <span className="flex items-center gap-2"><Check className="text-muted-foreground size-4" aria-hidden />{t("agents.resolution")}</span>
                  <span className="num font-semibold">{formatPercent(studio.data.resolutionRate)}</span>
                </Link>
                <Link href="/reports/agents" className="hover:bg-accent/50 flex items-center justify-between rounded-md border p-3 text-sm">
                  <span className="flex items-center gap-2"><TrendingUp className="text-muted-foreground size-4" aria-hidden />{t("agents.sales")}</span>
                  <span className="num font-semibold">{formatMoney(data.agentSales, locale)}</span>
                </Link>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
