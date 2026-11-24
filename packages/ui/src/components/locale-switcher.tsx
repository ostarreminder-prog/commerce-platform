"use client";

import * as React from "react";
import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "../lib/format";
import { Button } from "./button";

export interface LocaleSwitcherProps {
  onLocaleChange: (locale: Locale) => unknown;
}

const NEXT: Record<Locale, Locale> = { ar: "en", en: "ar" };

/** Toggles between Arabic and English. The app owns persistence (cookie/route). */
export function LocaleSwitcher({ onLocaleChange }: LocaleSwitcherProps) {
  const t = useTranslations("ui.locale");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = React.useTransition();
  const target = NEXT[locale];
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={pending}
      aria-label={t("switchTo", { language: t(target) })}
      onClick={() => startTransition(async () => void (await onLocaleChange(target)))}
    >
      {pending ? null : <Languages aria-hidden />}
      <span lang={target}>{t(target)}</span>
    </Button>
  );
}
