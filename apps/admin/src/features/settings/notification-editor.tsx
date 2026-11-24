"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSaveNotificationTemplate } from "@repo/api-client";
import type { NotificationEvent, NotificationTemplate } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Textarea } from "@repo/ui/components/textarea";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

const VARIABLES = ["{customer_name}", "{order_number}", "{tracking_url}"];
const SAMPLE: Record<string, string> = { "{customer_name}": "سارة", "{order_number}": "#1042", "{tracking_url}": "https://nakhla.sa/o/1042" };

/** Template editor: bilingual content + variable chips + live preview (spec §5.24). */
export function NotificationEditor({
  open,
  onOpenChange,
  event,
  channel,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NotificationEvent;
  channel: NotificationTemplate["channel"];
  template?: NotificationTemplate;
}) {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const save = useSaveNotificationTemplate();
  const [ar, setAr] = React.useState("");
  const [en, setEn] = React.useState("");
  const [enabled, setEnabled] = React.useState(true);
  React.useEffect(() => {
    if (open) {
      setAr(template?.content.ar ?? "");
      setEn(template?.content.en ?? "");
      setEnabled(template?.enabled ?? true);
    }
  }, [open, template]);
  const preview = (locale === "ar" ? ar : en || ar).replace(/\{[a-z_]+\}/g, (m) => SAMPLE[m] ?? m);
  const isWhatsApp = channel === "whatsapp";
  const submit = (forApproval: boolean) =>
    save.mutate([{ event, channel, enabled, content: { ar, en: en || undefined }, submit: forApproval }], {
      onSuccess: () => {
        mt.success(forApproval ? "notifications.template.submitted" : "notifications.template.saved");
        onOpenChange(false);
      },
    });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("notifications.editor.title", { event: t(`notifications.events.${event}`), channel: t(`notifications.channels.${channel}`) })}</DialogTitle>
          <DialogDescription>{t("notifications.editor.hint")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs">{t("notifications.editor.variables")}:</span>
            {VARIABLES.map((v) => (
              <code key={v} dir="ltr" className="bg-muted rounded px-1.5 py-0.5 text-xs">
                {v}
              </code>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-ar">{t("notifications.editor.ar")}</Label>
            <Textarea id="tpl-ar" rows={3} value={ar} onChange={(e) => setAr(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-en">{t("notifications.editor.en")}</Label>
            <Textarea id="tpl-en" rows={3} dir="ltr" className="text-start" value={en} onChange={(e) => setEn(e.target.value)} />
          </div>
          <Label className="flex items-center gap-2.5">
            <Checkbox checked={enabled} onCheckedChange={(v) => setEnabled(v === true)} />
            <span className="text-sm font-normal">{t("notifications.editor.enabled")}</span>
          </Label>
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground mb-1 text-xs">{t("notifications.editor.preview")}</p>
            <p className="text-sm">{preview || "—"}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          {isWhatsApp ? (
            <Button variant="secondary" loading={save.isPending} disabled={!ar.trim()} onClick={() => submit(true)}>
              {t("notifications.editor.submit")}
            </Button>
          ) : null}
          <Button loading={save.isPending} disabled={!ar.trim()} onClick={() => submit(false)}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
