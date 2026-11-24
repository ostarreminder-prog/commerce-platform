"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Coupon } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Textarea } from "@repo/ui/components/textarea";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import { PAYMENT_OPTIONS, type PaymentOption } from "./new-order-utils";

export function NewOrderPaymentCard({
  couponCode, setCouponCode, coupon, cd, manualDiscount, setManualDiscount, payment, setPayment, note, setNote, confirm, setConfirm,
}: {
  couponCode: string;
  setCouponCode: React.Dispatch<React.SetStateAction<string>>;
  coupon: Coupon | undefined;
  cd: { amount: number; error: string | null };
  manualDiscount: string;
  setManualDiscount: React.Dispatch<React.SetStateAction<string>>;
  payment: PaymentOption;
  setPayment: React.Dispatch<React.SetStateAction<PaymentOption>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  confirm: boolean;
  setConfirm: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const t = useTranslations("sales.newOrder");
  const { locale } = useAppLocale();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("paymentAndNotes")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="no-coupon">{t("coupon")}</Label>
            <div className="relative">
              <Input id="no-coupon" dir="ltr" className="num pe-8" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} aria-invalid={!!cd.error} />
              {couponCode ? <button type="button" className="text-muted-foreground absolute end-2 top-1/2 -translate-y-1/2" aria-label={t("remove")} onClick={() => setCouponCode("")}><X className="size-4" /></button> : null}
            </div>
            {cd.error ? <p className="text-destructive text-xs">{t(`couponErrors.${cd.error as "unknown" | "inactive" | "min"}`)}</p> : coupon ? <p className="text-success text-xs">{t("couponApplied", { amount: formatMoney(cd.amount, locale) })}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="no-discount">{t("manualDiscount")}</Label>
            <Input id="no-discount" dir="ltr" inputMode="decimal" className="num" value={manualDiscount} onChange={(e) => setManualDiscount(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("paymentMethod")}</Label>
          <RadioGroup value={payment} onValueChange={(v) => setPayment(v as PaymentOption)} className="grid gap-2 sm:grid-cols-2">
            {PAYMENT_OPTIONS.map((p) => (
              <Label key={p} htmlFor={`pm-${p}`} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal", payment === p && "border-primary bg-primary/5")}>
                <RadioGroupItem id={`pm-${p}`} value={p} />
                {t(`payments.${p}`)}
              </Label>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="no-note">{t("note")}</Label>
          <Textarea id="no-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="no-confirm" checked={confirm} onCheckedChange={(v) => setConfirm(v === true)} />
          <Label htmlFor="no-confirm" className="font-normal">{t("sendConfirmation")}</Label>
        </div>
      </CardContent>
    </Card>
  );
}
