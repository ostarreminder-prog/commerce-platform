"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesPoint } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber, formatShortDate } from "@repo/ui/lib/format";

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
} as const;

export function SalesChart({ data, metric }: { data: SalesPoint[]; metric: "revenue" | "orders" }) {
  const { locale, dir } = useAppLocale();
  const rtl = dir === "rtl";
  const compact = (v: number) =>
    metric === "revenue"
      ? formatNumber(v / 100, { notation: "compact", maximumFractionDigits: 1 })
      : formatNumber(v);

  const tooltip = (
    <Tooltip
      cursor={{ fill: "hsl(var(--muted))", stroke: "hsl(var(--border))" }}
      content={({ active, payload }) => {
        const point = payload?.[0]?.payload as SalesPoint | undefined;
        if (!active || !point) return null;
        return (
          <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
            <p className="text-muted-foreground">{formatShortDate(point.date, locale)}</p>
            <p className="num mt-1 font-semibold">
              {metric === "revenue" ? formatMoney(point.revenue, locale) : formatNumber(point.orders)}
            </p>
          </div>
        );
      }}
    />
  );

  const xAxis = (
    <XAxis
      dataKey="date"
      reversed={rtl}
      tickFormatter={(d: string) => formatShortDate(d, locale)}
      minTickGap={24}
      {...axisProps}
    />
  );
  const yAxis = (
    <YAxis orientation={rtl ? "right" : "left"} width={44} tickFormatter={compact} {...axisProps} />
  );

  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        {metric === "revenue" ? (
          <AreaChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            {xAxis}
            {yAxis}
            {tooltip}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueFill)"
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
