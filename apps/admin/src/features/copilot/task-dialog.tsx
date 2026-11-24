"use client";

import * as React from "react";
import type { CopilotTask } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsg } from "@repo/ui/hooks/use-msg";

export interface TaskDraft {
  title: string;
  prompt: string;
  hour: number;
  minute: number;
  threshold?: number;
  enabled: boolean;
}

const emptyDraft = (kind: CopilotTask["kind"]): TaskDraft => ({ title: "", prompt: "", hour: 9, minute: 0, threshold: kind === "alert" ? 5 : undefined, enabled: true });

const toDraft = (task: CopilotTask): TaskDraft => ({
  title: task.title,
  prompt: task.prompt,
  hour: task.schedule.hour,
  minute: task.schedule.minute ?? 0,
  threshold: task.threshold,
  enabled: task.enabled,
});

/** Create/edit dialog for a copilot task — schedule fields + alert threshold. */
export function TaskDialog({
  task,
  kind,
  open,
  onOpenChange,
  onSave,
  busy,
}: {
  /** `null` → create mode. */
  task: CopilotTask | null;
  kind: CopilotTask["kind"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (draft: TaskDraft) => void;
  busy: boolean;
}) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const [draft, setDraft] = React.useState<TaskDraft>(() => (task ? toDraft(task) : emptyDraft(kind)));

  React.useEffect(() => {
    if (open) setDraft(task ? toDraft(task) : emptyDraft(kind));
  }, [open, task, kind]);

  const set = <K extends keyof TaskDraft>(key: K, value: TaskDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const num = (v: string, fallback: number) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? t("copilot.tasks.edit") : t("copilot.tasks.new")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">{t("copilot.tasks.formTitle")}</Label>
            <Input id="task-title" value={draft.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="task-prompt">{t("copilot.tasks.formPrompt")}</Label>
            <Textarea id="task-prompt" rows={3} value={draft.prompt} onChange={(e) => set("prompt", e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-hour">{t("copilot.tasks.formHour")}</Label>
              <Input
                id="task-hour"
                type="number"
                min={0}
                max={23}
                className="num w-24"
                value={draft.hour}
                onChange={(e) => set("hour", Math.min(23, Math.max(0, num(e.target.value, 0))))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task-minute">{t("copilot.tasks.formMinute")}</Label>
              <Input
                id="task-minute"
                type="number"
                min={0}
                max={59}
                className="num w-24"
                value={draft.minute}
                onChange={(e) => set("minute", Math.min(59, Math.max(0, num(e.target.value, 0))))}
              />
            </div>
            {kind === "alert" ? (
              <div className="space-y-1.5">
                <Label htmlFor="task-threshold">{t("copilot.tasks.formThreshold")}</Label>
                <Input
                  id="task-threshold"
                  type="number"
                  min={0}
                  className="num w-24"
                  value={draft.threshold ?? 5}
                  onChange={(e) => set("threshold", Math.max(0, num(e.target.value, 0)))}
                />
              </div>
            ) : null}
          </div>
          <label className="flex items-center gap-2 text-sm" htmlFor="task-enabled">
            <Checkbox id="task-enabled" checked={draft.enabled} onCheckedChange={(v) => set("enabled", v === true)} />
            {t("copilot.tasks.formEnabled")}
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("copilot.cancel")}
          </Button>
          <Button disabled={busy || !draft.title.trim() || !draft.prompt.trim()} onClick={() => onSave(draft)}>
            {t("copilot.tasks.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
