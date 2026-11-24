"use client";

import * as React from "react";
import { CircleDollarSign, Download, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePartnerSummary } from "@repo/api-client";
import type { PartnerApp, PartnerSummary } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard } from "@repo/ui/components/stat-card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { ApiChart } from "@/components/api-chart";
import { AppLoader } from "./app-loader";

/** Scale the portal-wide series down to this app's footprint. */
function appSeries(series: PartnerSummary["series"], app: PartnerApp): PartnerSummary["series"] {
  const factor = Math.max(0.04, app.installs / 2200);
  return series.map((p) => ({ ...p, installs: Math.round(p.installs * factor), apiCalls: Math.round(p.apiCalls * factor) }));
}

function AnalyticsPanel({ app }: { app: PartnerApp }) {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const summary = usePartnerSummary();
  const series = React.useMemo(() => (summary.data ? appSeries(summary.data.series, app) : []), [summary.data, app]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label={t("detail.installsStat")} value={formatNumber(app.installs)} icon={Download} />
        <StatCard
          label={t("detail.ratingStat")}
          value={app.rating === 0 ? "—" : formatNumber(app.rating, { maximumFractionDigits: 1 })}
          icon={Star}
        />
        <StatCard label={t("detail.revenueStat")} value={formatMoney(app.revenue, locale)} icon={CircleDollarSign} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("detail.chart")} <span className="text-muted-foreground text-xs font-normal">{t("detail.chartNote")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>{summary.isPending ? <Skeleton className="h-72" /> : <ApiChart data={series} />}</CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsTab({ id }: { id: string }) {
  return <AppLoader id={id}>{(app) => <AnalyticsPanel app={app} />}</AppLoader>;
}
