"use client";

import { AlertTriangle, Bot, CircleDollarSign, Gauge, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlans, usePlatformSummary, useTenants } from "@repo/api-client";
import type { AgentKind } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { PageHeader } from "@repo/ui/components/page-header";
import { Progress } from "@repo/ui/components/progress";
import { StatCard, StatCardSkeleton } from "@repo/ui/components/stat-card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { PlanBadge, TenantLogo } from "@/components/badges";

const KINDS: AgentKind[] = ["support", "sales", "marketing", "inventory"];

export function AiUsageView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const { data: s } = usePlatformSummary();
  const { data: tenants = [] } = useTenants();
  const { data: plans = [] } = usePlans();
  const total = s ? KINDS.reduce((n, k) => n + s.aiByKind[k], 0) : 1;
  const top = [...tenants].sort((a, b) => b.aiConversations - a.aiConversations).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title={t("ai.title")} description={t("ai.description")} />
      <Alert variant="warning">
        <AlertTriangle aria-hidden />
        <AlertDescription>{t("ai.alert")}</AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {s ? (
          <>
            <StatCard label={t("ai.conversations")} value={formatNumber(total)} delta={s.aiDelta} icon={Bot} />
            <StatCard label={t("ai.cost")} value={formatMoney(s.aiCost, locale)} icon={CircleDollarSign} />
            <StatCard label={t("ai.perConversation")} value={formatMoney(Math.round(s.aiCost / total), locale)} icon={Gauge} />
            <StatCard label={t("ai.margin")} value={formatPercent(0.68, 0)} delta={0.04} icon={TrendingUp} />
          </>
        ) : (
          Array.from({ length: 4 }, (_, i) => <StatCardSkeleton key={i} />)
        )}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("ai.byAgent")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {KINDS.map((k) => (
              <div key={k} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{t(`ai.kind.${k}`)}</span>
                  <span className="text-muted-foreground num">{formatNumber(s?.aiByKind[k] ?? 0)}</span>
                </div>
                <Progress value={((s?.aiByKind[k] ?? 0) / total) * 100} aria-label={t(`ai.kind.${k}`)} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("ai.topTenants")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y">
              {top.map((tn) => {
                const quota = plans.find((p) => p.id === tn.plan)?.aiConversations ?? 1;
                const monthly = Math.round(tn.aiConversations / 6);
                const ratio = Math.min(1, monthly / quota);
                return (
                  <li key={tn.id} className="flex items-center gap-3 px-6 py-3">
                    <TenantLogo name={tn.name} hue={tn.hue} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="flex items-center gap-2 truncate font-medium">
                          {tn.name} <PlanBadge plan={tn.plan} />
                        </span>
                        <span className={cn("num text-xs", ratio >= 0.9 ? "text-destructive font-semibold" : "text-muted-foreground")} dir="ltr">
                          {`${formatNumber(monthly)} / ${formatNumber(quota)}`}
                        </span>
                      </div>
                      <Progress value={ratio * 100} aria-label={`${t("ai.usage")}: ${tn.name}`} className={cn(ratio >= 0.9 && "[&>div]:bg-destructive")} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
