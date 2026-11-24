import type { Metadata, Viewport } from "next";
import { Cairo, IBM_Plex_Sans_Arabic, Tajawal } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { ApiProvider } from "@repo/api-client/provider";
import { UIProviders } from "@repo/ui/components/providers";
import { getDirection } from "@repo/ui/lib/i18n";
import { CartProvider } from "@/components/cart-context";
import { CompareProvider } from "@/components/compare-context";
import { SessionProvider } from "@/components/session-context";
import { WishlistProvider } from "@/components/wishlist-context";
import "./globals.css";

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

/** Theme-switchable storefront fonts — referenced by `themeCssVars` via CSS vars. */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});
const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
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
    <html lang={locale} dir={dir} className={`${plexArabic.variable} ${cairo.variable} ${tajawal.variable}`} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>
          <ApiProvider>
            <UIProviders dir={dir} enableDarkMode={false}>
              <SessionProvider>
                <CartProvider>
                  <WishlistProvider>
                    <CompareProvider>{children}</CompareProvider>
                  </WishlistProvider>
                </CartProvider>
              </SessionProvider>
            </UIProviders>
          </ApiProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
