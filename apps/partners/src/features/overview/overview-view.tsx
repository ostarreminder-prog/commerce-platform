"use client";

import Link from "next/link";
import { Activity, AlertCircle, CircleDollarSign, Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePartnerApps, usePartnerSummary } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard, StatCardSkeleton } from "@repo/ui/components/stat-card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber, formatPercent, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import { ApiChart } from "@/components/api-chart";
import { AppIcon } from "@/components/app-icon";
import { AppStatusBadge } from "@/components/app-status-badge";

export function OverviewView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const summary = usePartnerSummary();
  const { data: apps = [] } = usePartnerApps();
  const s = summary.data;
  return (
    <div className="space-y-6">
      <PageHeader title={t("overview.title")} description={t("overview.description")} />
      {summary.isError ? <ErrorState title={t("common.error")} onRetry={() => void summary.refetch()} /> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s ? (
          <>
            <StatCard label={t("overview.installs")} value={formatNumber(s.installs)} delta={s.installsDelta} icon={Download} />
            <StatCard label={t("overview.revenue")} value={formatMoney(s.revenue, locale)} delta={s.revenueDelta} icon={CircleDollarSign} />
            <StatCard label={t("overview.apiCalls")} value={formatNumber(s.apiCalls, { notation: "compact", maximumFractionDigits: 1 })} delta={s.apiCallsDelta} icon={Activity} />
            <StatCard label={t("overview.errorRate")} value={formatPercent(s.errorRate, 2)} icon={AlertCircle} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("overview.chart")}</CardTitle>
          </CardHeader>
          <CardContent>{s ? <ApiChart data={s.series} /> : <Skeleton className="h-72" />}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("overview.myApps")}</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/apps">{t("overview.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {apps.map((a) => (
              <Link key={a.id} href={`/apps/${a.id}`} className="hover:bg-muted/50 -mx-2 flex items-center gap-3 rounded-lg p-2">
                <AppIcon name={a.name[locale] ?? a.name.ar} hue={a.hue} className="size-9 text-sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{a.name[locale] ?? a.name.ar}</span>
                  <span className="text-muted-foreground num block text-xs">{t("apps.installs", { count: formatNumber(a.installs) })}</span>
                </span>
                <AppStatusBadge status={a.status} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("overview.events")}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y">
            {s?.recentEvents.map((e) => (
              <li key={e.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs" dir="ltr">
                  {e.event}
                </code>
                <span className="text-muted-foreground min-w-0 flex-1 truncate">{e.storeName}</span>
                <Badge variant={e.status === "delivered" ? "success" : "destructive"}>{t(`overview.${e.status}`)}</Badge>
                <span className="text-muted-foreground hidden w-24 text-end text-xs sm:inline">{formatRelativeTime(e.at, locale, NOW)}</span>
              </li>
            )) ?? <Skeleton className="m-6 h-40" />}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
