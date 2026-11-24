import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ApiProvider } from "@repo/api-client/provider";
import { UIProviders } from "@repo/ui/components/providers";
import { getDirection } from "@repo/ui/lib/i18n";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: t("title"), template: `%s · ${t("title")}` },
    description: t("description"),
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#11151c" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const dir = getDirection(locale);
  return (
    <html lang={locale} dir={dir} className={plexArabic.variable} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <ApiProvider>
            <UIProviders dir={dir}>{children}</UIProviders>
          </ApiProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
