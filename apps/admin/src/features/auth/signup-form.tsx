"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { AuthShell } from "./auth-shell";

const schema = z.object({
  name: z.string().min(1, "signup.errors.required"),
  email: z.string().min(1, "signup.errors.required").email("signup.errors.invalidEmail"),
  password: z.string().min(8, "signup.errors.tooShort"),
});

type Values = z.infer<typeof schema>;

export function SignupForm() {
  const t = useTranslations("signup");
  const mt = useMsgToast();
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 800));
    mt.success("auth.otp.sent", { phone: form.getValues("email") });
    router.push("/signup/verify");
  };

  return (
    <AuthShell
      title={t("title")}
      subtitle={t("subtitle")}
      footer={
        <>
          <p className="text-muted-foreground text-center text-sm">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              {t("login")}
            </Link>
          </p>
          <p className="text-muted-foreground mt-4 text-center text-xs">{t("terms")}</p>
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("email")}</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" dir="ltr" className="text-start" {...field} />
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
                <FormLabel>{t("password")}</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input type={showPassword ? "text" : "password"} autoComplete="new-password" dir="ltr" className="pe-10 text-start" {...field} />
                  </FormControl>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute end-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {t("submit")}
          </Button>
        </form>
      </Form>
    </AuthShell>
  );
}
