"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSavePartnerApp } from "@repo/api-client";
import type { PartnerApp } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { AppLoader } from "./app-loader";

function ListingForm({ app }: { app: PartnerApp }) {
  const t = useTranslations();
  const save = useSavePartnerApp();
  const [description, setDescription] = React.useState(app.description ?? { ar: "", en: "" });
  const [supportEmail, setSupportEmail] = React.useState(app.supportEmail ?? "");
  const [privacyUrl, setPrivacyUrl] = React.useState(app.privacyUrl ?? "");
  const valid = supportEmail === "" || supportEmail.includes("@");

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-5 p-5 sm:p-6">
          <p className="text-muted-foreground text-sm">{t("detail.listingHint")}</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="descAr">{t("detail.descAr")}</Label>
              <Textarea id="descAr" dir="rtl" rows={4} value={description.ar} onChange={(e) => setDescription((d) => ({ ...d, ar: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descEn">{t("detail.descEn")}</Label>
              <Textarea id="descEn" dir="ltr" rows={4} value={description.en} onChange={(e) => setDescription((d) => ({ ...d, en: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="support">{t("detail.supportEmail")}</Label>
              <Input id="support" type="email" dir="ltr" placeholder="support@example.sa" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="privacy">{t("detail.privacyUrl")}</Label>
              <Input id="privacy" dir="ltr" placeholder="https://" value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button
          disabled={!valid}
          loading={save.isPending}
          onClick={() =>
            save.mutate(
              { ...app, description, supportEmail, privacyUrl, updatedAt: new Date().toISOString() },
              { onSuccess: () => toast.success(t("common.saved")) },
            )
          }
        >
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

export function ListingTab({ id }: { id: string }) {
  return <AppLoader id={id}>{(app) => <ListingForm app={app} />}</AppLoader>;
}
