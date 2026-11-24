import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FooterExtras } from "./footer-extras";
import { FooterMenu } from "./store-menus";

/** Quick-service links — the static store pages (offers/track/returns…). */
const LINKS = [
  { href: "/offers", key: "offers" },
  { href: "/brands", key: "brands" },
  { href: "/faq", key: "faq" },
  { href: "/contact", key: "contact" },
  { href: "/track", key: "track" },
  { href: "/returns/request", key: "returns" },
  { href: "/gift-cards", key: "giftCards" },
] as const;

export async function StoreFooter() {
  const t = await getTranslations("store");
  return (
    <footer className="bg-muted/40 mt-16 border-t">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-2">
          <p className="text-lg font-bold">{t("name")}</p>
          <p className="text-muted-foreground text-sm">{t("footer.about")}</p>
        </div>
        {/* Merchant footer menu — mirrors admin /storefront/menus (location: footer). */}
        <FooterMenu />
        <div className="space-y-2 text-sm">
          <p className="font-semibold">{t("footer.services")}</p>
          <ul className="text-muted-foreground space-y-1.5">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-foreground transition-colors">
                  {t(`footer.links.${l.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <FooterExtras />
        <div className="text-muted-foreground space-y-1.5 text-sm">
          <p className="font-semibold">{t("footer.payShip")}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["mada", "Apple Pay", "STC Pay", "Tabby", "Visa", "أرامكس", "سمسا"].map((m) => (
              <span key={m} className="bg-background rounded border px-2 py-1 text-[11px] font-semibold">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-muted-foreground border-t py-4 text-center text-xs">
        © 2026 {t("name")} · {t("footer.rights")}
      </p>
    </footer>
  );
}
