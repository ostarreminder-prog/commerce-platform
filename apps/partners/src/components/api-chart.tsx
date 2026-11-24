"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PartnerSummary } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber, formatShortDate } from "@repo/ui/lib/format";

const axis = { tickLine: false, axisLine: false, tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 } } as const;

export function ApiChart({ data }: { data: PartnerSummary["series"] }) {
  const { locale, dir } = useAppLocale();
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id="apiFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
              <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <XAxis dataKey="date" reversed={dir === "rtl"} minTickGap={24} tickFormatter={(d: string) => formatShortDate(d, locale)} {...axis} />
          <YAxis orientation={dir === "rtl" ? "right" : "left"} width={44} tickFormatter={(v: number) => formatNumber(v, { notation: "compact" })} {...axis} />
          <Tooltip
            content={({ active, payload }) => {
              const p = payload?.[0]?.payload as PartnerSummary["series"][number] | undefined;
              if (!active || !p) return null;
              return (
                <div className="bg-popover rounded-md border px-3 py-2 text-xs shadow-md">
                  <p className="text-muted-foreground">{formatShortDate(p.date, locale)}</p>
                  <p className="num mt-1 font-semibold">{formatNumber(p.apiCalls)}</p>
                </div>
              );
            }}
          />
          <Area type="monotone" dataKey="apiCalls" stroke="hsl(var(--info))" strokeWidth={2} fill="url(#apiFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
