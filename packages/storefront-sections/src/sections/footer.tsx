"use client";

import { Instagram, type LucideIcon, Mail, Music2, Send, Twitter, Youtube } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { isRealImageUrl } from "@repo/ui/lib/media";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import type { MenuItem } from "@repo/contracts";
import type { Locale } from "@repo/ui/lib/format";
import type { ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { menuByLocation, menuItemHref, useMenuLinks } from "../menu-links";
import { boolSetting, strSetting, useLocalized } from "./helpers";

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  x: Twitter,
  tiktok: Music2,
  snapchat: Send,
  youtube: Youtube,
  whatsapp: Mail,
};

const itemLabel = (item: MenuItem, locale: Locale) => item.label[locale] ?? item.label.ar;

/** One footer link column built from a top-level menu item. */
function FooterColumn({ item, locale }: { item: MenuItem; locale: Locale }) {
  const href = useMenuLinks();
  const links = item.children.length ? item.children : [item];
  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold">{itemLabel(item, locale)}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.id}>
            <a href={href(link)} className="text-muted-foreground hover:text-foreground transition-colors">
              {itemLabel(link, locale)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FooterSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);
  const data = useSectionData();
  const { storeName, globals } = data;
  const href = (item: MenuItem) => menuItemHref(item, data);
  const logoUrl = globals?.logo;

  const footerMenu = menuByLocation(data.menus, "footer");
  const topItems = footerMenu?.items ?? [];
  const columnCount = Number(strSetting(s, "columns", "3")) || 3;
  /* Items with children → titled columns; leaf items collect under one links column. */
  const columns = topItems.filter((i) => i.children.length).slice(0, columnCount);
  const flatLinks = topItems.filter((i) => !i.children.length);
  const about = L("about");
  const year = new Date().getFullYear();
  const socialLinks = section.blocks.filter((b) => b.type === "social-link" && b.settings.url);

  return (
    <footer className="bg-muted/40 mt-auto border-t">
      <div className="container grid gap-10 sec-pad sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {isRealImageUrl(logoUrl) ? (
              <img src={logoUrl} alt={L("storeName") || storeName || ""} className="h-9 w-auto object-contain" />
            ) : (
              <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-lg font-bold">
                {(L("storeName") || storeName || "·").trim().charAt(0)}
              </span>
            )}
            <span className="text-lg font-bold">{L("storeName") || storeName}</span>
          </div>
          {about ? <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">{about}</p> : null}
          {boolSetting(s, "showSocial", true) && socialLinks.length ? (
            <div className="flex gap-2">
              {socialLinks.map((block) => {
                const platform = block.settings.platform ?? "";
                const Icon = SOCIAL_ICONS[platform] ?? Send;
                return (
                  <a
                    key={block.id}
                    href={block.settings.url}
                    className="bg-background hover:bg-accent inline-flex size-9 items-center justify-center rounded-full border"
                    aria-label={platform}
                  >
                    <Icon className="size-4" aria-hidden />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
        {columns.map((item) => (
          <FooterColumn key={item.id} item={item} locale={locale} />
        ))}
        {flatLinks.length ? (
          <div>
            <h3 className="mb-4 text-sm font-semibold">{t("links")}</h3>
            <ul className="space-y-2.5 text-sm">
              {flatLinks.map((item) => (
                <li key={item.id}>
                  <a href={href(item)} className="text-muted-foreground hover:text-foreground transition-colors">
                    {itemLabel(item, locale)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {boolSetting(s, "showNewsletter", false) ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{L("newsletterTitle") || t("subscribe")}</h3>
            <div className="flex gap-2">
              <Input placeholder={L("placeholder") || t("email")} aria-label={t("email")} className="bg-background" readOnly />
              <Button size="sm" className="shrink-0">
                {L("buttonLabel") || t("subscribe")}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="border-t py-5">
        <p className="text-muted-foreground container text-center text-xs">{L("copyright") || t("copyrightFallback", { year })}</p>
      </div>
    </footer>
  );
}
