"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { ThemeToggle } from "@repo/ui/components/theme-toggle";
import { toast } from "@repo/ui/components/toaster";
import { setLocale } from "@/actions/locale";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupView() {
  const t = useTranslations();
  const router = useRouter();
  const [form, setForm] = React.useState({ name: "", email: "", company: "", password: "" });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t("common.required");
    if (!EMAIL.test(form.email)) errs.email = t("signup.invalidEmail");
    if (!form.company.trim()) errs.company = t("common.required");
    if (form.password.length < 8) errs.password = t("signup.shortPassword");
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    toast.success(t("signup.welcome"));
    router.push("/apps");
  };

  return (
    <div className="bg-muted/30 flex min-h-dvh flex-col">
      <header className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="bg-info text-paper flex size-8 items-center justify-center rounded-lg text-sm font-bold">{"</>"}</span>
          <span className="text-sm font-bold">{t("nav.brand")}</span>
        </Link>
        <div className="flex items-center gap-1">
          <LocaleSwitcher onLocaleChange={setLocale} />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-1.5 text-center">
              <h1 className="text-xl font-bold">{t("signup.title")}</h1>
              <p className="text-muted-foreground text-sm">{t("signup.description")}</p>
            </div>
            <form className="space-y-4" onSubmit={submit} noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("signup.name")}</Label>
                <Input id="name" value={form.name} aria-invalid={Boolean(errors.name)} onChange={set("name")} />
                {errors.name ? <p className="text-destructive text-xs" role="alert">{errors.name}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("signup.email")}</Label>
                <Input id="email" type="email" dir="ltr" value={form.email} aria-invalid={Boolean(errors.email)} onChange={set("email")} />
                {errors.email ? <p className="text-destructive text-xs" role="alert">{errors.email}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">{t("signup.company")}</Label>
                <Input id="company" value={form.company} aria-invalid={Boolean(errors.company)} onChange={set("company")} />
                {errors.company ? <p className="text-destructive text-xs" role="alert">{errors.company}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">{t("signup.password")}</Label>
                <Input id="password" type="password" dir="ltr" value={form.password} aria-invalid={Boolean(errors.password)} onChange={set("password")} />
                {errors.password ? <p className="text-destructive text-xs" role="alert">{errors.password}</p> : null}
              </div>
              <Button type="submit" className="w-full">
                {t("signup.submit")}
              </Button>
            </form>
            <p className="text-muted-foreground text-center text-xs">{t("signup.terms")}</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
