"use client";

import { useLocale } from "next-intl";
import type { Locale } from "../lib/format";
import { getDirection, resolveLocale } from "../lib/i18n";

export function useAppLocale(): { locale: Locale; dir: "rtl" | "ltr" } {
  const locale = resolveLocale(useLocale());
  return { locale, dir: getDirection(locale) };
}
