"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useUpdateOrderAddress } from "@repo/api-client";
import { SAUDI_CITIES, type Address } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import type { DialogProps } from "./order-dialog-parts";

export function AddressDialog({ order, open, onOpenChange }: DialogProps) {
  const t = useTranslations("sales.dialogs.address");
  const tc = useTranslations("common");
  const update = useUpdateOrderAddress();
  const [a, setA] = React.useState<Address>(order.shippingAddress);
  React.useEffect(() => { if (open) setA(order.shippingAddress); }, [open, order.shippingAddress]);
  const field = (k: "recipientName" | "phone" | "district" | "street" | "buildingNumber" | "postalCode" | "shortAddress", ltr = false) => (
    <div className="space-y-1.5">
      <Label htmlFor={`adr-${k}`}>{t(k)}</Label>
      <Input id={`adr-${k}`} dir={ltr ? "ltr" : undefined} value={a[k] ?? ""} onChange={(e) => setA((x) => ({ ...x, [k]: e.target.value }))} />
    </div>
  );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {field("recipientName")}
          {field("phone", true)}
          <div className="space-y-1.5">
            <Label htmlFor="adr-city">{t("city")}</Label>
            <Select value={a.city} onValueChange={(v) => setA((x) => ({ ...x, city: v as Address["city"] }))}>
              <SelectTrigger id="adr-city"><SelectValue /></SelectTrigger>
              <SelectContent>{SAUDI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {field("district")}
          {field("street")}
          {field("buildingNumber", true)}
          {field("postalCode", true)}
          {field("shortAddress", true)}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button
            disabled={update.isPending || !a.recipientName.trim()}
            onClick={() => update.mutate([order.id, a], { onSuccess: () => { toast.success(t("saved")); onOpenChange(false); }, onError: () => toast.error(t("failed")) })}
          >
            {tc("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
