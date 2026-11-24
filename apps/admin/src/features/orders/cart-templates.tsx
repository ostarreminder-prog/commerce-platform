"use client";

import * as React from "react";
import { Eye, MessageSquare, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeleteRecoveryTemplate, useRecoveryTemplates, useSaveRecoveryTemplate } from "@repo/api-client";
import type { RecoveryTemplate } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useCan } from "@/lib/permissions";

const CHANNELS = ["whatsapp", "sms", "email"] as const;

/** Recovery message templates (§5.6): list, preview, add/edit, enable/disable,
 * delete. Picked from the per-cart send dialog. */
export function RecoveryTemplatesCard() {
  const t = useTranslations("sales.carts.templates");
  const tc = useTranslations("sales.carts");
  const { locale } = useAppLocale();
  const canManage = useCan("marketing.manage");
  const templates = useRecoveryTemplates();
  const del = useDeleteRecoveryTemplate();
  const [dialog, setDialog] = React.useState<RecoveryTemplate | "new" | null>(null);
  const [preview, setPreview] = React.useState<RecoveryTemplate | null>(null);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        {canManage ? <Button size="sm" variant="outline" onClick={() => setDialog("new")}><Plus aria-hidden />{t("new")}</Button> : null}
      </CardHeader>
      <CardContent>
        {templates.isPending ? null : !(templates.data ?? []).length ? (
          <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">{t("empty")}</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {(templates.data ?? []).map((tpl) => (
              <li key={tpl.id} className="flex items-center gap-3 p-3 text-sm">
                <MessageSquare className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{tpl.name[locale] ?? tpl.name.ar}</p>
                  <p className="text-muted-foreground line-clamp-1 text-xs" dir="auto">{tpl.content[locale] ?? tpl.content.ar}</p>
                </div>
                <Badge variant="outline">{tc(`channels.${tpl.channel}`)}</Badge>
                {!tpl.enabled ? <Badge variant="secondary">{t("disabled")}</Badge> : null}
                <Button size="icon" variant="ghost" className="size-8" aria-label={t("preview")} onClick={() => setPreview(tpl)}><Eye aria-hidden /></Button>
                {canManage ? (
                  <>
                    <Button size="icon" variant="ghost" className="size-8" aria-label={t("edit")} onClick={() => setDialog(tpl)}><Pencil aria-hidden /></Button>
                    <Button
                      size="icon" variant="ghost" className="text-destructive size-8" aria-label={t("delete")}
                      disabled={del.isPending}
                      onClick={() => del.mutate([tpl.id], { onSuccess: () => toast.success(t("deleted")), onError: () => toast.error(t("saveFailed")) })}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      {dialog ? <TemplateDialog template={dialog === "new" ? null : dialog} open onOpenChange={(o) => !o && setDialog(null)} /> : null}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{preview?.name[locale] ?? preview?.name.ar}</DialogTitle><DialogDescription>{preview ? tc(`channels.${preview.channel}`) : null}</DialogDescription></DialogHeader>
          <div className="bg-muted/50 space-y-3 rounded-md p-4 text-sm" dir="auto">
            <p className="whitespace-pre-wrap">{preview?.content.ar}</p>
            {preview?.content.en ? <p className="text-muted-foreground whitespace-pre-wrap border-t pt-3" dir="ltr">{preview.content.en}</p> : null}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function TemplateDialog({ template, open, onOpenChange }: { template: RecoveryTemplate | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sales.carts.templates");
  const tc = useTranslations("common");
  const save = useSaveRecoveryTemplate();
  const [nameAr, setNameAr] = React.useState(template?.name.ar ?? "");
  const [nameEn, setNameEn] = React.useState(template?.name.en ?? "");
  const [channel, setChannel] = React.useState<RecoveryTemplate["channel"]>(template?.channel ?? "whatsapp");
  const [contentAr, setContentAr] = React.useState(template?.content.ar ?? "");
  const [contentEn, setContentEn] = React.useState(template?.content.en ?? "");
  const [enabled, setEnabled] = React.useState(template?.enabled ?? true);
  const [submitted, setSubmitted] = React.useState(false);
  const valid = nameAr.trim() && contentAr.trim();
  const submit = () => {
    setSubmitted(true);
    if (!valid) return;
    save.mutate(
      [{ id: template?.id ?? "", name: { ar: nameAr.trim(), en: nameEn.trim() || undefined }, channel, content: { ar: contentAr.trim(), en: contentEn.trim() || undefined }, enabled }],
      { onSuccess: () => { toast.success(t("saved")); onOpenChange(false); }, onError: () => toast.error(t("saveFailed")) },
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>{t("vars")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name-ar">{t("nameAr")} *</Label>
            <Input id="tpl-name-ar" value={nameAr} onChange={(e) => setNameAr(e.target.value)} aria-invalid={submitted && !nameAr.trim()} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-name-en">{t("nameEn")}</Label>
            <Input id="tpl-name-en" dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("channel")}</Label>
            <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CHANNELS.map((c) => <SelectItem key={c} value={c}>{t(`channels.${c}`)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3 self-end rounded-md border p-3">
            <Label htmlFor="tpl-enabled" className="font-normal">{t("enabled")}</Label>
            <Switch id="tpl-enabled" checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tpl-content-ar">{t("contentAr")} *</Label>
            <Textarea id="tpl-content-ar" rows={3} value={contentAr} onChange={(e) => setContentAr(e.target.value)} aria-invalid={submitted && !contentAr.trim()} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="tpl-content-en">{t("contentEn")}</Label>
            <Textarea id="tpl-content-en" rows={3} dir="ltr" value={contentEn} onChange={(e) => setContentEn(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button disabled={save.isPending} onClick={submit}>{t("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
