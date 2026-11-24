"use client";

import * as React from "react";
import { BarChart3, Bot, Download, Megaphone, Package, Percent, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCategoryList, useHomeAnalytics, useOrderList, useProductList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard } from "@repo/ui/components/stat-card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { SalesChart } from "@/features/dashboard/sales-chart";
import { BreakdownCard } from "./breakdown-card";
import { REPORT_TYPES } from "./report-data";

const REPORT_ICONS = { sales: BarChart3, products: Package, customers: Users, agents: Bot, marketing: Megaphone, tax: Percent } as const;

const group = <T,>(items: T[], key: (i: T) => string, value: (i: T) => number) => {
  const m = new Map<string, number>();
  for (const i of items) m.set(key(i), (m.get(key(i)) ?? 0) + value(i));
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

export function ReportsView() {
  const t = useTranslations("reports");
  const tch = useTranslations("orders");
  const tpm = useTranslations("paymentMethodName");
  const { locale } = useAppLocale();
  const dashboard = useHomeAnalytics();
  const { data: orders = [] } = useOrderList();
  const { data: products = [] } = useProductList();
  const { data: categories = [] } = useCategoryList();
  const [range, setRange] = React.useState("30");
  const [metric, setMetric] = React.useState<"revenue" | "orders">("revenue");

  const valid = orders.filter((o) => o.status !== "cancelled");
  const channels = group(valid, (o) => o.channel, (o) => o.total.amount).map(([k, v]) => ({ key: k, label: tch(`channel.${k as "storefront"}`), value: v }));
  const payments = group(valid, (o) => o.paymentMethod, (o) => o.total.amount).map(([k, v]) => ({ key: k, label: tpm(k as "mada"), value: v }));
  const cities = group(valid, (o) => o.shippingAddress.city, () => 1).slice(0, 5).map(([k, v]) => ({ key: k, label: k, value: v }));
  const cats = group(products, (p) => p.categoryIds[0] ?? "", (p) => p.stats.revenue30d.amount).map(([k, v]) => ({
    key: k,
    label: categories.find((c) => c.id === k)?.name[locale] ?? k,
    value: v,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-40" aria-label={t("range.30")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["7", "30", "90"] as const).map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`range.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download aria-hidden />
              {t("export")}
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {REPORT_TYPES.map((r) => {
          const Icon = REPORT_ICONS[r];
          return (
            <Link key={r} href={`/reports/${r}`} className="block">
              <Card className="hover:bg-accent/40 h-full transition-colors">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">{t(`types.${r}`)}</p>
                    <p className="text-muted-foreground line-clamp-2 text-sm">{t(`typeDesc.${r}`)}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
      <DataState
        state={dashboard}
        loading={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-80" />
          </div>
        }
      >
        {(d) => (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label={t("kpi.revenue")} value={formatMoney(d.revenue, locale)} delta={d.revenueDelta} />
              <StatCard label={t("kpi.orders")} value={formatNumber(d.orders)} delta={d.ordersDelta} />
              <StatCard label={t("kpi.aov")} value={formatMoney(d.averageOrderValue, locale)} delta={d.aovDelta} />
              <StatCard label={t("kpi.conversion")} value={formatPercent(d.conversionRate)} delta={d.conversionDelta} />
            </div>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">{t("revenueTitle")}</CardTitle>
                <div className="bg-muted inline-flex rounded-md p-1" role="tablist">
                  {(["revenue", "orders"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={metric === m}
                      onClick={() => setMetric(m)}
                      className={`focus-visible:ring-ring rounded px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 ${metric === m ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                    >
                      {m === "revenue" ? t("revenue") : t("kpi.orders")}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="h-72 ps-0">
                <SalesChart data={d.salesSeries} metric={metric} />
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
              <BreakdownCard title={t("channelsTitle")} rows={channels} />
              <BreakdownCard title={t("paymentsTitle")} rows={payments} />
              <BreakdownCard title={t("categoriesTitle")} rows={cats} />
              <BreakdownCard title={t("citiesTitle")} rows={cities} money={false} />
            </div>
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-primary flex items-center gap-2 text-base">
                  <Bot className="size-5" aria-hidden />
                  {t("agentTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  [formatNumber(d.agentActivity.conversations), t("agent.conversations")],
                  [formatPercent(d.agentActivity.resolvedRate, 0), t("agent.resolved")],
                  [formatNumber(d.agentActivity.recoveredCarts), t("agent.carts")],
                  [formatMoney(d.agentActivity.revenue, locale), t("agent.revenue")],
                ].map(([v, l]) => (
                  <div key={l} className="bg-background rounded-lg border p-4">
                    <div className="num text-xl font-semibold">{v}</div>
                    <div className="text-muted-foreground text-xs">{l}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </div>
  );
}
