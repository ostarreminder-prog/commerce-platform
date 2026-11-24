"use client";

import * as React from "react";
import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Loader2,
  Play,
  Plus,
  RotateCw,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgentTests, useRunTest } from "@repo/api-client";
import type { Agent, AgentTestCase, SimulatedTurn } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Progress } from "@repo/ui/components/progress";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/cn";
import { Can } from "@/lib/permissions";
import { channelIcons } from "../agent-meta";
import type { TreeIndex } from "../tree";
import { AgentPath } from "./agent-path";
import { AddTestDialog } from "./add-test-dialog";

export { AddTestDialog } from "./add-test-dialog";
export type { TestDraft } from "./add-test-dialog";

function StatusIcon({
  result,
  running,
}: {
  result: AgentTestCase["lastResult"];
  running: boolean;
}) {
  const t = useTranslations("studio.lab.tests");
  if (running)
    return <Loader2 className="text-primary size-5 animate-spin" aria-label={t("runningOne")} />;
  if (result === "pass")
    return <CheckCircle2 className="text-success size-5" aria-label={t("pass")} />;
  if (result === "fail")
    return <XCircle className="text-destructive size-5" aria-label={t("fail")} />;
  return <CircleDashed className="text-muted-foreground size-5" aria-label={t("notRun")} />;
}

export function TestCases({
  index,
  agents,
  onOpen,
}: {
  index: TreeIndex;
  agents: Agent[];
  onOpen: (test: AgentTestCase) => void;
}) {
  const t = useTranslations("studio.lab.tests");
  const tc = useTranslations("studio.channel");
  const tests = useAgentTests();
  const run = useRunTest();
  const [running, setRunning] = React.useState<Set<string>>(new Set());
  const [batch, setBatch] = React.useState<{ done: number; total: number } | null>(null);
  const [turns, setTurns] = React.useState<Record<string, SimulatedTurn>>({});
  const [adding, setAdding] = React.useState(false);
  const runOne = async (id: string) => {
    setRunning((s) => new Set(s).add(id));
    try {
      const res = await run.mutateAsync([id]);
      setTurns((m) => ({ ...m, [id]: res.turn }));
      return res.test.lastResult;
    } finally {
      setRunning((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  };
  const runAll = async () => {
    const list = tests.data ?? [];
    let passed = 0;
    setBatch({ done: 0, total: list.length });
    for (const [i, test] of list.entries()) {
      if ((await runOne(test.id).catch(() => "fail")) === "pass") passed++;
      setBatch({ done: i + 1, total: list.length });
    }
    setTimeout(() => setBatch(null), 600);
    (passed === list.length ? toast.success : toast.error)(
      t("runDone", { pass: passed, total: list.length }),
    );
  };
  const list = tests.data ?? [];
  const pass = list.filter((x) => x.lastResult === "pass").length;
  const fail = list.filter((x) => x.lastResult === "fail").length;
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-1.5">
          <CardTitle className="text-base">{t("title")}</CardTitle>
          <CardDescription>{t("hint")}</CardDescription>
        </div>
        <div className="flex gap-2">
          <Can permission="agents.manage">
            <Button variant="outline" onClick={() => setAdding(true)}>
              <Plus aria-hidden /> {t("add")}
            </Button>
          </Can>
          <Button onClick={runAll} disabled={!list.length || batch !== null}>
            {batch ? (
              <Loader2 className="animate-spin" aria-hidden />
            ) : (
              <Play className="rtl:-scale-x-100" aria-hidden />
            )}
            {batch ? t("running", { done: batch.done, total: batch.total }) : t("runAll")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {list.length ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-success flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="size-4" aria-hidden /> {t("passed", { count: pass })}
              </span>
              <span className="text-destructive flex items-center gap-1.5 font-medium">
                <XCircle className="size-4" aria-hidden /> {t("failed", { count: fail })}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CircleDashed className="size-4" aria-hidden />
                {t("never", { count: list.length - pass - fail })}
              </span>
            </div>
            <Progress
              value={
                batch ? (batch.done / Math.max(1, batch.total)) * 100 : (pass / list.length) * 100
              }
              className="h-1.5"
            />
          </div>
        ) : null}
        <DataState
          state={tests}
          isEmpty={(d) => d.length === 0}
          loading={
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          }
          empty={
            <EmptyState icon={ClipboardList} title={t("emptyTitle")} description={t("emptyBody")} />
          }
        >
          {(items) => (
            <ul className="divide-y rounded-lg border">
              {items.map((test) => {
                const Icon = channelIcons[test.channel];
                const turn = turns[test.id];
                const isRunning = running.has(test.id);
                const agent = index.byId.get(test.expectedAgentId);
                return (
                  <li
                    key={test.id}
                    className={cn(
                      "flex gap-3 p-3 transition-colors",
                      isRunning && "bg-primary/5",
                      test.lastResult === "fail" && !isRunning && "bg-destructive/5",
                    )}
                  >
                    <div className="pt-0.5">
                      <StatusIcon result={test.lastResult} running={isRunning} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p dir="auto" className="font-medium">
                          «{test.question}»
                        </p>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground" aria-label={tc(test.channel)}>
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>{tc(test.channel)}</TooltipContent>
                        </Tooltip>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t("expectedLine", {
                          agent: agent?.name ?? "—",
                          expected: test.expected,
                        })}
                      </p>
                      {turn && !isRunning ? (
                        <div className="pt-1">
                          <AgentPath
                            path={turn.path}
                            index={index}
                            highlight={test.expectedAgentId}
                            size="sm"
                          />
                        </div>
                      ) : test.lastResult === "fail" && test.lastAnswer && !isRunning ? (
                        <p className="text-destructive text-xs">
                          {t("got", { answer: test.lastAnswer })}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onOpen(test)}
                            aria-label={t("open")}
                          >
                            <Play className="rtl:-scale-x-100" aria-hidden />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("open")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isRunning || batch !== null}
                            onClick={() => runOne(test.id)}
                            aria-label={t("run")}
                          >
                            <RotateCw aria-hidden />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{t("run")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </DataState>
      </CardContent>
      <AddTestDialog open={adding} onOpenChange={setAdding} agents={agents} initial={{}} />
    </Card>
  );
}
