"use client";

import { CheckCircle2, Clock, Coins, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionRecord } from "@repo/contracts";
import { StatCard } from "@repo/ui/components/stat-card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatPercent } from "@repo/ui/lib/format";
import { clock } from "./shared";

export function HistoryKpis({ all }: { all: SessionRecord[] }) {
  const t = useTranslations("studio.history");
  const { locale } = useAppLocale();
  const rated = all.filter((s) => s.rating !== null);
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        label={t("kpi.resolved")}
        value={formatPercent(
          all.filter((s) => s.outcome === "resolved").length / all.length,
          0,
        )}
        icon={CheckCircle2}
      />
      <StatCard
        label={t("kpi.duration")}
        value={clock(all.reduce((s, x) => s + x.durationSec, 0) / all.length)}
        icon={Clock}
      />
      <StatCard
        label={t("kpi.cost")}
        value={formatMoney(
          all.reduce((s, x) => s + x.cost, 0),
          locale,
        )}
        icon={Coins}
      />
      <StatCard
        label={t("kpi.rating")}
        value={(
          rated.reduce((s, x) => s + (x.rating ?? 0), 0) / Math.max(1, rated.length)
        ).toFixed(1)}
        icon={Star}
      />
    </div>
  );
}
