"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { CouponInput } from "@repo/api-client";
import type { Coupon } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DialogFooter } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib/cn";
import { toHalalas } from "@repo/ui/lib/money";
import { COUPON_TYPES } from "./coupon-utils";

export function CouponForm({ initial, onSubmit, pending, submitLabel }: { initial: Partial<CouponInput>; onSubmit: (v: CouponInput) => void; pending: boolean; submitLabel: string }) {
  const t = useTranslations("marketing.coupon.form");
  const [v, setV] = React.useState<Partial<CouponInput>>(initial);
  const set = (p: Partial<CouponInput>) => setV((x) => ({ ...x, ...p }));
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cp-code">{t("code")}</Label>
          <Input id="cp-code" dir="ltr" className="num uppercase" value={v.code ?? ""} onChange={(e) => set({ code: e.target.value.toUpperCase() })} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("type")}</Label>
          <RadioGroup value={v.type} onValueChange={(x) => set({ type: x as Coupon["type"], value: x === "free_shipping" ? 0 : v.value })} className="flex gap-2">
            {COUPON_TYPES.map((k) => (
              <Label key={k} className={cn("flex flex-1 cursor-pointer items-center gap-1.5 rounded-md border p-2 text-xs", v.type === k && "border-primary bg-primary/5")}>
                <RadioGroupItem value={k} />{t(`types.${k}`)}
              </Label>
            ))}
          </RadioGroup>
        </div>
      </div>
      {v.type !== "free_shipping" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="cp-value">{v.type === "percentage" ? t("percent") : t("amount")}</Label>
            <Input id="cp-value" inputMode="decimal" dir="ltr" className="num" value={v.type === "fixed" ? (v.value ?? 0) / 100 : (v.value ?? "")} onChange={(e) => set({ value: v.type === "fixed" ? toHalalas(e.target.value) : Number(e.target.value) || 0 })} />
          </div>
          {v.type === "percentage" ? (
            <div className="space-y-1.5">
              <Label htmlFor="cp-max">{t("maxDiscount")}</Label>
              <Input id="cp-max" inputMode="decimal" dir="ltr" className="num" value={v.maxDiscount ? v.maxDiscount / 100 : ""} onChange={(e) => set({ maxDiscount: e.target.value ? toHalalas(e.target.value) : null })} />
            </div>
          ) : <div />}
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="cp-min">{t("minOrder")}</Label><Input id="cp-min" inputMode="decimal" dir="ltr" className="num" value={v.minOrderAmount ? v.minOrderAmount / 100 : ""} onChange={(e) => set({ minOrderAmount: e.target.value ? toHalalas(e.target.value) : null })} /></div>
        <div className="space-y-1.5"><Label htmlFor="cp-limit">{t("usageLimit")}</Label><Input id="cp-limit" inputMode="numeric" dir="ltr" className="num" value={v.usageLimit ?? ""} onChange={(e) => set({ usageLimit: e.target.value ? Number(e.target.value) : null })} /></div>
        <div className="space-y-1.5"><Label htmlFor="cp-per">{t("perCustomer")}</Label><Input id="cp-per" inputMode="numeric" dir="ltr" className="num" value={v.usageLimitPerCustomer ?? ""} onChange={(e) => set({ usageLimitPerCustomer: e.target.value ? Number(e.target.value) : null })} /></div>
        <div className="space-y-1.5">
          <Label>{t("appliesTo")}</Label>
          <Select value={v.appliesTo?.type ?? "all"} onValueChange={(x) => set({ appliesTo: { type: x as CouponInput["appliesTo"]["type"], ids: [] } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(["all", "products", "categories", "collections"] as const).map((k) => <SelectItem key={k} value={k}>{t(`applies.${k}`)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="cp-start">{t("startsAt")}</Label><Input id="cp-start" type="date" dir="ltr" value={(v.startsAt ?? "").slice(0, 10)} onChange={(e) => set({ startsAt: e.target.value || new Date().toISOString() })} /></div>
        <div className="space-y-1.5"><Label htmlFor="cp-end">{t("endsAt")}</Label><Input id="cp-end" type="date" dir="ltr" value={(v.endsAt ?? "").slice(0, 10)} onChange={(e) => set({ endsAt: e.target.value || null })} /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("eligibility")}</Label>
          <Select value={v.customerEligibility?.type ?? "all"} onValueChange={(x) => set({ customerEligibility: { type: x as CouponInput["customerEligibility"]["type"], customerIds: [] } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{(["all", "new"] as const).map((k) => <SelectItem key={k} value={k}>{t(`elig.${k}`)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Label className="flex items-end gap-2 pb-2">
          <Checkbox checked={v.excludeSaleItems ?? false} onCheckedChange={(x) => set({ excludeSaleItems: x === true })} />
          <span className="text-sm">{t("excludeSaleItems")}</span>
        </Label>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(v as CouponInput)} disabled={pending || !v.code?.trim() || !v.type || !v.startsAt}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );
}
