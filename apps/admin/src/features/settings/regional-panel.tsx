"use client";

import * as React from "react";
import { Globe2, Save } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSaveStoreSettings, useStoreBySlug } from "@repo/api-client";
import type { Store } from "@repo/contracts";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DataState } from "@repo/ui/components/data-state";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";

const TIMEZONES = ["Asia/Riyadh", "Asia/Jeddah", "Asia/Dubai", "Asia/Kuwait", "Asia/Bahrain", "Asia/Qatar", "UTC"] as const;
const LANGS = ["ar", "en"] as const;

/** `/settings/regional` — storefront languages, default locale, currency + timezone. */
export function RegionalPanel() {
  const t = useTranslations("settings.regional");
  const looseT = t as unknown as (key: string) => string;
  const mt = useMsgToast();
  const params = useParams<{ store: string }>();
  const store = useStoreBySlug(params.store);
  const save = useSaveStoreSettings();
  const [languages, setLanguages] = React.useState<string[]>([]);
  const [defaultLanguage, setDefaultLanguage] = React.useState<"ar" | "en">("ar");
  const [timezone, setTimezone] = React.useState("Asia/Riyadh");

  React.useEffect(() => {
    if (!store.data) return;
    setLanguages([...store.data.languages]);
    setDefaultLanguage(store.data.defaultLanguage);
    setTimezone(store.data.timezone);
    /* Hydrate once per fetch — edits stay local until saved. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.data?.id]);

  const toggle = (lang: string) =>
    setLanguages((ls) => (ls.includes(lang) ? ls.filter((x) => x !== lang) : [...ls, lang]));

  const submit = () => {
    if (!languages.length) { toast.error(t("oneRequired")); return; }
    const nextDefault = languages.includes(defaultLanguage) ? defaultLanguage : (languages[0] as "ar" | "en");
    save.mutate(
      [{ languages: languages as Store["languages"], defaultLanguage: nextDefault, timezone }],
      { onSuccess: () => mt.success("regional.saved"), onError: () => mt.error("common.save.error") },
    );
  };

  return (
    <DataState state={store} loading={<Skeleton className="h-72 w-full rounded-lg" />} isEmpty={(d) => !d}>
      {(s) => (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Globe2 className="size-4" aria-hidden /> {t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-medium">{t("languages")}</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {LANGS.map((lang) => (
                  <label
                    key={lang}
                    htmlFor={`rg-${lang}`}
                    className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm", languages.includes(lang) && "border-primary bg-primary/5")}
                  >
                    <Checkbox id={`rg-${lang}`} checked={languages.includes(lang)} onCheckedChange={() => toggle(lang)} />
                    {looseT(`langNames.${lang}`)}
                  </label>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">{t("languagesHint")}</p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rg-default">{t("defaultLanguage")}</Label>
                <Select value={defaultLanguage} onValueChange={(v) => setDefaultLanguage(v as "ar" | "en")}>
                  <SelectTrigger id="rg-default"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {languages.map((l) => <SelectItem key={l} value={l}>{looseT(`langNames.${l}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">{t("defaultLanguageHint")}</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rg-tz">{t("timezone")}</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="rg-tz"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}><bdi dir="ltr">{tz}</bdi></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium">{t("currency")}</h3>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{t("currencyName")}</p>
                  <p className="text-muted-foreground text-xs">{s?.name.ar}</p>
                </div>
                <span className="text-muted-foreground text-xs font-medium">{t("currencyBadge")}</span>
              </div>
              <Banner variant="info">{t("currencyNote")}</Banner>
            </section>

            <Button onClick={submit} disabled={save.isPending}><Save aria-hidden /> {t("save")}</Button>
          </CardContent>
        </Card>
      )}
    </DataState>
  );
}
