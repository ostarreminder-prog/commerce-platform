"use client";

import * as React from "react";
import { RefreshCw, Send, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PartnerApp } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { TabsContent } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toaster";
import { CATEGORIES, EVENTS, RESOURCES } from "./app-editor-constants";
import { CopyField } from "./copy-field";

export type SetField = <K extends keyof PartnerApp>(key: K, value: PartnerApp[K]) => void;

function FieldError({ errors, k }: { errors: Record<string, string>; k: string }) {
  return errors[k] ? (
    <p className="text-destructive text-xs" role="alert">
      {errors[k]}
    </p>
  ) : null;
}

export function ListingTab({
  app,
  price,
  errors,
  set,
  onPriceChange,
}: {
  app: PartnerApp;
  price: string;
  errors: Record<string, string>;
  set: SetField;
  onPriceChange: (value: string) => void;
}) {
  const t = useTranslations();
  return (
    <TabsContent value="listing" className="mt-0 grid gap-5 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor="nameAr">{t("editor.nameAr")}</Label>
        <Input id="nameAr" dir="rtl" value={app.name.ar} aria-invalid={Boolean(errors.nameAr)} onChange={(e) => set("name", { ...app.name, ar: e.target.value })} />
        <FieldError errors={errors} k="nameAr" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nameEn">{t("editor.nameEn")}</Label>
        <Input id="nameEn" dir="ltr" value={app.name.en} aria-invalid={Boolean(errors.nameEn)} onChange={(e) => set("name", { ...app.name, en: e.target.value })} />
        <FieldError errors={errors} k="nameEn" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tagAr">{t("editor.taglineAr")}</Label>
        <Input id="tagAr" dir="rtl" value={app.tagline.ar} onChange={(e) => set("tagline", { ...app.tagline, ar: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tagEn">{t("editor.taglineEn")}</Label>
        <Input id="tagEn" dir="ltr" value={app.tagline.en} onChange={(e) => set("tagline", { ...app.tagline, en: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">{t("editor.category")}</Label>
        <Select value={app.category} onValueChange={(v) => set("category", v as PartnerApp["category"])}>
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
        <Input id="price" type="number" min={0} step="0.01" dir="ltr" className="num" value={price} onChange={(e) => onPriceChange(e.target.value)} />
        <p className="text-muted-foreground text-xs">{t("editor.priceHint")}</p>
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="redirect">{t("editor.redirect")}</Label>
        <Input id="redirect" dir="ltr" placeholder="https://" value={app.redirectUrl} aria-invalid={Boolean(errors.redirect)} onChange={(e) => set("redirectUrl", e.target.value)} />
        <FieldError errors={errors} k="redirect" />
      </div>
    </TabsContent>
  );
}

export function CredentialsTab({ clientId, secret, setSecret }: { clientId: string; secret: string; setSecret: (value: string) => void }) {
  const t = useTranslations();
  return (
    <TabsContent value="credentials" className="mt-0 space-y-5">
      <CopyField id="clientId" label={t("editor.clientId")} value={clientId} />
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
    </TabsContent>
  );
}

export function ScopesTab({ scopes, onToggle }: { scopes: string[]; onToggle: (scope: string, on: boolean) => void }) {
  const t = useTranslations();
  return (
    <TabsContent value="scopes" className="mt-0 space-y-4">
      <p className="text-muted-foreground text-sm">{t("editor.scopesText")}</p>
      <ul className="divide-y rounded-lg border">
        {RESOURCES.map((r) => (
          <li key={r} className="flex items-center gap-4 px-4 py-3 text-sm">
            <span className="flex-1 font-medium">{t(`editor.resources.${r}`)}</span>
            {(["read", "write"] as const).map((m) => {
              const scope = `${r}:${m}`;
              return (
                <label key={m} className="flex cursor-pointer items-center gap-2">
                  <Checkbox checked={scopes.includes(scope)} onCheckedChange={(v) => onToggle(scope, v === true)} />
                  {t(`editor.${m}`)}
                </label>
              );
            })}
          </li>
        ))}
      </ul>
    </TabsContent>
  );
}

export function WebhooksTab({
  webhookUrl,
  errors,
  events,
  set,
  setEvents,
}: {
  webhookUrl: string;
  errors: Record<string, string>;
  events: string[];
  set: SetField;
  setEvents: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const t = useTranslations();
  return (
    <TabsContent value="webhooks" className="mt-0 space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="webhook">{t("editor.webhookUrl")}</Label>
        <div className="flex gap-2">
          <Input id="webhook" dir="ltr" placeholder="https://" value={webhookUrl} aria-invalid={Boolean(errors.webhook)} onChange={(e) => set("webhookUrl", e.target.value)} />
          <Button variant="outline" disabled={!webhookUrl.startsWith("https://")} onClick={() => toast.success(t("editor.testSent"))}>
            <Send aria-hidden />
            <span className="hidden sm:inline">{t("editor.sendTest")}</span>
          </Button>
        </div>
        <FieldError errors={errors} k="webhook" />
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">{t("editor.events")}</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {EVENTS.map((ev) => (
            <label key={ev} className="hover:bg-muted/40 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2">
              <Checkbox checked={events.includes(ev)} onCheckedChange={(v) => setEvents((s) => (v === true ? [...s, ev] : s.filter((x) => x !== ev)))} />
              <code className="font-mono text-xs" dir="ltr">
                {ev}
              </code>
            </label>
          ))}
        </div>
      </fieldset>
    </TabsContent>
  );
}
