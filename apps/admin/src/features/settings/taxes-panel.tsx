"use client";

import * as React from "react";
import { Check, FileCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSaveTaxSettings, useTaxSettings } from "@repo/api-client";
import type { TaxSettings } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";
import { Field, SaveFooter } from "./settings-fields";

const ZATCA_STEPS = ["register", "onboard", "live"] as const;
const ZATCA_INDEX: Record<TaxSettings["zatcaStatus"], number> = { not_connected: 0, onboarding: 1, connected: 2, error: 1 };

/** Taxes & ZATCA — VAT fields + e-invoicing onboarding steps (spec §4.20). */
export function TaxesPanel() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { data, isPending } = useTaxSettings();
  const save = useSaveTaxSettings();
  const [form, setForm] = React.useState<Pick<TaxSettings, "vatEnabled" | "pricesIncludeTax"> | null>(null);
  if (isPending || !data) return <Skeleton className="h-96 w-full" />;
  const vatEnabled = form?.vatEnabled ?? data.vatEnabled;
  const included = form?.pricesIncludeTax ?? data.pricesIncludeTax;
  const zatcaDone = ZATCA_INDEX[data.zatcaStatus];
  const persist = () =>
    save.mutate([{ vatEnabled, pricesIncludeTax: included }], {
      onSuccess: () => {
        setForm(null);
        mt.success("common.save.success");
      },
    });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("taxes.vat.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <label htmlFor="vat-enabled" className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <span>
              <span className="block text-sm font-medium">{t("taxes.vat.enabled")}</span>
              <span className="text-muted-foreground block text-xs">{t("taxes.vat.enabledHint")}</span>
            </span>
            <Switch id="vat-enabled" checked={vatEnabled} onCheckedChange={(v) => setForm((f) => ({ pricesIncludeTax: f?.pricesIncludeTax ?? data.pricesIncludeTax, vatEnabled: v }))} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="vat-number" label={t("taxes.vat.number")} defaultValue="310123456700003" dir="ltr" className="num text-start" />
            <Field id="vat-rate" label={t("taxes.vat.rate")} value={`${data.vatRate}%`} dir="ltr" className="num" readOnly />
          </div>
          <label htmlFor="vat-included" className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <span>
              <span className="block text-sm font-medium">{t("taxes.vat.included")}</span>
              <span className="text-muted-foreground block text-xs">{t("taxes.vat.includedHint", { rate: data.vatRate })}</span>
            </span>
            <Switch id="vat-included" checked={included} onCheckedChange={(v) => setForm((f) => ({ vatEnabled: f?.vatEnabled ?? data.vatEnabled, pricesIncludeTax: v }))} />
          </label>
        </CardContent>
        <SaveFooter pending={save.isPending} onSave={persist} />
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileCheck className="size-4" aria-hidden /> {t("taxes.zatca.title")}
            </CardTitle>
            <CardDescription>{t("taxes.zatca.hint")}</CardDescription>
          </div>
          <Badge variant={data.zatcaStatus === "connected" ? "success" : data.zatcaStatus === "error" ? "destructive" : "warning"}>{t(`taxes.zatca.status.${data.zatcaStatus}`)}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="flex items-center gap-2">
            {ZATCA_STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    i < zatcaDone ? "bg-success/15 text-success" : i === zatcaDone ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < zatcaDone ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn("text-xs", i <= zatcaDone ? "font-medium" : "text-muted-foreground")}>{t(`taxes.zatca.steps.${s}`)}</span>
              </li>
            ))}
          </ol>
          {data.egsSerial ? (
            <p className="text-muted-foreground text-xs">
              {t("taxes.zatca.egsSerial")}: <span className="num" dir="ltr">{data.egsSerial}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
