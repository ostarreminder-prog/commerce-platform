"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { MailCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { AuthShell } from "./auth-shell";

const schema = z.object({
  email: z.string().min(1, "forgot.errors.required").email("forgot.errors.invalidEmail"),
});

type Values = z.infer<typeof schema>;

export function ForgotForm() {
  const t = useTranslations("forgot");
  const mt = useMsgToast();
  const [sent, setSent] = React.useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 600));
    mt.success("auth.forgot.sent");
    setSent(true);
  };

  return (
    <AuthShell title={sent ? t("sentTitle") : t("title")} subtitle={sent ? mt.text("auth.forgot.sent") : t("subtitle")}>
      {sent ? (
        <div className="space-y-5">
          <div className="bg-muted text-muted-foreground flex items-center gap-3 rounded-md px-4 py-3 text-sm">
            <MailCheck className="text-primary size-5 shrink-0" aria-hidden />
            <span dir="ltr">{form.getValues("email")}</span>
          </div>
          <Button variant="outline" className="w-full" onClick={() => void onSubmit()}>
            {t("resend")}
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
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
            <Button type="submit" className="w-full" loading={form.formState.isSubmitting}>
              {t("submit")}
            </Button>
          </form>
        </Form>
      )}
      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="text-primary font-medium hover:underline">
          {t("back")}
        </Link>
      </p>
    </AuthShell>
  );
}
