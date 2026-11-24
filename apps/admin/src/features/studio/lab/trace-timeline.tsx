"use client";

import { ArrowLeftRight, Inbox, MessageSquareText, Route, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SimulatedTurn, TraceStep } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import type { TreeIndex } from "../tree";
import { AgentPath } from "./agent-path";

const icons: Record<TraceStep["kind"], typeof Inbox> = {
  received: Inbox,
  handoff: ArrowLeftRight,
  tool: Wrench,
  reply: MessageSquareText,
};
const tones: Record<TraceStep["kind"], string> = {
  received: "bg-muted text-muted-foreground",
  handoff: "bg-info/10 text-info",
  tool: "bg-warning/10 text-warning",
  reply: "bg-success/10 text-success",
};

export function TraceTimeline({
  turn,
  index,
  expected,
}: {
  turn: SimulatedTurn | null;
  index: TreeIndex;
  expected?: string | null;
}) {
  const t = useTranslations("studio.lab.trace");
  const tt = useTranslations("studio.detail.tools.names");
  const { locale } = useAppLocale();
  const name = (id?: string) => (id ? (index.byId.get(id)?.name ?? id) : "");
  if (!turn) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="bg-muted flex size-12 items-center justify-center rounded-2xl">
          <Route className="size-6" aria-hidden />
        </span>
        <p className="text-foreground font-medium">{t("emptyTitle")}</p>
        <p className="text-sm">{t("emptyBody")}</p>
      </div>
    );
  }
  const total = turn.steps.at(-1)?.atMs ?? 0;
  const cost = turn.steps.reduce((s, x) => s + x.cost, 0);
  const reached = expected ? turn.path.at(-1) === expected : null;
  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-xs font-medium">{t("path")}</p>
        <AgentPath
          key={turn.steps.map((s) => s.id).join() + turn.reply}
          path={turn.path}
          index={index}
          highlight={expected}
        />
        {reached !== null ? (
          <p className={cn("text-xs font-medium", reached ? "text-success" : "text-destructive")}>
            {reached
              ? t("reached", { name: name(expected ?? "") })
              : t("missed", { name: name(expected ?? "") })}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          [t("hops"), String(turn.path.length - 1)],
          [t("time"), `${(total / 1000).toFixed(1)}s`],
          [t("cost"), formatMoney(cost, locale)],
        ].map(([label, value]) => (
          <div key={label} className="bg-muted/50 rounded-lg p-2">
            <p className="text-muted-foreground text-[11px]">{label}</p>
            <p className="num text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <ol className="relative space-y-3">
        {turn.steps.map((s, i) => {
          const Icon = icons[s.kind];
          return (
            <li
              key={s.id}
              className="animate-in fade-in slide-in-from-top-1 fill-mode-both relative flex gap-3"
              style={{ animationDelay: `${i * 160}ms` }}
            >
              {i < turn.steps.length - 1 ? (
                <span
                  className="bg-border absolute start-4 top-9 h-[calc(100%-1.5rem)] w-px"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full",
                  tones[s.kind],
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">
                    {s.kind === "received" && t("received", { name: name(s.agentId) })}
                    {s.kind === "handoff" &&
                      (s.targetId
                        ? t("handoff", { from: name(s.agentId), to: name(s.targetId) })
                        : t("handoffHuman", { from: name(s.agentId) }))}
                    {s.kind === "tool" &&
                      t("tool", { name: name(s.agentId), tool: s.toolId ? tt(s.toolId) : "" })}
                    {s.kind === "reply" && t("reply", { name: name(s.agentId) })}
                  </p>
                  <span className="num text-muted-foreground shrink-0 text-[11px]">
                    +{(s.atMs / 1000).toFixed(1)}s
                  </span>
                </div>
                {s.reason ? (
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {t("why")} <span dir="auto">{s.reason}</span>
                  </p>
                ) : null}
                {s.result ? (
                  <p
                    className="bg-muted mt-1 inline-block rounded px-1.5 py-0.5 font-mono text-[11px]"
                    dir="auto"
                  >
                    {s.result}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
