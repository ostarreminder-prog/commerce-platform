"use client";

import * as React from "react";
import { CircleAlert, Download, Pause, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeleteStore, useExportStoreData, useSuspendStore } from "@repo/api-client";
import { useCurrentStore } from "@/components/shell/store-switcher";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

/** Danger zone — export all data, suspend store, delete store (spec §5.24). */
export function DangerPanel() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data: store } = useCurrentStore();
  const exportData = useExportStoreData();
  const suspend = useSuspendStore();
  const remove = useDeleteStore();
  const [suspendOpen, setSuspendOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const storeName = store?.name[locale] ?? store?.name.ar ?? "";
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-4" aria-hidden /> {t("danger.export.title")}
          </CardTitle>
          <CardDescription>{t("danger.export.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" loading={exportData.isPending} onClick={() => exportData.mutate(undefined, { onSuccess: () => mt.info("common.export.started") })}>
            {t("danger.export.cta")}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-warning/40">
        <CardHeader>
          <CardTitle className="text-warning flex items-center gap-2 text-base">
            <Pause className="size-4" aria-hidden /> {t("danger.suspend.title")}
          </CardTitle>
          <CardDescription>{t("danger.suspend.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setSuspendOpen(true)}>
            {t("danger.suspend.cta")}
          </Button>
        </CardContent>
      </Card>
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2 text-base">
            <Trash2 className="size-4" aria-hidden /> {t("danger.delete.title")}
          </CardTitle>
          <CardDescription>{t("danger.delete.body")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <CircleAlert aria-hidden /> {t("danger.delete.cta")}
          </Button>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        titleKey="danger.pause.title"
        bodyKey="danger.pause.body"
        danger
        pending={suspend.isPending}
        onConfirm={() => suspend.mutate([], { onSuccess: () => setSuspendOpen(false) })}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        titleKey="danger.delete.title"
        bodyKey="danger.delete.body"
        params={{ store: storeName }}
        danger
        requireText={storeName}
        requireOtp
        pending={remove.isPending}
        onConfirm={() => remove.mutate([], { onSuccess: () => setDeleteOpen(false) })}
      />
    </div>
  );
}
