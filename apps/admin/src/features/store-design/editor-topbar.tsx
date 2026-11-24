"use client";

import * as React from "react";
import { CalendarClock, CheckCircle2, CircleDashed, ExternalLink, Link2, Loader2, Redo2, Sparkles, Undo2, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { formatDateTime } from "@repo/ui/lib/format";
import { AiDesignDialog } from "./ai-design-dialog";
import { PREVIEW_URL } from "./editor-messages";
import { ShareDialog } from "./share-dialog";
import { VersionsPopover } from "./versions-popover";
import type { EditorController } from "./use-editor-state";

/** ISO datetime → `datetime-local` input value (local wall time). */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Top bar: title, autosave indicator, undo/redo, versions, share, AI, schedule, preview, publish. */
export function EditorTopbar({ editor, title }: { editor: EditorController; title: string }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [scheduleOpen, setScheduleOpen] = React.useState(false);
  const scheduledAt = editor.draft.scheduledPublish?.at ?? null;
  const [scheduleValue, setScheduleValue] = React.useState(() => (scheduledAt ? toLocalInput(scheduledAt) : ""));

  const saveIndicator =
    editor.saveState === "saving" ? (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        {t("common.saving")}
      </span>
    ) : editor.saveState === "saved" ? (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <CheckCircle2 className="text-success size-3" aria-hidden />
        {t("editor.draftSaved")}
      </span>
    ) : editor.saveState === "dirty" ? (
      <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
        <CircleDashed className="size-3" aria-hidden />
        {t("common.unsavedBar")}
      </span>
    ) : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="me-auto min-w-0">
        <h1 className="truncate text-xl font-semibold">{title}</h1>
        <p className="flex items-center gap-1.5 text-xs">
          <span className="text-muted-foreground truncate">{editor.draft.name}</span>
          {saveIndicator}
          {scheduledAt ? (
            <span className="bg-warning/10 text-warning inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium">
              <CalendarClock className="size-3" aria-hidden />
              {t("editor.scheduled")}
              <span className="num">{formatDateTime(scheduledAt, locale)}</span>
              <button type="button" onClick={() => editor.schedule(null)} aria-label={t("editor.scheduleClear")} className="hover:text-foreground">
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ) : null}
        </p>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon-sm" onClick={editor.undo} disabled={!editor.canUndo} aria-label={t("editor.undo")}>
          <Undo2 aria-hidden />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={editor.redo} disabled={!editor.canRedo} aria-label={t("editor.redo")}>
          <Redo2 aria-hidden />
        </Button>
      </div>
      <VersionsPopover editor={editor} />
      <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}>
        <Link2 aria-hidden />
        {t("editor.share.button")}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setAiOpen(true)}>
        <Sparkles aria-hidden />
        {t("editor.ai.button")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => window.open(PREVIEW_URL, "_blank", "noopener,noreferrer")}
        className="max-sm:hidden"
      >
        <ExternalLink aria-hidden />
        {t("editor.openPreview")}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setScheduleOpen(true)} disabled={editor.scheduling}>
        <CalendarClock aria-hidden />
        {t("editor.schedule")}
      </Button>
      <Button size="sm" onClick={() => setPublishOpen(true)} disabled={editor.publishing}>
        {t("editor.publishAction")}
      </Button>
      <ShareDialog theme={editor.draft} open={shareOpen} onOpenChange={setShareOpen} />
      <AiDesignDialog editor={editor} open={aiOpen} onOpenChange={setAiOpen} />
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editor.schedule")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="schedule-at">{t("editor.scheduleAt")}</Label>
            <Input
              id="schedule-at"
              type="datetime-local"
              dir="ltr"
              value={scheduleValue}
              onChange={(e) => setScheduleValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!scheduleValue) return;
                editor.schedule(new Date(scheduleValue).toISOString());
                setScheduleOpen(false);
              }}
              disabled={!scheduleValue || editor.scheduling}
              loading={editor.scheduling}
            >
              {t("editor.scheduleSave")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        titleKey="editor.publish.title"
        bodyKey="editor.publish.body"
        confirmKey="editor.publishAction"
        pending={editor.publishing}
        onConfirm={() => {
          editor.publish();
          setPublishOpen(false);
        }}
      />
    </div>
  );
}
