"use client";

import { CheckCircle2, Coins, MessagesSquare, Phone, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStudioSummary } from "@repo/api-client";
import { DataState } from "@repo/ui/components/data-state";
import { StatCard, StatCardSkeleton } from "@repo/ui/components/stat-card";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

export function StudioKpis() {
  const t = useTranslations("studio.kpi");
  const { locale } = useAppLocale();
  const summary = useStudioSummary();
  return (
    <DataState
      state={summary}
      loading={
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      {(s) => (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard
            label={t("conversations")}
            value={formatNumber(s.conversationsToday)}
            delta={s.conversationsDelta}
            icon={MessagesSquare}
            hint={t("vsYesterday")}
          />
          <StatCard
            label={t("calls")}
            value={formatNumber(s.callsToday)}
            delta={s.callsDelta}
            icon={Phone}
            hint={t("vsYesterday")}
          />
          <StatCard
            label={t("resolution")}
            value={formatPercent(s.resolutionRate, 0)}
            delta={s.resolutionDelta}
            icon={CheckCircle2}
            hint={t("vsYesterday")}
          />
          <StatCard
            label={t("handoff")}
            value={formatPercent(s.humanHandoffRate, 0)}
            delta={s.handoffDelta}
            icon={UserRound}
            hint={t("vsYesterday")}
          />
          <StatCard
            className="col-span-2 lg:col-span-1"
            label={t("cost")}
            value={formatMoney(s.costToday, locale)}
            delta={s.costDelta}
            icon={Coins}
            hint={t("vsYesterday")}
          />
        </div>
      )}
    </DataState>
  );
}
