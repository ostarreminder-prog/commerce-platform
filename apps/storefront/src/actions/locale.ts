"use server";

import { cookies } from "next/headers";
import type { Locale } from "@repo/ui/lib/format";
import { LOCALE_COOKIE, resolveLocale } from "@repo/ui/lib/i18n";

export async function setLocale(locale: Locale) {
  (await cookies()).set(LOCALE_COOKIE, resolveLocale(locale), {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
