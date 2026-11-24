"use client";

import * as React from "react";
import { Save, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMaintenanceSettings, useSaveMaintenanceSettings } from "@repo/api-client";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";

const toInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);

/** `/settings/maintenance` — storefront maintenance toggle (local-synced demo state). */
export function MaintenancePanel() {
  const t = useTranslations("settings.maintenance");
  const mt = useMsgToast();
  const settings = useMaintenanceSettings();
  const save = useSaveMaintenanceSettings();
  const [enabled, setEnabled] = React.useState(false);
  const [messageAr, setMessageAr] = React.useState("");
  const [messageEn, setMessageEn] = React.useState("");
  const [eta, setEta] = React.useState("");

  React.useEffect(() => {
    if (!settings.data) return;
    setEnabled(settings.data.enabled);
    setMessageAr(settings.data.message.ar);
    setMessageEn(settings.data.message.en ?? "");
    setEta(toInput(settings.data.eta));
    /* Only hydrate once per fetch — edits are local until saved. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data?.enabled, settings.data?.eta]);

  const submit = () =>
    save.mutate(
      [{ enabled, message: { ar: messageAr.trim() || settings.data?.message.ar || "", en: messageEn.trim() || undefined }, eta: toIso(eta) }],
      { onSuccess: () => mt.success("maintenance.saved"), onError: () => mt.error("common.save.error") },
    );

  return (
    <div className="space-y-6">
      <DataState state={settings} loading={<Skeleton className="h-72 w-full rounded-lg" />} isEmpty={(d) => !d}>
        {(m) => (
          <>
            {m?.enabled ? <Banner variant="warning">{t("activeBanner")}</Banner> : null}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wrench className="size-4" aria-hidden /> {t("title")}
                </CardTitle>
                <CardDescription>{t("description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className={cn("flex items-center justify-between gap-4 rounded-lg border p-4", enabled && "border-warning bg-warning/10")}>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{t("toggle")}</p>
                    <p className="text-muted-foreground text-sm">{t("toggleHint")}</p>
                  </div>
                  <Switch checked={enabled} onCheckedChange={setEnabled} aria-label={t("toggle")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mnt-msg-ar">{t("messageAr")}</Label>
                  <Textarea id="mnt-msg-ar" rows={2} value={messageAr} onChange={(e) => setMessageAr(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mnt-msg-en">{t("messageEn")}</Label>
                  <Textarea id="mnt-msg-en" dir="ltr" rows={2} value={messageEn} onChange={(e) => setMessageEn(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mnt-eta">{t("eta")}</Label>
                  <Input id="mnt-eta" type="datetime-local" className="num w-60" value={eta} onChange={(e) => setEta(e.target.value)} />
                  <p className="text-muted-foreground text-xs">{t("etaHint")}</p>
                </div>
                <Banner variant="info">{t("syncNote")}</Banner>
                <Button onClick={submit} disabled={save.isPending}>
                  <Save aria-hidden /> {t("save")}
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </DataState>
    </div>
  );
}
