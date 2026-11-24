"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { SAUDI_CITIES } from "@repo/contracts";
import type { Customer } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib/cn";
import { Choice } from "./checkout-choice";
import { NEW_ADDRESS, type CheckoutInfo, type NewAddress } from "./checkout-constants";

export type InfoErrors = Partial<Record<"name" | "phone" | "email" | "city" | "district" | "street" | "address", string>>;

export function InfoStep({
  customer,
  info,
  errors,
  setInfo,
  addressId,
  onAddress,
  newAddr,
  setNewAddr,
  onNext,
}: {
  customer: Customer | undefined;
  info: CheckoutInfo;
  errors: InfoErrors;
  setInfo: React.Dispatch<React.SetStateAction<CheckoutInfo>>;
  addressId: string | null;
  onAddress: (id: string) => void;
  newAddr: NewAddress;
  setNewAddr: React.Dispatch<React.SetStateAction<NewAddress>>;
  onNext: () => void;
}) {
  const t = useTranslations("store");
  const set = (k: keyof CheckoutInfo) => (e: React.ChangeEvent<HTMLInputElement>) => setInfo((s) => ({ ...s, [k]: e.target.value }));
  const setAddr = (k: keyof NewAddress) => (e: React.ChangeEvent<HTMLInputElement>) => setNewAddr((s) => ({ ...s, [k]: e.target.value }));
  const addresses = customer?.addresses ?? [];
  const showNewForm = addressId === NEW_ADDRESS || addresses.length === 0;

  const field = (k: "name" | "phone" | "email", label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${k}`} className={cn(errors[k] && "text-destructive")}>
        {label}
      </Label>
      <Input id={`f-${k}`} value={info[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
      {errors[k] ? (
        <p id={`e-${k}`} className="text-destructive text-xs">
          {errors[k]}
        </p>
      ) : null}
    </div>
  );

  const addrField = (k: keyof NewAddress, label: string, className?: string) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={`a-${k}`} className={cn(errors[k] && "text-destructive")}>
        {label}
      </Label>
      <Input id={`a-${k}`} value={newAddr[k]} onChange={setAddr(k)} aria-invalid={Boolean(errors[k])} />
      {errors[k] ? <p className="text-destructive text-xs">{errors[k]}</p> : null}
    </div>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      noValidate
    >
      <section className="space-y-4">
        <h2 className="font-semibold">{t("contactInfo")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", t("fullName"), { autoComplete: "name" })}
          <div>
            {field("phone", t("phone"), { dir: "ltr", inputMode: "tel", placeholder: "05xxxxxxxx", autoComplete: "tel", className: "num" })}
            {!errors.phone ? <p className="text-muted-foreground mt-1 text-xs">{t("phoneHint")}</p> : null}
          </div>
          {field("email", t("email"), { dir: "ltr", type: "email", autoComplete: "email" })}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="font-semibold">{t("address")}</h2>
        {addresses.length ? (
          <div className="space-y-3" role="radiogroup" aria-label={t("address")}>
            {addresses.map((a) => (
              <Choice
                key={a.id}
                checked={addressId === a.id}
                onSelect={() => onAddress(a.id)}
                title={
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="text-primary size-3.5" aria-hidden />
                    {a.label ?? a.recipientName}
                    {a.isDefault ? <Badge variant="secondary">{t("account.default")}</Badge> : null}
                  </span>
                }
                hint={`${a.recipientName} · ${a.city} · ${a.district}${a.street ? ` · ${a.street}` : ""}`}
              />
            ))}
            <Choice checked={addressId === NEW_ADDRESS} onSelect={() => onAddress(NEW_ADDRESS)} title={t("newAddress")} />
          </div>
        ) : null}
        {errors.address ? (
          <p className="text-destructive text-xs" role="alert">
            {errors.address}
          </p>
        ) : null}
        {showNewForm ? (
          <div className="grid gap-4 rounded-lg border border-dashed p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="a-city" className={cn(errors.city && "text-destructive")}>
                {t("city")}
              </Label>
              <Select value={newAddr.city} onValueChange={(city) => setNewAddr((s) => ({ ...s, city }))}>
                <SelectTrigger id="a-city" aria-invalid={Boolean(errors.city)}>
                  <SelectValue placeholder={t("chooseCity")} />
                </SelectTrigger>
                <SelectContent>
                  {SAUDI_CITIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.city ? <p className="text-destructive text-xs">{errors.city}</p> : null}
            </div>
            {addrField("district", t("district"))}
            {addrField("street", t("street"), "sm:col-span-2")}
            {addresses.length ? <p className="text-muted-foreground text-xs sm:col-span-2">{t("saveAddressHint")}</p> : null}
          </div>
        ) : null}
      </section>
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          {t("next")}
        </Button>
      </div>
    </form>
  );
}

/* `Choice` needs React in scope for JSX in the title prop above. */
