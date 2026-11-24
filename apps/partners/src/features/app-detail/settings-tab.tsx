"use client";

import * as React from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSavePartnerApp } from "@repo/api-client";
import type { PartnerApp } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { CATEGORIES } from "../apps/app-editor-constants";
import { CopyField } from "../apps/copy-field";
import { AppLoader } from "./app-loader";

function SettingsForm({ app }: { app: PartnerApp }) {
  const t = useTranslations();
  const save = useSavePartnerApp();
  const [draft, setDraft] = React.useState(app);
  const [price, setPrice] = React.useState(String(app.monthlyPrice / 100));
  const [secret, setSecret] = React.useState(`sk_live_${app.clientId.slice(3)}9f2c4ab71e0d`);
  const set = <K extends keyof PartnerApp>(k: K, v: PartnerApp[K]) => setDraft((a) => ({ ...a, [k]: v }));

  const valid =
    draft.name.ar.trim() !== "" &&
    (draft.name.en ?? "").trim() !== "" &&
    (draft.redirectUrl === "" || draft.redirectUrl.startsWith("https://"));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div className="space-y-1.5">
            <Label htmlFor="nameAr">{t("editor.nameAr")}</Label>
            <Input id="nameAr" dir="rtl" value={draft.name.ar} onChange={(e) => set("name", { ...draft.name, ar: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nameEn">{t("editor.nameEn")}</Label>
            <Input id="nameEn" dir="ltr" value={draft.name.en} onChange={(e) => set("name", { ...draft.name, en: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagAr">{t("editor.taglineAr")}</Label>
            <Input id="tagAr" dir="rtl" value={draft.tagline.ar} onChange={(e) => set("tagline", { ...draft.tagline, ar: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagEn">{t("editor.taglineEn")}</Label>
            <Input id="tagEn" dir="ltr" value={draft.tagline.en} onChange={(e) => set("tagline", { ...draft.tagline, en: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">{t("editor.category")}</Label>
            <Select value={draft.category} onValueChange={(v) => set("category", v as PartnerApp["category"])}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">{t("editor.price")}</Label>
            <Input id="price" type="number" min={0} step="0.01" dir="ltr" className="num" value={price} onChange={(e) => setPrice(e.target.value)} />
            <p className="text-muted-foreground text-xs">{t("editor.priceHint")}</p>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="redirect">{t("editor.redirect")}</Label>
            <Input id="redirect" dir="ltr" placeholder="https://" value={draft.redirectUrl} onChange={(e) => set("redirectUrl", e.target.value)} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("editor.tabs.credentials")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <CopyField id="clientId" label={t("editor.clientId")} value={draft.clientId} />
          <CopyField id="secret" label={t("editor.clientSecret")} value={secret} secret />
          <Alert variant="destructive">
            <ShieldAlert aria-hidden />
            <AlertDescription>{t("editor.secretWarning")}</AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              setSecret(`sk_live_${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2, 8)}`);
              toast.success(t("editor.regenerated"));
            }}
          >
            <RefreshCw aria-hidden />
            {t("editor.regenerate")}
          </Button>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button
          disabled={!valid}
          loading={save.isPending}
          onClick={() =>
            save.mutate(
              { ...draft, monthlyPrice: Math.max(0, Math.round(Number(price) * 100) || 0), updatedAt: new Date().toISOString() },
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

export function SettingsTab({ id }: { id: string }) {
  return <AppLoader id={id}>{(app) => <SettingsForm app={app} />}</AppLoader>;
}
