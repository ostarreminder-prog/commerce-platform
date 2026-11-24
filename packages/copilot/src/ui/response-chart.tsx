"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ChartSeriesPoint } from "../types";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { Quote } from "./quote";

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
} as const;

/**
 * Compact chart for copilot series — mirrors the dashboard SalesChart styling
 * but accepts label/value points instead of dated revenue series.
 */
export function ResponseChart({
  title,
  chartType,
  series,
}: {
  title?: string;
  chartType: "bar" | "line";
  series: ChartSeriesPoint[];
}) {
  const { dir } = useAppLocale();
  const rtl = dir === "rtl";

  const tooltip = (
    <Tooltip
      cursor={{ fill: "hsl(var(--muted))", stroke: "hsl(var(--border))" }}
      content={({ active, payload }) => {
        const point = payload?.[0]?.payload as ChartSeriesPoint | undefined;
        if (!active || !point) return null;
        return (
          <div className="bg-popover text-popover-foreground rounded-md border px-3 py-2 text-xs shadow-md">
            <p className="text-muted-foreground">{point.label}</p>
            <p className="num mt-1 font-semibold">{formatNumber(point.value)}</p>
          </div>
        );
      }}
    />
  );
  const xAxis = <XAxis dataKey="label" reversed={rtl} minTickGap={16} {...axisProps} />;
  const yAxis = (
    <YAxis
      orientation={rtl ? "right" : "left"}
      width={40}
      tickFormatter={(v: number) => formatNumber(v, { notation: "compact" })}
      {...axisProps}
    />
  );

  return (
    <Quote>
      {title ? <p className="text-xs font-semibold">{title}</p> : null}
      <div className="mt-2 h-48 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={series} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              {xAxis}
              {yAxis}
              {tooltip}
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          ) : (
            <LineChart data={series} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
              <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
              {xAxis}
              {yAxis}
              {tooltip}
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Quote>
  );
}
