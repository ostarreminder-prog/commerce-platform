"use client";

import * as React from "react";
import { AlertTriangle, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useLiveSessions } from "@repo/api-client";
import type { TranscriptLine } from "@repo/contracts";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard } from "@repo/ui/components/stat-card";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/cn";
import { channelIcons } from "../agent-meta";
import { StudioHeader } from "../studio-header";
import { indexAgents } from "../tree";
import { Detail } from "./live-detail";
import { needsAttention, SessionCard, type View } from "./live-session-card";

type Filter = "all" | "voice" | "whatsapp" | "attention";

function useTicker() {
  const [elapsed, setElapsed] = React.useState(0);
  React.useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  return elapsed;
}

export function LiveMonitor() {
  const t = useTranslations("studio.live");
  const sessions = useLiveSessions();
  const agents = useAgents();
  const elapsed = useTicker();
  const index = React.useMemo(() => indexAgents(agents.data ?? []), [agents.data]);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [selected, setSelected] = React.useState<string | null>(null);
  const [mobileDetail, setMobileDetail] = React.useState(false);
  const [revealed, setRevealed] = React.useState<Record<string, number>>({});
  const [staff, setStaff] = React.useState<Record<string, TranscriptLine[]>>({});
  const [released, setReleased] = React.useState<Set<string>>(new Set());
  const [newIds, setNewIds] = React.useState<Set<string>>(new Set());
  const views: View[] = React.useMemo(
    () =>
      (sessions.data ?? []).map((s) => {
        const takenOver = s.takenOver && !released.has(s.id);
        const extra = s.upcoming.slice(0, revealed[s.id] ?? 0);
        const duration = s.durationSec + elapsed;
        const lines = [...s.transcript, ...extra, ...(staff[s.id] ?? [])].sort(
          (a, b) => a.atSec - b.atSec,
        );
        const path = [...s.agentPath];
        for (const l of extra) if (l.agentId && !path.includes(l.agentId)) path.push(l.agentId);
        return { session: s, lines, path, takenOver, duration };
      }),
    [sessions.data, revealed, staff, released, elapsed],
  ); // Stream the scripted lines into sessions still run by agents.
  const data = sessions.data;
  React.useEffect(() => {
    if (!data) return;
    const timer = setInterval(() => {
      setRevealed((r) => {
        const open = data.filter(
          (s) => !(s.takenOver && !released.has(s.id)) && (r[s.id] ?? 0) < s.upcoming.length,
        );
        const pick = open[Math.floor(Math.random() * open.length)];
        if (!pick) return r;
        const n = (r[pick.id] ?? 0) + 1;
        const line = pick.upcoming[n - 1];
        if (line) setNewIds(new Set([line.id]));
        return { ...r, [pick.id]: n };
      });
    }, 3200);
    return () => clearInterval(timer);
  }, [data, released]);
  const visible = views
    .filter((v) =>
      filter === "all"
        ? true
        : filter === "attention"
          ? needsAttention(v.session)
          : v.session.channel === filter,
    )
    .sort((a, b) => Number(needsAttention(b.session)) - Number(needsAttention(a.session)));
  const current = views.find((v) => v.session.id === selected) ?? visible[0];
  const attention = views.filter((v) => needsAttention(v.session)).length;
  const send = (v: View, text: string) => {
    const line: TranscriptLine = {
      id: `staff_${Date.now()}`,
      speaker: "staff",
      text,
      atSec: v.duration,
    };
    setStaff((m) => ({ ...m, [v.session.id]: [...(m[v.session.id] ?? []), line] }));
    setNewIds(new Set([line.id]));
  };
  return (
    <div className="space-y-6">
      
      <StudioHeader />
      <DataState
        state={sessions}
        isEmpty={(d) => d.length === 0}
        loading={
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              
              <Skeleton className="h-[680px] rounded-xl" />
              <Skeleton className="h-[680px] rounded-xl" />
            </div>
          </div>
        }
        empty={<EmptyState icon={Radio} title={t("emptyTitle")} description={t("emptyBody")} />}
      >
        
        {() => (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              
              <StatCard label={t("kpi.active")} value={String(views.length)} icon={Radio} />
              <StatCard
                label={t("kpi.calls")}
                value={String(views.filter((v) => v.session.channel === "voice").length)}
                icon={channelIcons.voice}
              />
              <StatCard
                label={t("kpi.whatsapp")}
                value={String(views.filter((v) => v.session.channel === "whatsapp").length)}
                icon={channelIcons.whatsapp}
              />
              <StatCard
                label={t("kpi.attention")}
                value={String(attention)}
                icon={AlertTriangle}
                className={attention ? "border-destructive/40" : undefined}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              
              <div className={cn("space-y-3", mobileDetail && "hidden lg:block")}>
                
                <Tabs value={filter} onValueChange={(f) => setFilter(f as Filter)}>
                  
                  <TabsList className="w-full">
                    
                    {(["all", "voice", "whatsapp", "attention"] as const).map((f) => (
                      <TabsTrigger key={f} value={f} className="flex-1">
                        
                        {t(`filters.${f}`)}
                        {f === "attention" && attention ? (
                          <span className="bg-destructive text-destructive-foreground num rounded-full px-1.5 text-[10px]">
                            {attention}
                          </span>
                        ) : null}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                <div className="space-y-2 lg:max-h-[628px] lg:overflow-y-auto">
                  
                  {visible.length ? (
                    visible.map((v) => (
                      <SessionCard
                        key={v.session.id}
                        v={v}
                        index={index}
                        active={current?.session.id === v.session.id}
                        onClick={() => {
                          setSelected(v.session.id);
                          setMobileDetail(true);
                        }}
                      />
                    ))
                  ) : (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
                      {t("noneInFilter")}
                    </p>
                  )}
                </div>
              </div>
              <div className={cn(!mobileDetail && "hidden lg:block")}>
                
                {current ? (
                  <Detail
                    v={current}
                    index={index}
                    newIds={newIds}
                    onBack={() => setMobileDetail(false)}
                    onSend={(text) => send(current, text)}
                    onRelease={() => setReleased((r) => new Set(r).add(current.session.id))}
                  />
                ) : null}
              </div>
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}
