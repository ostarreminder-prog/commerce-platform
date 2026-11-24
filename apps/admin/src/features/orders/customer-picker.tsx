"use client";

import * as React from "react";
import { Search, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateCustomer, useCustomerList } from "@repo/api-client";
import type { Customer } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Popover, PopoverAnchor, PopoverContent } from "@repo/ui/components/popover";
import { toast } from "@repo/ui/components/toaster";
import { EntityLink } from "@/components/entity/entity-link";
import { PHONE_RE, normalizePhone } from "./new-order-utils";

export function CustomerPicker({ customer, onPick }: { customer: Customer | undefined; onPick: (c: Customer | null) => void }) {
  const t = useTranslations("sales.newOrder");
  const customers = useCustomerList();
  const create = useCreateCustomer();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [quick, setQuick] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const needle = q.trim().toLowerCase();
  const hits = needle ? (customers.data ?? []).filter((c) => (c.name ?? "").toLowerCase().includes(needle) || c.phone.replace(/\D/g, "").includes(needle.replace(/\D/g, "") || "~")).slice(0, 6) : [];

  if (customer) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
        <div className="min-w-0">
          <EntityLink type="customer" id={customer.id} className="font-medium" />
          <bdi className="num text-muted-foreground block text-xs" dir="ltr">{customer.phone}</bdi>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onPick(null)}>{t("change")}</Button>
      </div>
    );
  }
  if (quick) {
    return (
      <form
        className="grid gap-3 rounded-md border p-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return setErr("name");
          if (!PHONE_RE.test(phone.replace(/\s/g, ""))) return setErr("phone");
          create.mutate([{ name: name.trim(), phone: normalizePhone(phone) }], {
            onSuccess: (c) => { onPick(c); toast.success(t("customerCreated")); },
            onError: () => setErr("taken"),
          });
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="qc-name">{t("customerName")} *</Label>
          <Input id="qc-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={err === "name"} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="qc-phone">{t("customerPhone")} *</Label>
          <Input id="qc-phone" dir="ltr" placeholder="05XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={err === "phone" || err === "taken"} />
        </div>
        {err ? <p className="text-destructive text-xs sm:col-span-2">{t(`errors.${err as "name" | "phone" | "taken"}`)}</p> : null}
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" size="sm" disabled={create.isPending}>{t("createCustomer")}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setQuick(false)}>{t("cancel")}</Button>
        </div>
      </form>
    );
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Popover open={open && hits.length > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <Input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={t("searchCustomer")} aria-label={t("searchCustomer")} className="ps-9" />
          </div>
        </PopoverAnchor>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
          {hits.map((c) => (
            <button key={c.id} type="button" className="hover:bg-accent flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-start text-sm" onClick={() => { onPick(c); setOpen(false); }}>
              <span className="truncate">{c.name ?? "—"}</span>
              <bdi className="num text-muted-foreground text-xs" dir="ltr">{c.phone}</bdi>
            </button>
          ))}
        </PopoverContent>
      </Popover>
      <Button variant="outline" onClick={() => setQuick(true)}><UserPlus aria-hidden />{t("quickCreate")}</Button>
    </div>
  );
}
