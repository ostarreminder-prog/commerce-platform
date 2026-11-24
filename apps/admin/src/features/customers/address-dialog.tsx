"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useAddCustomerAddress, useUpdateCustomerAddress } from "@repo/api-client";
import type { Address, SaudiCity } from "@repo/contracts";
import { SAUDI_CITIES } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";

const PHONE_RE = /^\+9665\d{8}$/;

/** Add/edit a customer address (§5.13) — `address` set = edit mode, null = add. */
export function AddressDialog({ customerId, address, open, onOpenChange }: {
  customerId: string;
  address: Address | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("customers.profile.addressForm");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const add = useAddCustomerAddress();
  const update = useUpdateCustomerAddress();
  const [label, setLabel] = React.useState("");
  const [recipientName, setRecipientName] = React.useState("");
  const [phone, setPhone] = React.useState("+9665");
  const [city, setCity] = React.useState<SaudiCity>("الرياض");
  const [district, setDistrict] = React.useState("");
  const [street, setStreet] = React.useState("");
  const [buildingNumber, setBuildingNumber] = React.useState("");
  const [postalCode, setPostalCode] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);

  /* Re-seed the form every time the dialog opens (add = blank, edit = values). */
  React.useEffect(() => {
    if (!open) return;
    setLabel(address?.label ?? "");
    setRecipientName(address?.recipientName ?? "");
    setPhone(address?.phone ?? "+9665");
    setCity(address?.city ?? "الرياض");
    setDistrict(address?.district ?? "");
    setStreet(address?.street ?? "");
    setBuildingNumber(address?.buildingNumber ?? "");
    setPostalCode(address?.postalCode ?? "");
    setNotes(address?.notes ?? "");
    setIsDefault(address?.isDefault ?? false);
  }, [open, address]);

  const pending = add.isPending || update.isPending;
  const submit = () => {
    if (!recipientName.trim() || !district.trim()) { mt.error("validation.required"); return; }
    if (!PHONE_RE.test(phone)) { mt.error("validation.phone.format"); return; }
    const body: Omit<Address, "id"> = {
      label: label.trim() || null,
      recipientName: recipientName.trim(),
      phone,
      city,
      district: district.trim(),
      street: street.trim() || null,
      buildingNumber: buildingNumber.trim() || null,
      additionalNumber: null,
      postalCode: postalCode.trim() || null,
      shortAddress: null,
      location: null,
      notes: notes.trim() || null,
      isDefault,
    };
    const onDone = { onSuccess: () => { toast.success(t("saved")); onOpenChange(false); }, onError: () => toast.error(t("failed")) };
    if (address) update.mutate([customerId, address.id, body], onDone);
    else add.mutate([customerId, body], onDone);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{address ? t("editTitle") : t("addTitle")}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="ad-label">{t("label")}</Label><Input id="ad-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t("labelPlaceholder")} /></div>
          <div className="space-y-1.5"><Label htmlFor="ad-name">{t("recipient")}</Label><Input id="ad-name" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ad-phone">{t("phone")}</Label><Input id="ad-phone" dir="ltr" className="num" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665XXXXXXXX" /></div>
          <div className="space-y-1.5">
            <Label>{t("city")}</Label>
            <Select value={city} onValueChange={(v) => setCity(v as SaudiCity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{SAUDI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ad-district">{t("district")}</Label><Input id="ad-district" value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ad-street">{t("street")}</Label><Input id="ad-street" value={street} onChange={(e) => setStreet(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ad-building">{t("building")}</Label><Input id="ad-building" dir="ltr" className="num" value={buildingNumber} onChange={(e) => setBuildingNumber(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ad-postal">{t("postal")}</Label><Input id="ad-postal" dir="ltr" className="num" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} /></div>
          <div className="col-span-2 space-y-1.5"><Label htmlFor="ad-notes">{t("notes")}</Label><Input id="ad-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <div className="flex items-center justify-between rounded-md border p-2.5 text-sm">
          <span>{t("default")}</span>
          <Switch checked={isDefault} onCheckedChange={setIsDefault} aria-label={t("default")} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={submit} disabled={pending}>{tc("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
