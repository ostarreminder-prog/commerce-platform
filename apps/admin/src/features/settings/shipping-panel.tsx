"use client";

import * as React from "react";
import { MapPin, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSaveShippingSettings, useShippingSettings } from "@repo/api-client";
import type { ShippingSettings } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { Field, SaveFooter } from "./settings-fields";
import { ReturnPolicyCard } from "./return-policy-card";

const CARRIER_NAMES: Record<string, string> = { aramex: "أرامكس", smsa: "سمسا", spl: "سبل", redbox: "ريدبوكس" };

/** Shipping — pickup address + zones editor + carriers + thresholds (spec §4.20). */
export function ShippingPanel() {
  const t = useTranslations("settings");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data, isPending } = useShippingSettings();
  const save = useSaveShippingSettings();
  const [carriers, setCarriers] = React.useState<ShippingSettings["carriers"] | null>(null);
  const carrierList = carriers ?? data?.carriers ?? [];
  if (isPending || !data) return <Skeleton className="h-96 w-full" />;
  const a = data.pickupAddress;
  const persist = () =>
    save.mutate([{ carriers: carrierList }], {
      onSuccess: () => {
        setCarriers(null);
        mt.success("common.save.success");
      },
    });
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="size-4" aria-hidden /> {t("shipping.pickup.title")}
          </CardTitle>
          <CardDescription>{t("shipping.pickup.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id="pk-name" label={t("shipping.pickup.recipient")} defaultValue={a.recipientName} />
          <Field id="pk-phone" label={t("shipping.pickup.phone")} defaultValue={a.phone} dir="ltr" className="num text-start" />
          <Field id="pk-city" label={t("shipping.pickup.city")} defaultValue={a.city} />
          <Field id="pk-district" label={t("shipping.pickup.district")} defaultValue={a.district} />
          <Field id="pk-street" label={t("shipping.pickup.street")} defaultValue={a.street ?? ""} />
          <Field id="pk-postal" label={t("shipping.pickup.postalCode")} defaultValue={a.postalCode ?? ""} dir="ltr" className="num text-start" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("shipping.zones.title")}</CardTitle>
          <CardDescription>{t("shipping.zones.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.zones.map((z) => (
            <div key={z.id} className="rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
                <span className="text-sm font-medium">{z.name}</span>
                <span className="flex flex-wrap gap-1">
                  {z.cities.map((c) => (
                    <Badge key={c} variant="secondary">
                      {c}
                    </Badge>
                  ))}
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("shipping.zones.rateType")}</TableHead>
                    <TableHead>{t("shipping.zones.conditions")}</TableHead>
                    <TableHead>{t("shipping.zones.price")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {z.rates.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{t(`shipping.zones.rate.${r.type}`)}</TableCell>
                      <TableCell>{r.conditions}</TableCell>
                      <TableCell className="num">{formatMoney(r.price.amount, locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="size-4" aria-hidden /> {t("shipping.carriers.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {carrierList.map((c) => (
                <li key={c.carrierId} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium">{CARRIER_NAMES[c.carrierId] ?? c.carrierId}</span>
                  <Switch
                    checked={c.enabled}
                    aria-label={CARRIER_NAMES[c.carrierId] ?? c.carrierId}
                    onCheckedChange={(on) => setCarriers((all) => (all ?? data.carriers).map((x) => (x.carrierId === c.carrierId ? { ...x, enabled: on } : x)))}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("shipping.options.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="sh-free" label={t("shipping.options.freeThreshold")} defaultValue={String((data.freeShippingThreshold?.amount ?? 0) / 100)} dir="ltr" className="num text-start" />
              <Field id="sh-fallback" label={t("shipping.options.fallbackRate")} defaultValue={String(data.fallbackRate.amount / 100)} dir="ltr" className="num text-start" />
            </div>
            <Field id="sh-handling" label={t("shipping.options.handlingDays")} defaultValue={String(data.handlingDays)} dir="ltr" className="num text-start" />
          </CardContent>
          <SaveFooter pending={save.isPending} onSave={persist} />
        </Card>
      </div>
      <ReturnPolicyCard />
    </div>
  );
}
