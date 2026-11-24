"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";

export interface BreakdownRow {
  key: string;
  label: React.ReactNode;
  value: number;
}

/** Ranked list with proportional bars — used by /reports and /reports/[type]. */
export function BreakdownCard({ title, rows, money = true }: { title: string; rows: BreakdownRow[]; money?: boolean }) {
  const { locale } = useAppLocale();
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{r.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="num font-medium">{money ? formatMoney(r.value, locale) : formatNumber(r.value)}</span>
                  <span className="text-muted-foreground num w-12 text-end text-xs">{formatPercent(r.value / total, 0)}</span>
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
