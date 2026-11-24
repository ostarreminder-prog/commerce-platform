"use client";

import * as React from "react";
import { Check, CircleDashed, Loader2, Play, X } from "lucide-react";
import type { CopilotResponse, PlannedStep } from "../types";
import { Button } from "@repo/ui/components/button";
import { Progress } from "@repo/ui/components/progress";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { useCopilotView } from "./view-context";

type PlanResponse = Extract<CopilotResponse, { kind: "plan" }>;

function StepIcon({ status }: { status: PlannedStep["status"] }) {
  if (status === "done") return <Check className="text-success size-4" aria-hidden />;
  if (status === "failed") return <X className="text-destructive size-4" aria-hidden />;
  if (status === "running") return <Loader2 className="text-primary size-4 animate-spin" aria-hidden />;
  return <CircleDashed className="text-muted-foreground size-4" aria-hidden />;
}

/** Multi-step plan card — runs each step through executeStep with live progress. */
export function PlanCard({ messageId, response }: { messageId: string; response: PlanResponse }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const copilot = useCopilotView();
  const [steps, setSteps] = React.useState<PlannedStep[]>(response.steps);
  const [running, setRunning] = React.useState(false);
  const handled = copilot.isDone(messageId);

  const doneCount = steps.filter((s) => s.status === "done").length;
  const failedCount = steps.filter((s) => s.status === "failed").length;
  const finished = steps.every((s) => s.status === "done" || s.status === "failed");

  const update = (next: PlannedStep) =>
    setSteps((list) => list.map((s) => (s.id === next.id ? next : s)));

  const runOne = async (planned: PlannedStep) => {
    update({ ...planned, status: "running" });
    update(await copilot.runStep(planned));
  };

  const runAll = async () => {
    setRunning(true);
    try {
      for (const planned of steps) {
        if (planned.status === "done") continue;
        update({ ...planned, status: "running" });
        update(await copilot.runStep(planned));
      }
      copilot.markDone(messageId);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-card space-y-2 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">{response.title}</p>
        <span className="num text-muted-foreground text-xs">
          {doneCount}/{steps.length}
        </span>
      </div>
      {running || doneCount || failedCount ? (
        <Progress value={(100 * (doneCount + failedCount)) / steps.length} aria-label={response.title} />
      ) : null}
      <ol className="space-y-1.5">
        {steps.map((planned, i) => (
          <li key={planned.id} className="flex items-start gap-2 text-xs">
            <StepIcon status={planned.status} />
            <div className="min-w-0 flex-1">
              <p className={cn(planned.status === "pending" && "text-muted-foreground")}>
                <span className="num">{i + 1}.</span> {planned.title}
              </p>
              {planned.status === "failed" && planned.error ? (
                <p className="text-destructive mt-0.5">{t("copilot.stepFailed", { reason: planned.error })}</p>
              ) : null}
            </div>
            {!handled && !running && planned.status !== "done" ? (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => void runOne(planned)}>
                {t("copilot.runStep")}
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
      {finished ? (
        <p className="text-muted-foreground text-xs font-medium">
          {failedCount
            ? t("copilot.planSummaryFailed", { done: doneCount, total: steps.length, failed: failedCount })
            : t("copilot.planSummary", { done: doneCount, total: steps.length })}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1.5" disabled={running} onClick={() => void runAll()}>
            <Play className="size-3.5" aria-hidden />
            {t("copilot.runAll")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            disabled={running}
            onClick={() => copilot.markDone(messageId)}
          >
            {t("copilot.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}
