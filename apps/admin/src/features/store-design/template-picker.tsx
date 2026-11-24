"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ThemeTemplate } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import type { EditorController } from "./use-editor-state";

const BASE_TEMPLATES: ThemeTemplate[] = ["home", "product", "category", "cart", "page"];

type T = (key: string) => string;

/** Base 5 templates + merchant custom templates (create/delete — only customs deletable). */
export function TemplatePicker({ editor }: { editor: EditorController }) {
  const strictT = useMsg();
  const t = strictT as unknown as T;
  const { locale } = useAppLocale();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const customs = editor.draft.customTemplates ?? [];

  const create = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    editor.addCustomTemplate(trimmed, trimmed);
    setName("");
    setCreateOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="bg-muted grid grid-cols-2 gap-1 rounded-md p-1">
        {BASE_TEMPLATES.map((tpl) => (
          <button
            key={tpl}
            type="button"
            aria-pressed={editor.selectedTemplate === tpl}
            onClick={() => editor.selectTemplate(tpl)}
            className={cn(
              "rounded px-2 py-1.5 text-xs font-medium",
              editor.selectedTemplate === tpl ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            {t(`editor.template.${tpl}`)}
          </button>
        ))}
      </div>
      {customs.map((ct) => (
        <div key={ct.id} className="group flex items-center gap-1">
          <button
            type="button"
            aria-pressed={editor.selectedTemplate === ct.id}
            onClick={() => editor.selectTemplate(ct.id)}
            className={cn(
              "flex-1 rounded-md border px-2 py-1.5 text-start text-xs font-medium",
              editor.selectedTemplate === ct.id ? "border-primary bg-accent" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {locale === "ar" ? ct.nameAr || ct.nameEn : ct.nameEn || ct.nameAr}
          </button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive shrink-0"
            aria-label={t("editor.delete")}
            onClick={() => setDeleteTarget(ct.id)}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      ))}
      <Button variant="ghost" size="sm" className="text-muted-foreground w-full justify-start" onClick={() => setCreateOpen(true)}>
        <Plus aria-hidden />
        {t("editor.template.add")}
      </Button>
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editor.template.add")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name">{t("editor.template.name")}</Label>
            <Input id="tpl-name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} />
          </div>
          <DialogFooter>
            <Button onClick={create} disabled={!name.trim()}>
              {t("editor.template.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        titleKey="editor.template.deleteTitle"
        bodyKey="editor.template.deleteBody"
        confirmKey="editor.delete"
        danger
        onConfirm={() => {
          if (deleteTarget) editor.removeCustomTemplate(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
