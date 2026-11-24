import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { LOCALE_COOKIE, TIME_ZONE, resolveLocale } from "@repo/ui/lib/i18n";
import uiAr from "@repo/ui/messages/ar.json";
import uiEn from "@repo/ui/messages/en.json";
import appAr from "../../messages/ar.json";
import appEn from "../../messages/en.json";

const messages = {
  ar: { ...uiAr, ...appAr },
  en: { ...uiEn, ...appEn },
};

export default getRequestConfig(async () => {
  const locale = resolveLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  return { locale, messages: messages[locale], timeZone: TIME_ZONE };
});
