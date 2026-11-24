"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { AuthShell } from "./auth-shell";

const INDUSTRIES = ["gifts", "perfumes", "fashion", "food", "other"] as const;

/** Store setup (step 1 of the wizard) — after `/signup/verify`, then onboarding. */
export function StoreSetupForm() {
  const t = useTranslations("signup");
  const to = useTranslations("onboarding");
  const mt = useMsgToast();
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", industry: "gifts", city: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    await new Promise((r) => setTimeout(r, 900));
    mt.success("onboarding.welcome.title", { name: form.name });
    router.push("/nakhla/onboarding/store");
  };

  return (
    <AuthShell title={t("store.title")} subtitle={t("store.subtitle")}>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="setup-name">{to("storeForm.name")} *</Label>
          <Input id="setup-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>{to("storeForm.industry")}</Label>
            <Select value={form.industry} onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((k) => (
                  <SelectItem key={k} value={k}>
                    {to(`industries.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="setup-city">{to("storeForm.city")}</Label>
            <Input id="setup-city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
        </div>
        <Button type="submit" className="w-full" loading={pending} disabled={!form.name.trim()}>
          {t("store.submit")}
        </Button>
      </form>
    </AuthShell>
  );
}
