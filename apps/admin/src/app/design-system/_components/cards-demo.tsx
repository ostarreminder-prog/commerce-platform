import { getLocale, getTranslations } from "next-intl/server";
import { DollarSign, Percent, ShoppingBag, Wallet } from "lucide-react";
import { sampleStats, type SampleStat } from "@repo/api-client";
import { StatCard, StatCardSkeleton } from "@repo/ui/components/stat-card";
import { formatMoney, formatNumber, formatPercent, type Locale } from "@repo/ui/lib/format";

const ICONS = {
  revenue: DollarSign,
  orders: ShoppingBag,
  conversion: Percent,
  aov: Wallet,
} as const;

function formatStat(stat: SampleStat, locale: Locale) {
  switch (stat.key) {
    case "revenue":
    case "aov":
      return formatMoney(stat.value, locale);
    case "conversion":
      return formatPercent(stat.value);
    case "orders":
      return formatNumber(stat.value);
  }
}

export async function CardsDemo() {
  const [t, locale] = await Promise.all([getTranslations("designSystem.stats"), getLocale()]);
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sampleStats.map((stat) => (
          <StatCard
            key={stat.key}
            label={t(stat.key)}
            value={formatStat(stat, locale)}
            delta={stat.delta}
            hint={t("vsLastWeek")}
            icon={ICONS[stat.key]}
          />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    </div>
  );
}
