"use client";

import * as React from "react";
import { CheckCircle2, Clock, Coins, MessagesSquare, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAgentPerformance } from "@repo/api-client";
import type { AgentChannel } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard, StatCardSkeleton } from "@repo/ui/components/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber, formatPercent, formatShortDate } from "@repo/ui/lib/format";
import type { TabProps } from "./shared";

const axis = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 11 },
} as const;

export function PerformanceTab({ draft }: Pick<TabProps, "draft">) {
  const t = useTranslations("studio.detail.performance");
  const tc = useTranslations("studio.channel");
  const { locale, dir } = useAppLocale();
  const rtl = dir === "rtl";
  const [channel, setChannel] = React.useState<AgentChannel | "all">("all");
  const [days, setDays] = React.useState(30);
  const perf = useAgentPerformance(draft.id, channel, days);
  const fmtSec = (s: number) =>
    `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
          <TabsList>
            <TabsTrigger value="all">{t("allChannels")}</TabsTrigger>
            {draft.channels.map((c) => (
              <TabsTrigger key={c} value={c}>
                {tc(c)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))} className="ms-auto">
          <TabsList>
            {[7, 30, 90].map((d) => (
              <TabsTrigger key={d} value={String(d)} className="num">
                {t("days", { count: d })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <DataState
        state={perf}
        loading={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {Array.from({ length: 5 }, (_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        }
      >
        {(points) => {
          const active = points.filter((p) => p.conversations);
          const total = points.reduce((s, p) => s + p.conversations, 0);
          const avg = (k: "resolutionRate" | "handoffRate" | "avgDurationSec") =>
            active.length
              ? active.reduce((s, p) => s + p[k] * p.conversations, 0) / Math.max(1, total)
              : 0;
          const cost = points.reduce((s, p) => s + p.cost, 0);
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <StatCard
                  label={t("conversations")}
                  value={formatNumber(total)}
                  icon={MessagesSquare}
                />
                <StatCard
                  label={t("resolution")}
                  value={formatPercent(avg("resolutionRate"), 0)}
                  icon={CheckCircle2}
                />
                <StatCard
                  label={t("handoff")}
                  value={formatPercent(avg("handoffRate"), 0)}
                  icon={UserRound}
                />
                <StatCard
                  label={t("duration")}
                  value={fmtSec(avg("avgDurationSec"))}
                  icon={Clock}
                />
                <StatCard
                  className="col-span-2 lg:col-span-1"
                  label={t("cost")}
                  value={formatMoney(cost, locale)}
                  icon={Coins}
                  hint={t("perConversation", {
                    value: formatMoney(Math.round(cost / Math.max(1, total)), locale),
                  })}
                />
              </div>
              <div className="grid gap-6 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("volume")}</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer>
                      <AreaChart data={points} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
                        <defs>
                          <linearGradient id="convFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          vertical={false}
                          stroke="hsl(var(--border))"
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          dataKey="date"
                          reversed={rtl}
                          tickFormatter={(d: string) => formatShortDate(d, locale)}
                          minTickGap={24}
                          {...axis}
                        />
                        <YAxis orientation={rtl ? "right" : "left"} width={36} {...axis} />
                        <Tooltip
                          labelFormatter={(d) => formatShortDate(String(d), locale)}
                          formatter={(v) => [formatNumber(Number(v)), t("conversations")]}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--popover))",
                            direction: dir,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="conversations"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#convFill)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base">{t("rates")}</CardTitle>
                    <div className="flex gap-3 text-xs">
                      <span className="flex items-center gap-1.5">
                        <span className="bg-success size-2 rounded-full" aria-hidden />
                        {t("resolution")}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="bg-warning size-2 rounded-full" aria-hidden />
                        {t("handoff")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer>
                      <LineChart data={active} margin={{ top: 8, bottom: 0, left: 0, right: 0 }}>
                        <CartesianGrid
                          vertical={false}
                          stroke="hsl(var(--border))"
                          strokeDasharray="3 3"
                        />
                        <XAxis
                          dataKey="date"
                          reversed={rtl}
                          tickFormatter={(d: string) => formatShortDate(d, locale)}
                          minTickGap={24}
                          {...axis}
                        />
                        <YAxis
                          orientation={rtl ? "right" : "left"}
                          width={40}
                          domain={[0, 1]}
                          tickFormatter={(v: number) => formatPercent(v, 0)}
                          {...axis}
                        />
                        <Tooltip
                          labelFormatter={(d) => formatShortDate(String(d), locale)}
                          formatter={(v, name) => [
                            formatPercent(Number(v), 0),
                            name === "resolutionRate" ? t("resolution") : t("handoff"),
                          ]}
                          contentStyle={{
                            borderRadius: 8,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--popover))",
                            direction: dir,
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="resolutionRate"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="handoffRate"
                          stroke="hsl(var(--warning))"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
