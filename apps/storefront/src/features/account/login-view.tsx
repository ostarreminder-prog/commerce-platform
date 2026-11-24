"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/toaster";
import { cn } from "@repo/ui/lib/cn";
import { useSession } from "@/components/session-context";

type Mode = "login" | "register";

/**
 * Mock auth — login opens the seeded demo customer regardless of credentials;
 * register creates a real mock customer (source: "storefront") and signs in.
 */
export function LoginView() {
  const t = useTranslations("store");
  const router = useRouter();
  const { status, login, signIn, register } = useSession();
  const [mode, setMode] = React.useState<Mode>("login");
  const [form, setForm] = React.useState({ name: "", phone: "", email: "", password: "" });
  const [fail, setFail] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (status === "authed") router.replace("/account/orders");
  }, [status, router]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    toast.success(t("account.loginSuccess"));
    router.push("/account/orders");
  };

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setFail(null);
    register.mutate([{ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || null, source: "storefront" }], {
      onSuccess: (c) => {
        signIn(c.id);
        toast.success(t("account.registerSuccess"));
        router.push("/account/orders");
      },
      onError: (err) => setFail(err instanceof Error && err.message === "phone_taken" ? t("account.phoneTaken") : t("errors.required")),
    });
  };

  return (
    <div className="container flex justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <span className="bg-primary/10 text-primary mx-auto flex size-11 items-center justify-center rounded-full">
            {mode === "login" ? <LogIn className="size-5" aria-hidden /> : <UserPlus className="size-5" aria-hidden />}
          </span>
          <CardTitle>{mode === "login" ? t("account.loginTitle") : t("account.registerTitle")}</CardTitle>
          <CardDescription>{mode === "login" ? t("account.loginText") : t("account.registerText")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg border p-1" role="tablist">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {t(`account.${m === "login" ? "loginButton" : "registerTitle"}`)}
              </button>
            ))}
          </div>
          {mode === "login" ? (
            <form className="space-y-4" onSubmit={submitLogin}>
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("account.email")}</Label>
                <Input id="login-email" type="email" required value={form.email} onChange={set("email")} dir="ltr" className="text-start" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t("account.password")}</Label>
                <Input id="login-password" type="password" required value={form.password} onChange={set("password")} dir="ltr" className="text-start" />
              </div>
              <Button type="submit" className="w-full">
                {t("account.loginButton")}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={submitRegister}>
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">{t("account.name")}</Label>
                <Input id="reg-name" required value={form.name} onChange={set("name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-phone">{t("account.phone")}</Label>
                <Input id="reg-phone" required dir="ltr" inputMode="tel" placeholder="05xxxxxxxx" className="num text-start" value={form.phone} onChange={set("phone")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-email">{t("account.email")}</Label>
                <Input id="reg-email" type="email" dir="ltr" className="text-start" value={form.email} onChange={set("email")} />
              </div>
              {fail ? (
                <p className="text-destructive text-xs" role="alert">
                  {fail}
                </p>
              ) : null}
              <Button type="submit" className="w-full" loading={register.isPending} disabled={!form.name.trim() || !/^05\d{8}$/.test(form.phone.replace(/\s/g, ""))}>
                {t("account.registerTitle")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
