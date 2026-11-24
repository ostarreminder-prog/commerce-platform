"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PlatformSummary } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";

const axis = { tickLine: false, axisLine: false, tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } } as const;

export function MrrChart({ data }: { data: PlatformSummary["series"] }) {
  const { locale, dir } = useAppLocale();
  const month = new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn-ca-gregory" : "en", { month: "short" });
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="date" reversed={dir === "rtl"} tickFormatter={(d: string) => month.format(new Date(d))} {...axis} />
          <YAxis orientation={dir === "rtl" ? "right" : "left"} width={48} tickFormatter={(v: number) => formatNumber(v / 100, { notation: "compact" })} {...axis} />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as PlatformSummary["series"][number] | undefined;
              if (!active || !p) return null;
              return (
                <div className="bg-popover rounded-md border px-3 py-2 text-xs shadow-md">
                  <p className="text-muted-foreground">{month.format(new Date(p.date))}</p>
                  <p className="num mt-1 font-semibold">{formatMoney(p.mrr, locale)}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="mrr" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
