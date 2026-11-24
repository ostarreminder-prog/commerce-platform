"use client";

import * as React from "react";
import { History, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useSessionHistory } from "@repo/api-client";
import type { AgentChannel, SessionRecord } from "@repo/contracts";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { CHANNELS } from "../agent-meta";
import { StudioHeader } from "../studio-header";
import { indexAgents } from "../tree";
import { HistoryKpis } from "./history-kpis";
import { SessionRows } from "./history-table";

export function SessionHistory() {
  const t = useTranslations("studio.history");
  const tc = useTranslations("studio.channel");
  const history = useSessionHistory();
  const agents = useAgents();
  const index = React.useMemo(() => indexAgents(agents.data ?? []), [agents.data]);
  const [q, setQ] = React.useState("");
  const [channel, setChannel] = React.useState<AgentChannel | "all">("all");
  const [outcome, setOutcome] = React.useState<SessionRecord["outcome"] | "all">("all");
  return (
    <div className="space-y-6">
      <StudioHeader />
      <DataState
        state={history}
        isEmpty={(d) => d.length === 0}
        loading={
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-96 rounded-xl" />
          </div>
        }
        empty={<EmptyState icon={History} title={t("emptyTitle")} description={t("emptyBody")} />}
      >
        {(all) => {
          const rows = all.filter(
            (s) =>
              (channel === "all" || s.channel === channel) &&
              (outcome === "all" || s.outcome === outcome) &&
              (!q ||
                s.customerName.includes(q) ||
                s.customerPhone.includes(q) ||
                s.summary.includes(q)),
          );
          return (
            <div className="space-y-6">
              <HistoryKpis all={all} />
              <Card>
                <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search
                      className="text-muted-foreground absolute start-3 top-1/2 size-4 -translate-y-1/2"
                      aria-hidden
                    />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder={t("search")}
                      aria-label={t("search")}
                      className="ps-9"
                    />
                  </div>
                  <Tabs value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
                    <TabsList>
                      <TabsTrigger value="all">{t("all")}</TabsTrigger>
                      {CHANNELS.map((c) => (
                        <TabsTrigger key={c} value={c}>
                          {tc(c)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                  <Select value={outcome} onValueChange={(v) => setOutcome(v as typeof outcome)}>
                    <SelectTrigger className="lg:w-44" aria-label={t("outcome")}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allOutcomes")}</SelectItem>
                      {(["resolved", "handedOff", "dropped"] as const).map((o) => (
                        <SelectItem key={o} value={o}>
                          {t(`outcomes.${o}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <SessionRows rows={rows} index={index} />
              </Card>
            </div>
          );
        }}
      </DataState>
    </div>
  );
}
