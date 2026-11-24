"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { ThemeToggle } from "@repo/ui/components/theme-toggle";
import { setLocale } from "@/actions/locale";

/** Shared centered layout for the standalone auth screens (signup/forgot/mfa/invite). */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const t = useTranslations("login");
  return (
    <div className="flex min-h-dvh flex-col px-6 py-6 sm:px-12">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-lg font-bold">
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">{t("logoInitial")}</span>
          {t("brandName")}
        </span>
        <div className="flex items-center gap-1">
          <LocaleSwitcher onLocaleChange={setLocale} />
          <ThemeToggle />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
        {footer ? <div className="mt-8">{footer}</div> : null}
      </div>
    </div>
  );
}
