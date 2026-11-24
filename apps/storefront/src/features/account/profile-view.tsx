"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useUpdateCustomer } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useSession } from "@/components/session-context";
import { AccountNav } from "./account-nav";
import { GuestGate } from "./guest-gate";

/** Profile form for the signed-in customer; saves name/email (phone is read-only in the mock API). */
export function ProfileView() {
  const t = useTranslations("store");
  const mt = useMsgToast();
  const { customer, status } = useSession();
  const update = useUpdateCustomer();
  const [form, setForm] = React.useState({ name: "", phone: "", email: "" });
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (customer && !loaded) {
      setForm({ name: customer.name ?? "", phone: customer.phone, email: customer.email ?? "" });
      setLoaded(true);
    }
  }, [customer, loaded]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    update.mutate([customer.id, { name: form.name, email: form.email || null }], {
      onSuccess: () => mt.success("common.save.success"),
      onError: () => mt.error("common.server.error"),
    });
  };

  return (
    <div className="container max-w-3xl py-8">
      <GuestGate>
        <AccountNav />
        <h1 className="mb-6 text-2xl font-bold">{t("account.profile")}</h1>
        {status === "loading" ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          <Card>
            <CardContent className="p-5 sm:p-6">
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name">{t("account.name")}</Label>
                  <Input id="profile-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="profile-phone">{t("account.phone")}</Label>
                  <Input id="profile-phone" value={form.phone} dir="ltr" className="text-start" disabled readOnly />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="profile-email">{t("account.email")}</Label>
                  <Input id="profile-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} dir="ltr" className="text-start" />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={update.isPending || !customer}>
                    {t("account.save")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </GuestGate>
    </div>
  );
}
