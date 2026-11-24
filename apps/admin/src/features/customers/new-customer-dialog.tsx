"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCreateCustomer } from "@repo/api-client";
import { SAUDI_CITIES, type Customer, type SaudiCity } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useStoreRouter } from "@/lib/store-route";

const emptyAddr = { recipientName: "", phone: "", city: "" as SaudiCity | "", district: "", street: "", buildingNumber: "", postalCode: "" };

export function NewCustomerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("customers.new");
  const ta = useTranslations("customers.profile.addressForm");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const create = useCreateCustomer();
  const router = useStoreRouter();
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("+9665");
  const [email, setEmail] = React.useState("");
  const [gender, setGender] = React.useState<Customer["gender"]>("unspecified");
  const [birthDate, setBirthDate] = React.useState("");
  const [tags, setTags] = React.useState("");
  const [note, setNote] = React.useState("");
  const [consent, setConsent] = React.useState({ whatsapp: false, sms: false, email: false });
  const [withAddr, setWithAddr] = React.useState(false);
  const [addr, setAddr] = React.useState(emptyAddr);
  const field = (key: keyof typeof emptyAddr, ltr = false) => (
    <div className="space-y-1.5" key={key}>
      <Label htmlFor={`nca-${key}`}>{ta(key === "recipientName" ? "recipient" : key === "buildingNumber" ? "building" : key === "postalCode" ? "postal" : key)}</Label>
      <Input id={`nca-${key}`} dir={ltr ? "ltr" : undefined} value={addr[key]} onChange={(e) => setAddr((a) => ({ ...a, [key]: e.target.value }))} />
    </div>
  );
  const submit = () => {
    if (!name.trim() || !/^\+9665\d{8}$/.test(phone)) { mt.error("validation.phone.format"); return; }
    if (withAddr && (!addr.city || !addr.recipientName.trim())) { toast.error(t("addressRequired")); return; }
    create.mutate([{
      name: name.trim(), phone,
      email: email.trim() || null,
      gender,
      birthDate: birthDate || null,
      tags: tags.split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      notes: note.trim(),
      marketingConsent: consent,
      address: withAddr ? {
        label: null, recipientName: addr.recipientName.trim(), phone: addr.phone || phone,
        city: addr.city as SaudiCity, district: addr.district.trim(), street: addr.street.trim() || null,
        buildingNumber: addr.buildingNumber || null, additionalNumber: null, postalCode: addr.postalCode || null,
        shortAddress: null, location: null, notes: null, isDefault: true,
      } : undefined,
    }], {
      onSuccess: (c) => { mt.success("customers.created", { name: name.trim() }); router.push(`/customers/${c.id}`); },
      onError: (e) => toast.error(e.message === "phone_taken" ? t("phoneTaken") : t("failed")),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t("title")}</DialogTitle><DialogDescription>{t("description")}</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="nc-name">{t("name")} *</Label><Input id="nc-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="nc-phone">{t("phone")} *</Label><Input id="nc-phone" dir="ltr" className="num" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+9665XXXXXXXX" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label htmlFor="nc-email">{t("email")}</Label><Input id="nc-email" dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1.5"><Label htmlFor="nc-birth">{t("birthDate")}</Label><Input id="nc-birth" type="date" dir="ltr" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("gender")}</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Customer["gender"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unspecified">{t("genderUnspecified")}</SelectItem>
                <SelectItem value="male">{t("genderMale")}</SelectItem>
                <SelectItem value="female">{t("genderFemale")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label htmlFor="nc-tags">{t("tags")}</Label><Input id="nc-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("tagsPlaceholder")} /></div>
          <div className="space-y-1.5"><Label htmlFor="nc-note">{t("note")}</Label><Textarea id="nc-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>{t("consent")}</Label>
            <div className="flex flex-wrap gap-4">
              {(["whatsapp", "sms", "email"] as const).map((k) => (
                <label key={k} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={consent[k]} onCheckedChange={(v) => setConsent((c) => ({ ...c, [k]: v === true }))} />
                  {t(`consent_${k}`)}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <Checkbox checked={withAddr} onCheckedChange={(v) => setWithAddr(v === true)} />
            {t("withAddress")}
          </label>
          {withAddr ? (
            <div className="space-y-3 rounded-md border p-3">
              {field("recipientName")}
              <div className="grid grid-cols-2 gap-3">
                {field("phone", true)}
                <div className="space-y-1.5">
                  <Label>{ta("city")}</Label>
                  <Select value={addr.city} onValueChange={(v) => setAddr((a) => ({ ...a, city: v as SaudiCity }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SAUDI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">{field("district")}{field("street")}</div>
              <div className="grid grid-cols-2 gap-3">{field("buildingNumber", true)}{field("postalCode", true)}</div>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={submit} disabled={create.isPending}>{t("create")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
