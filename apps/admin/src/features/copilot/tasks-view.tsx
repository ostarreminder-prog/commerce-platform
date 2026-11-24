"use client";

import * as React from "react";
import { BellRing, CalendarClock, ListTodo, Pencil, Play, Plus, Trash2 } from "lucide-react";
import {
  useCopilotTasks,
  useCreateCopilotTask,
  useDeleteCopilotTask,
  useRunCopilotTask,
  useUpdateCopilotTask,
} from "@repo/api-client";
import type { CopilotTask } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Switch } from "@repo/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useStoreSlug } from "@/lib/store-route";
import { TaskDialog, type TaskDraft } from "./task-dialog";

const pad = (n: number) => String(n).padStart(2, "0");
const scheduleLabel = (t: CopilotTask) => `${pad(t.schedule.hour)}:${pad(t.schedule.minute ?? 0)}`;

/** /copilot/tasks — scheduled automations + alert tasks the copilot maintains. */
export function CopilotTasksView() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const { locale } = useAppLocale();
  const slug = useStoreSlug();
  const mt = useMsgToast();

  const { data: tasks } = useCopilotTasks();
  const createTask = useCreateCopilotTask();
  const updateTask = useUpdateCopilotTask();
  const deleteTask = useDeleteCopilotTask();
  const runTask = useRunCopilotTask();

  const [dialog, setDialog] = React.useState<{ task: CopilotTask | null; kind: CopilotTask["kind"] } | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<CopilotTask | null>(null);

  const runNow = (task: CopilotTask) =>
    runTask.mutate([task.id], {
      onSuccess: ({ summary }) => mt.info("copilot.tasks.runResult", { result: summary }),
      onError: () => mt.error("copilot.error"),
    });

  const toggle = (task: CopilotTask, enabled: boolean) =>
    updateTask.mutate([task.id, { enabled }], { onError: () => mt.error("copilot.error") });

  const save = (draft: TaskDraft) => {
    const base = { title: draft.title, prompt: draft.prompt, schedule: { hour: draft.hour, minute: draft.minute }, threshold: draft.threshold, enabled: draft.enabled };
    if (dialog?.task) {
      updateTask.mutate([dialog.task.id, base], {
        onSuccess: () => {
          mt.success("copilot.tasks.saved");
          setDialog(null);
        },
        onError: () => mt.error("copilot.error"),
      });
    } else if (dialog) {
      createTask.mutate([{ storeId: slug, kind: dialog.kind, ...base }], {
        onSuccess: () => {
          mt.success("copilot.tasks.saved");
          setDialog(null);
        },
        onError: () => mt.error("copilot.error"),
      });
    }
  };

  const remove = (task: CopilotTask) =>
    deleteTask.mutate([task.id], {
      onSuccess: () => mt.success("copilot.tasks.deleted"),
      onError: () => mt.error("copilot.error"),
    });

  const fmtDate = (iso: string | null) => (iso ? new Intl.DateTimeFormat(locale === "en" ? "en" : "ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso)) : t("copilot.tasks.neverRun"));

  return (
    <div className="space-y-4">
      <PageHeader title={t("copilot.tasks.title")} description={t("copilot.tasks.subtitle")} />
      <div className="flex gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => setDialog({ task: null, kind: "scheduled" })}>
          <Plus className="size-3.5" aria-hidden />
          {t("copilot.tasks.newScheduled")}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setDialog({ task: null, kind: "alert" })}>
          <BellRing className="size-3.5" aria-hidden />
          {t("copilot.tasks.newAlert")}
        </Button>
      </div>
      {tasks && tasks.length === 0 ? (
        <MsgEmptyState emptyKey="copilot.tasks" icon={ListTodo} />
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("copilot.tasks.colTitle")}</TableHead>
                <TableHead>{t("copilot.tasks.colKind")}</TableHead>
                <TableHead>{t("copilot.tasks.colSchedule")}</TableHead>
                <TableHead>{t("copilot.tasks.colEnabled")}</TableHead>
                <TableHead>{t("copilot.tasks.colLastRun")}</TableHead>
                <TableHead>{t("copilot.tasks.colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(tasks ?? []).map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="max-w-64">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-muted-foreground truncate text-xs">{task.prompt}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={task.kind === "alert" ? "warning" : "secondary"} className="gap-1">
                      {task.kind === "alert" ? <BellRing className="size-3" aria-hidden /> : <CalendarClock className="size-3" aria-hidden />}
                      {t(`copilot.tasks.kind.${task.kind}`)}
                      {task.kind === "alert" && task.threshold != null ? (
                        <span className="num">({task.threshold})</span>
                      ) : null}
                    </Badge>
                  </TableCell>
                  <TableCell className="num whitespace-nowrap">{scheduleLabel(task)}</TableCell>
                  <TableCell>
                    <Switch checked={task.enabled} onCheckedChange={(v) => toggle(task, v)} aria-label={task.title} />
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-xs">{fmtDate(task.lastRunAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="size-8" aria-label={t("copilot.tasks.runNow")} disabled={runTask.isPending} onClick={() => runNow(task)}>
                        <Play className="size-3.5" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8" aria-label={t("copilot.tasks.edit")} onClick={() => setDialog({ task, kind: task.kind })}>
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive size-8" aria-label={t("copilot.tasks.delete")} onClick={() => setPendingDelete(task)}>
                        <Trash2 className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {dialog ? (
        <TaskDialog
          task={dialog.task}
          kind={dialog.kind}
          open
          onOpenChange={(v) => !v && setDialog(null)}
          onSave={save}
          busy={createTask.isPending || updateTask.isPending}
        />
      ) : null}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        titleKey="copilot.tasks.deleteTitle"
        bodyKey="copilot.tasks.deleteBody"
        confirmKey="copilot.tasks.delete"
        danger
        onConfirm={() => pendingDelete && remove(pendingDelete)}
      />
    </div>
  );
}
