"use client";

import * as React from "react";
import Link from "@/components/store-link";
import { ArrowRight, Bot, FileText, Sparkles, Ticket, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useSessionRecord } from "@repo/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney } from "@repo/ui/lib/format";
import { channelIcons } from "../agent-meta";
import { AgentPath } from "../lab/agent-path";
import { indexAgents } from "../tree";
import { clock, OutcomeBadge, Rating, TranscriptBubbles } from "./shared";
import { Player } from "./session-player";

export function SessionDetail({ id }: { id: string }) {
  const td = useTranslations("studio.history.detail");
  const tc = useTranslations("studio.channel");
  const tt = useTranslations("studio.detail.tools.names");
  const { locale } = useAppLocale();
  const record = useSessionRecord(id);
  const agents = useAgents();
  const index = React.useMemo(() => indexAgents(agents.data ?? []), [agents.data]);
  return (
    <div className="space-y-6">
      <Link
        href="/agents/history"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowRight className="size-4 ltr:rotate-180" aria-hidden /> {td("back")}
      </Link>
      <DataState
        state={record}
        loading={
          <div className="space-y-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <Skeleton className="h-[560px] rounded-xl" />
              <Skeleton className="h-[560px] rounded-xl" />
            </div>
          </div>
        }
        error={(retry) =>
          String(record.error).includes("not found") ? (
            <EmptyState
              icon={FileText}
              title={td("notFoundTitle")}
              description={td("notFoundBody")}
            />
          ) : (
            <ErrorState title={td("errorTitle")} onRetry={retry} />
          )
        }
      >
        {(s) => {
          const Icon = channelIcons[s.channel];
          return (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-muted flex size-12 items-center justify-center rounded-2xl">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold">{s.customerName}</h1>
                    <OutcomeBadge outcome={s.outcome} /> <Rating value={s.rating} />
                  </div>
                  <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span>{tc(s.channel)}</span>
                    <span className="num" dir="ltr">
                      {s.customerPhone}
                    </span>
                    <span>{formatDateTime(s.startedAt, locale)}</span>
                    <span className="num">{td("duration", { time: clock(s.durationSec) })}</span>
                    <span>{td("cost", { value: formatMoney(s.cost, locale) })}</span>
                    <span className="num text-muted-foreground/70">#{s.id}</span>
                  </p>
                </div>
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div>
                  {s.channel === "voice" ? (
                    <Player record={s} index={index} />
                  ) : (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {td("messages", { count: s.transcript.length })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="max-h-[640px] overflow-y-auto">
                        <TranscriptBubbles lines={s.transcript} index={index} />
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div className="space-y-4">
                  <Card className="border-primary/30 bg-primary/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Sparkles className="text-primary size-4" aria-hidden />
                        {td("summary")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm leading-relaxed">{s.summary}</CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Bot className="size-4" aria-hidden /> {td("path")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AgentPath path={s.agentPath} index={index} animate={false} size="sm" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Wrench className="size-4" aria-hidden /> {td("actions")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {s.actions.length ? (
                        <ul className="space-y-2">
                          {s.actions.map((a, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              <span className="bg-warning/10 text-warning flex size-7 items-center justify-center rounded-full">
                                <Wrench className="size-3.5" aria-hidden />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">{tt(a.toolId)}</span>
                                <span
                                  className="text-muted-foreground block truncate text-xs"
                                  dir="auto"
                                >
                                  {a.label} · {a.result}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-sm">{td("noActions")}</p>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Ticket className="size-4" aria-hidden /> {td("ticket")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {s.ticketId ? (
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <span className="num font-mono font-semibold">{s.ticketId}</span>
                          <span className="bg-info/10 text-info rounded-full px-2 py-0.5 text-xs font-medium">
                            {td("ticketOpen")}
                          </span>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">{td("noTicket")}</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
