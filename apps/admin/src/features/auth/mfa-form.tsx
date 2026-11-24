"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { AuthShell } from "./auth-shell";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/, "mfa.errors.length"),
});

type Values = z.infer<typeof schema>;

export function MfaForm() {
  const t = useTranslations("mfa");
  const mt = useMsgToast();
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 500));
    router.push("/");
  };

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("code")}</FormLabel>
                <FormControl>
                  <Input
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.5em]"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
            {t("submit")}
          </Button>
        </form>
      </Form>
      <div className="mt-6 flex items-center justify-between text-sm">
        <button type="button" className="text-primary font-medium hover:underline" onClick={() => mt.success("auth.otp.resent")}>
          {t("resend")}
        </button>
        <Link href="/login" className="text-muted-foreground hover:underline">
          {t("back")}
        </Link>
      </div>
    </AuthShell>
  );
}
