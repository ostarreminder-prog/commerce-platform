"use client";

import * as React from "react";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { SAUDI_CITIES } from "@repo/contracts";
import type { Address } from "@repo/contracts";
import { useAddCustomerAddress, useDeleteCustomerAddress, useSetDefaultCustomerAddress, useUpdateCustomerAddress } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useSession } from "@/components/session-context";
import { AccountNav } from "./account-nav";
import { GuestGate } from "./guest-gate";

const EMPTY_FORM = { label: "", recipientName: "", phone: "", city: "", district: "", street: "" };

function AddressForm({
  initial,
  submitting,
  onSubmit,
}: {
  initial: typeof EMPTY_FORM;
  submitting: boolean;
  onSubmit: (form: typeof EMPTY_FORM) => void;
}) {
  const t = useTranslations("store");
  const [form, setForm] = React.useState(initial);
  const field = (key: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="addr-label">{t("account.addressLabel")}</Label>
        <Input id="addr-label" value={form.label} onChange={field("label")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-name">{t("account.recipient")}</Label>
        <Input id="addr-name" required value={form.recipientName} onChange={field("recipientName")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-phone">{t("account.phone")}</Label>
        <Input id="addr-phone" required value={form.phone} onChange={field("phone")} dir="ltr" className="text-start" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-city">{t("city")}</Label>
        <Select value={form.city} onValueChange={(v) => setForm((f) => ({ ...f, city: v }))} required>
          <SelectTrigger id="addr-city">
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
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="addr-district">{t("district")}</Label>
        <Input id="addr-district" required value={form.district} onChange={field("district")} />
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="addr-street">{t("street")}</Label>
        <Input id="addr-street" value={form.street} onChange={field("street")} />
      </div>
      <Button type="submit" className="sm:col-span-2" disabled={submitting}>
        {t("account.save")}
      </Button>
    </form>
  );
}

export function AddressesView() {
  const t = useTranslations("store");
  const { customer, status } = useSession();
  const addAddress = useAddCustomerAddress();
  const updateAddress = useUpdateCustomerAddress();
  const deleteAddress = useDeleteCustomerAddress();
  const setDefault = useSetDefaultCustomerAddress();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Address | null>(null);
  const addresses = customer?.addresses ?? [];

  const payload = (form: typeof EMPTY_FORM): Omit<Address, "id"> => ({
    label: form.label || null,
    recipientName: form.recipientName,
    phone: form.phone,
    city: form.city as Address["city"],
    district: form.district,
    street: form.street || null,
    buildingNumber: null,
    additionalNumber: null,
    postalCode: null,
    shortAddress: null,
    location: null,
    notes: null,
    isDefault: addresses.length === 0,
  });

  const submitAdd = (form: typeof EMPTY_FORM) => {
    if (!customer) return;
    addAddress.mutate([customer.id, payload(form)], {
      onSuccess: () => {
        toast.success(t("account.addressAdded"));
        setAddOpen(false);
      },
      onError: () => toast.error(t("account.saveFailed")),
    });
  };

  const submitEdit = (form: typeof EMPTY_FORM) => {
    if (!customer || !editing) return;
    updateAddress.mutate([customer.id, editing.id, payload(form)], {
      onSuccess: () => {
        toast.success(t("account.addressUpdated"));
        setEditing(null);
      },
      onError: () => toast.error(t("account.saveFailed")),
    });
  };

  return (
    <div className="container max-w-3xl py-8">
      <GuestGate>
        <AccountNav />
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{t("account.addresses")}</h1>
          <Button onClick={() => setAddOpen(true)}>
            <Plus aria-hidden />
            {t("account.addAddress")}
          </Button>
        </div>
        {status === "loading" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 2 }, (_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : addresses.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <Card key={a.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-primary size-4" aria-hidden />
                    <span className="font-semibold">{a.label ?? t("account.addresses")}</span>
                    {a.isDefault ? <Badge variant="secondary">{t("account.default")}</Badge> : null}
                  </div>
                  <p className="text-sm font-medium">{a.recipientName}</p>
                  <p className="text-muted-foreground text-sm">
                    {a.city} · {a.district}
                    {a.street ? ` · ${a.street}` : ""}
                    {a.buildingNumber ? ` · ${a.buildingNumber}` : ""}
                  </p>
                  <p className="text-muted-foreground num text-xs" dir="ltr">
                    {a.phone}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(a)}>
                      <Pencil aria-hidden />
                      {t("account.edit")}
                    </Button>
                    {!a.isDefault ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => customer && setDefault.mutate([customer.id, a.id], { onSuccess: () => toast.success(t("account.defaultSet")) })}
                      >
                        <Star aria-hidden />
                        {t("account.setDefault")}
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => customer && deleteAddress.mutate([customer.id, a.id], { onSuccess: () => toast.success(t("account.addressDeleted")) })}
                    >
                      <Trash2 aria-hidden />
                      {t("account.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={MapPin}
            title={t("account.noAddresses")}
            action={
              <Button onClick={() => setAddOpen(true)}>
                <Plus aria-hidden />
                {t("account.addAddress")}
              </Button>
            }
          />
        )}
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("account.addAddress")}</DialogTitle>
            </DialogHeader>
            <AddressForm initial={EMPTY_FORM} submitting={addAddress.isPending} onSubmit={submitAdd} />
          </DialogContent>
        </Dialog>
        <Dialog open={Boolean(editing)} onOpenChange={(v) => !v && setEditing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("account.editAddress")}</DialogTitle>
            </DialogHeader>
            {editing ? (
              <AddressForm
                initial={{
                  label: editing.label ?? "",
                  recipientName: editing.recipientName,
                  phone: editing.phone,
                  city: editing.city,
                  district: editing.district,
                  street: editing.street ?? "",
                }}
                submitting={updateAddress.isPending}
                onSubmit={submitEdit}
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </GuestGate>
    </div>
  );
}
