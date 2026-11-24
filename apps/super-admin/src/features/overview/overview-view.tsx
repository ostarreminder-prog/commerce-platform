"use client";

import Link from "next/link";
import { Bot, Building2, CircleDollarSign, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlans, usePlatformSummary, useTenants } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Progress } from "@repo/ui/components/progress";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard, StatCardSkeleton } from "@repo/ui/components/stat-card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { PlanBadge, TenantLogo, TenantStatusBadge } from "@/components/badges";
import { MrrChart } from "@/components/mrr-chart";

export function OverviewView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const summary = usePlatformSummary();
  const { data: plans = [] } = usePlans();
  const { data: tenants = [] } = useTenants();
  const s = summary.data;
  const totalSubs = plans.reduce((n, p) => n + p.tenants, 0) || 1;
  const latest = [...tenants].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title={t("overview.title")} description={t("overview.description")} />
      {summary.isError ? <ErrorState title={t("common.error")} onRetry={() => void summary.refetch()} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s ? (
          <>
            <StatCard label={t("overview.mrr")} value={formatMoney(s.mrr, locale)} delta={s.mrrDelta} icon={CircleDollarSign} />
            <StatCard label={t("overview.tenants")} value={formatNumber(s.tenants)} delta={s.tenantsDelta} icon={Building2} />
            <StatCard label={t("overview.gmv")} value={formatMoney(s.gmv, locale)} delta={s.gmvDelta} icon={ShoppingCart} />
            <StatCard label={t("overview.ai")} value={formatNumber(s.aiConversations)} delta={s.aiDelta} icon={Bot} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("overview.mrrChart")}</CardTitle>
          </CardHeader>
          <CardContent>{s ? <MrrChart data={s.series} /> : <Skeleton className="h-72" />}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("overview.planMix")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {plans.map((p) => (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name[locale] ?? p.name.ar}</span>
                  <span className="text-muted-foreground num">{formatPercent(p.tenants / totalSubs, 0)}</span>
                </div>
                <Progress value={(p.tenants / totalSubs) * 100} aria-label={p.name[locale] ?? p.name.ar} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("overview.latest")}</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/tenants">{t("overview.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {latest.map((tn) => (
                <li key={tn.id} className="flex items-center gap-3 px-6 py-3">
                  <TenantLogo name={tn.name} hue={tn.hue} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tn.name}</p>
                    <p className="text-muted-foreground truncate text-xs" dir="ltr">
                      {tn.domain}
                    </p>
                  </div>
                  <PlanBadge plan={tn.plan} />
                  <span className="hidden sm:inline-flex">
                    <TenantStatusBadge status={tn.status} />
                  </span>
                  <span className="text-muted-foreground hidden text-xs md:inline">{formatDate(tn.createdAt, locale)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("overview.health")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {s?.services.map((svc) => (
              <div key={svc.name} className="flex items-center gap-3 text-sm">
                <span className={cn("size-2.5 rounded-full", svc.status === "operational" ? "bg-success" : "bg-warning animate-pulse")} aria-hidden />
                <span className="flex-1 font-medium" dir="ltr">
                  {svc.name}
                </span>
                <span className={cn("text-xs", svc.status === "operational" ? "text-muted-foreground" : "text-warning font-medium")}>
                  {t(`overview.${svc.status}`)}
                </span>
                <span className="text-muted-foreground num w-16 text-end text-xs" dir="ltr">{`${formatNumber(svc.latencyMs)} ms`}</span>
              </div>
            )) ?? <Skeleton className="h-40" />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
