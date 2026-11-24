"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useUpdateCustomer } from "@repo/api-client";
import type { Customer } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";

export function EditCustomerDialog({ c, open, onOpenChange }: { c: Customer; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("customers.edit");
  const tc = useTranslations("common");
  const update = useUpdateCustomer();
  const [name, setName] = React.useState(c.name ?? "");
  const [email, setEmail] = React.useState(c.email ?? "");
  const [gender, setGender] = React.useState(c.gender);
  const [birthDate, setBirthDate] = React.useState(c.birthDate ?? "");
  const [notes, setNotes] = React.useState(c.notes);
  const submit = () => update.mutate([c.id, { name: name.trim() || null, email: email.trim() || null, gender, birthDate: birthDate || null, notes: notes.trim() }], {
    onSuccess: () => { toast.success(t("done")); onOpenChange(false); },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t("title")}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="ce-name">{t("name")}</Label><Input id="ce-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="ce-email">{t("email")}</Label><Input id="ce-email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>{t("gender")}</Label>
              <Select value={gender} onValueChange={(v) => setGender(v as Customer["gender"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["male", "female", "unspecified"] as const).map((g) => <SelectItem key={g} value={g}>{t(`genders.${g}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label htmlFor="ce-birth">{t("birthDate")}</Label><Input id="ce-birth" type="date" dir="ltr" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label htmlFor="ce-notes">{t("notes")}</Label><Textarea id="ce-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={submit} disabled={update.isPending}>{tc("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
