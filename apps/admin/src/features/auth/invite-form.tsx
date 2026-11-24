"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { AuthShell } from "./auth-shell";

const schema = z.object({
  name: z.string().min(1, "invite.errors.required"),
  password: z.string().min(8, "invite.errors.tooShort"),
});

type Values = z.infer<typeof schema>;

// Mock invite payload — a real backend resolves inviter/store/role from the token.
const INVITE = { inviter: "خالد العتيبي", store: "متجر نخلة", role: "خدمة العملاء" };

export function InviteForm({ token }: { token: string }) {
  const t = useTranslations("invite");
  const mt = useMsgToast();
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", password: "" },
  });

  const onSubmit = async () => {
    await new Promise((r) => setTimeout(r, 700));
    mt.success("auth.invite.accepted", { store: INVITE.store });
    router.push("/");
  };

  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <div className="bg-muted/60 mb-6 flex items-start gap-3 rounded-md px-4 py-3 text-sm" data-invite={token}>
        <UserPlus className="text-primary mt-0.5 size-5 shrink-0" aria-hidden />
        <div className="space-y-1">
          <p>{mt.text("auth.invite.title", { inviter: INVITE.inviter, store: INVITE.store })}</p>
          <p className="text-muted-foreground">{mt.text("auth.invite.body", { role: INVITE.role })}</p>
        </div>
      </div>
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("password")}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" dir="ltr" className="text-start" {...field} />
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
    </AuthShell>
  );
}
