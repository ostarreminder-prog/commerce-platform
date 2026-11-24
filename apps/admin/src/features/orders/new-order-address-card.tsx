"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { SAUDI_CITIES, type Address, type Customer } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib/cn";
import type { NewAddressDraft } from "./new-order-utils";

export function NewOrderAddressCard({
  customer, addressId, setAddressId, newAddress, setNewAddress, error,
}: {
  customer: Customer | undefined;
  addressId: string;
  setAddressId: React.Dispatch<React.SetStateAction<string>>;
  newAddress: NewAddressDraft;
  setNewAddress: React.Dispatch<React.SetStateAction<NewAddressDraft>>;
  error: React.ReactNode;
}) {
  const t = useTranslations("sales.newOrder");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("address")} *</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {!customer ? <p className="text-muted-foreground text-sm">{t("pickCustomerFirst")}</p> : (
          <RadioGroup value={addressId} onValueChange={setAddressId} className="space-y-2">
            {customer.addresses.map((a) => (
              <Label key={a.id} htmlFor={`a-${a.id}`} className={cn("flex cursor-pointer items-start gap-3 rounded-md border p-3 font-normal", addressId === a.id && "border-primary bg-primary/5")}>
                <RadioGroupItem id={`a-${a.id}`} value={a.id} className="mt-0.5" />
                <span className="text-sm">
                  <span className="block font-medium">{a.label ?? a.recipientName}</span>
                  <span className="text-muted-foreground block">{[a.city, a.district, a.street].filter(Boolean).join("، ")}</span>
                </span>
              </Label>
            ))}
            <Label htmlFor="a-new" className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal", addressId === "new" && "border-primary bg-primary/5")}>
              <RadioGroupItem id="a-new" value="new" />
              <span className="text-sm font-medium">{t("newAddress")}</span>
            </Label>
          </RadioGroup>
        )}
        {customer && addressId === "new" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="na-name">{t("recipient")} *</Label><Input id="na-name" value={newAddress.recipientName} onChange={(e) => setNewAddress((a) => ({ ...a, recipientName: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label htmlFor="na-phone">{t("customerPhone")} *</Label><Input id="na-phone" dir="ltr" value={newAddress.phone} onChange={(e) => setNewAddress((a) => ({ ...a, phone: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label htmlFor="na-city">{t("city")} *</Label>
              <Select value={newAddress.city} onValueChange={(v) => setNewAddress((a) => ({ ...a, city: v as Address["city"] }))}>
                <SelectTrigger id="na-city"><SelectValue /></SelectTrigger>
                <SelectContent>{SAUDI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="na-district">{t("district")} *</Label><Input id="na-district" value={newAddress.district} onChange={(e) => setNewAddress((a) => ({ ...a, district: e.target.value }))} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="na-street">{t("street")}</Label><Input id="na-street" value={newAddress.street} onChange={(e) => setNewAddress((a) => ({ ...a, street: e.target.value }))} /></div>
          </div>
        ) : null}
        {customer ? error : null}
      </CardContent>
    </Card>
  );
}
