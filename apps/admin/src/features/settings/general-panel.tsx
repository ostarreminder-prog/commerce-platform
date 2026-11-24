"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDomains, useSaveStoreSettings } from "@repo/api-client";
import { useCurrentStore } from "@/components/shell/store-switcher";
import Link from "@/components/store-link";
import { MediaField } from "@/components/media-field";
import { mediaToRef, useMediaLibrary } from "@/lib/media";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { Field, SaveFooter } from "./settings-fields";

/** General — Store fields (spec §4.1) + link to taxes for the VAT number. */
export function GeneralPanel() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data: store } = useCurrentStore();
  const { data: domains } = useDomains();
  const save = useSaveStoreSettings();
  const lib = useMediaLibrary();
  const [logoOpen, setLogoOpen] = React.useState(false);
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Record<string, string> | null>(null);
  const v = (key: string, fallback: string) => form?.[key] ?? fallback;
  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...(f ?? {}), [key]: e.target.value }));
  const primaryDomain = domains?.find((d) => d.isPrimary)?.hostname ?? domains?.[0]?.hostname;

  const saveLogo = () => {
    const media = logoUrl ? lib.images.find((m) => m.url === logoUrl) : null;
    const logo = logoUrl
      ? media
        ? mediaToRef(media, store?.name.ar ?? "logo")
        : { id: "store-logo", url: logoUrl, alt: { ar: store?.name.ar ?? "" }, width: 256, height: 256 }
      : null;
    save.mutate([{ logo }], {
      onSuccess: () => {
        mt.success("common.save.success");
        setLogoOpen(false);
      },
      onError: () => mt.error("common.save.error"),
    });
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("nav.general")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-4">
          {store?.logo?.url ? (
            <MediaThumb url={store.logo.url} label={store.name[locale] ?? store.name.ar} className="size-16 rounded-xl" />
          ) : (
            <span className="bg-primary text-primary-foreground flex size-16 items-center justify-center rounded-xl text-2xl font-bold">
              {(store?.name[locale] ?? store?.name.ar)?.charAt(0) ?? "…"}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLogoUrl(store?.logo?.url ?? null);
              setLogoOpen(true);
            }}
          >
            {t("general.changeLogo")}
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="s-name" label={t("general.name")} value={v("name", store?.name[locale] ?? store?.name.ar ?? "")} onChange={set("name")} />
          <div className="space-y-2">
            <Label htmlFor="s-domain">{t("general.domain")}</Label>
            <div className="flex gap-2">
              <Input id="s-domain" value={primaryDomain ?? ""} dir="ltr" className="num" readOnly />
              <Button variant="outline" className="shrink-0" asChild>
                <Link href="/storefront/domains">{t("general.connectDomain")}</Link>
              </Button>
            </div>
          </div>
          <Field id="s-legal" label={t("general.legalName")} value={v("legalName", store?.legalName ?? "")} onChange={set("legalName")} />
          <Field id="s-industry" label={t("general.industry")} value={v("industry", store?.industry ?? "")} onChange={set("industry")} />
          <Field id="s-email" label={t("general.email")} value={v("email", store?.contactEmail ?? "")} onChange={set("email")} dir="ltr" type="email" className="text-start" />
          <Field id="s-phone" label={t("general.phone")} value={v("phone", store?.contactPhone ?? "")} onChange={set("phone")} dir="ltr" className="num text-start" />
          <Field id="s-cr" label={t("general.cr")} value={v("cr", store?.commercialRegistration ?? "")} onChange={set("cr")} dir="ltr" className="num text-start" />
          <div className="space-y-2">
            <Label htmlFor="s-vat">{t("general.vatNumber")}</Label>
            <div className="flex gap-2">
              <Input id="s-vat" value={v("vat", store?.vatNumber ?? "")} onChange={set("vat")} dir="ltr" className="num text-start" />
              <Button variant="ghost" size="sm" className="shrink-0" asChild>
                <Link href="/settings/taxes">
                  {t("general.taxSettings")}
                  <ArrowLeft aria-hidden className="rtl:-scale-x-100" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      <SaveFooter
        pending={save.isPending}
        onSave={() =>
          save.mutate(
            [
              {
                name: { ar: v("name", store?.name.ar ?? ""), en: store?.name.en },
                legalName: v("legalName", store?.legalName ?? "") || null,
                contactEmail: v("email", store?.contactEmail ?? ""),
                contactPhone: v("phone", store?.contactPhone ?? ""),
                commercialRegistration: v("cr", store?.commercialRegistration ?? "") || null,
                vatNumber: v("vat", store?.vatNumber ?? "") || null,
              },
            ],
            { onSuccess: () => mt.success("common.save.success") },
          )
        }
      />
      <Dialog open={logoOpen} onOpenChange={setLogoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("general.changeLogo")}</DialogTitle>
          </DialogHeader>
          <MediaField value={logoUrl} aspect="1:1" onChange={setLogoUrl} />
          <DialogFooter>
            <Button onClick={saveLogo} loading={save.isPending}>
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
