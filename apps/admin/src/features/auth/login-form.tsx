"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Eye, EyeOff, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { Separator } from "@repo/ui/components/separator";
import { ThemeToggle } from "@repo/ui/components/theme-toggle";
import { setLocale } from "@/actions/locale";

const schema = z.object({
  email: z.string().min(1, "login.errors.required").email("login.errors.invalidEmail"),
  password: z.string().min(6, "login.errors.tooShort"),
  remember: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const t = useTranslations("login");
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "khalid@nakhla.sa", password: "", remember: true },
  });
  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    router.push("/");
  };
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-lg font-bold">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              {t("logoInitial")}
            </span>
            {t("brandName")}
          </span>
          <div className="flex items-center gap-1">
            <LocaleSwitcher onLocaleChange={setLocale} /> <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground text-sm">{t("subtitle")}</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        autoComplete="email"
                        dir="ltr"
                        className="text-start"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>{t("password")}</FormLabel>
                      <Link
                        href="/login"
                        className="text-primary text-xs font-medium hover:underline"
                      >
                        {t("forgot")}
                      </Link>
                    </div>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          dir="ltr"
                          className="pe-10 text-start"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute end-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2"
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" aria-hidden />
                        ) : (
                          <Eye className="size-4" aria-hidden />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="remember"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <Label className="font-normal">{t("remember")}</Label>
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
                {t("submit")}
              </Button>
            </form>
          </Form>
          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs">{t("or")}</span>
            <Separator className="flex-1" />
          </div>
          <Button variant="outline" className="w-full">
            <Smartphone aria-hidden /> {t("withPhone")}
          </Button>
          <p className="text-muted-foreground mt-8 text-center text-sm">
            {t("noAccount")}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("createStore")}
            </Link>
          </p>
          <p className="bg-muted text-muted-foreground mt-6 rounded-md px-3 py-2 text-center text-xs">
            {t("demoHint")}
          </p>
        </div>
      </div>
      <div className="bg-primary text-primary-foreground relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-end lg:p-12">
        <div aria-hidden className="bg-paper/5 absolute -end-24 -top-24 size-96 rounded-full" />
        <div aria-hidden className="bg-paper/5 absolute -start-16 top-1/3 size-64 rounded-full" />
        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-semibold leading-tight">{t("brandTitle")}</h2>
          <p className="text-primary-foreground/80">{t("brandSubtitle")}</p>
          <ul className="space-y-3">
            {(["agents", "payments", "shipping"] as const).map((k) => (
              <li key={k} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="size-5 shrink-0 opacity-80" aria-hidden />
                {t(`brandPoints.${k}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
