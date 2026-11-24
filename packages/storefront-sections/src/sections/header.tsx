"use client";

import * as React from "react";
import { ChevronDown, Menu as MenuIcon, Search, ShoppingBag, User, X } from "lucide-react";
import type { MenuItem } from "@repo/contracts";
import { Input } from "@repo/ui/components/input";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { isRealImageUrl } from "@repo/ui/lib/media";
import { useTranslations } from "next-intl";
import type { Locale } from "@repo/ui/lib/format";
import type { SectionSettings, ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { menuByLocation, menuItemHref, useMenuLinks } from "../menu-links";
import { boolSetting, strSetting, useLocalized } from "./helpers";

const itemLabel = (item: MenuItem, locale: Locale) => item.label[locale] ?? item.label.ar;

const iconButton = "hover:bg-accent hover:text-accent-foreground inline-flex size-10 items-center justify-center rounded-md";

/** Read-only search input — the storefront wires real search on /search. */
function SearchField({ className }: { className?: string }) {
  const t = useTranslations("msg.sections");
  return (
    <div className={cn("relative", className)}>
      <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
      <Input placeholder={t("search")} aria-label={t("search")} className="bg-muted/50 rounded-full ps-9" readOnly />
    </div>
  );
}

/** Logo mark + store name link. */
function HeaderLogo({ name, logoUrl }: { name: string; logoUrl?: string }) {
  return (
    <a href="/" className="flex items-center gap-2">
      {isRealImageUrl(logoUrl) ? (
        <img src={logoUrl} alt={name} className="h-9 w-auto object-contain" />
      ) : (
        <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-lg font-bold">
          {name.trim().charAt(0) || "·"}
        </span>
      )}
      <span className="text-lg font-bold">{name}</span>
    </a>
  );
}

/** Account + cart icon links, toggled by section settings. */
function HeaderIcons({ s }: { s: SectionSettings }) {
  const t = useTranslations("msg.sections");
  return (
    <>
      {boolSetting(s, "showAccount", true) ? (
        <a href="/account" className={iconButton} aria-label={t("account")}>
          <User className="size-5" aria-hidden />
        </a>
      ) : null}
      {boolSetting(s, "showCart", true) ? (
        <a href="/cart" className={cn(iconButton, "relative")} aria-label={t("cart")}>
          <ShoppingBag className="size-5" aria-hidden />
        </a>
      ) : null}
    </>
  );
}

/** Desktop nav — top-level menu items; children (depth ≤ 2) open a dropdown on hover/focus. */
function HeaderNav({ items, locale, centered }: { items: MenuItem[]; locale: Locale; centered?: boolean }) {
  const href = useMenuLinks();
  if (!items.length) return null;
  return (
    <nav className={cn("container hidden gap-6 pb-3 text-sm md:flex", centered && "justify-center")}>
      {items.map((item) => (
        <div key={item.id} className="group relative">
          <a
            href={href(item)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 py-1 transition-colors"
          >
            {itemLabel(item, locale)}
            {item.children.length ? <ChevronDown className="size-3.5" aria-hidden /> : null}
          </a>
          {item.children.length ? (
            <div className="absolute start-0 top-full z-50 hidden pt-1 group-hover:block group-focus-within:block">
              <div className="bg-popover text-popover-foreground min-w-44 rounded-md border p-1.5 shadow-md">
                {item.children.map((child) => (
                  <a key={child.id} href={href(child)} className="hover:bg-accent block rounded-sm px-3 py-2">
                    {itemLabel(child, locale)}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  );
}

/** Mobile slide-over drawer — same menu items, children indented. */
function MobileDrawer({ open, onClose, items, locale, title }: { open: boolean; onClose: () => void; items: MenuItem[]; locale: Locale; title: string }) {
  const t = useTranslations("msg.sections");
  const data = useSectionData();
  if (!open) return null;
  const href = (item: MenuItem) => menuItemHref(item, data);
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t("menu")}>
      <button type="button" className="bg-overlay/50 absolute inset-0" onClick={onClose} aria-label={t("closeMenu")} />
      <div className="bg-background absolute inset-y-0 start-0 flex w-72 max-w-[85vw] flex-col border-e shadow-xl">
        <div className="flex items-center justify-between gap-2 border-b p-4">
          <span className="truncate font-semibold">{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeMenu")}
            className="hover:bg-accent inline-flex size-9 shrink-0 items-center justify-center rounded-md"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <nav className="overflow-y-auto p-2">
          {items.map((item) => (
            <div key={item.id}>
              <a
                href={href(item)}
                onClick={onClose}
                className="hover:bg-accent block rounded-md px-3 py-2.5 text-sm font-medium"
              >
                {itemLabel(item, locale)}
              </a>
              {item.children.map((child) => (
                <a
                  key={child.id}
                  href={href(child)}
                  onClick={onClose}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground ms-4 block rounded-md px-3 py-2 text-sm"
                >
                  {itemLabel(child, locale)}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function HeaderSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);
  const { menus, storeName, globals } = useSectionData();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const name = L("storeName") || storeName || "";
  const announcement = L("announcement") || globals?.announcementBar || "";
  const variant = strSetting(s, "headerVariant", "default");
  /* `default` still honours the legacy globals.logoPosition === "center" flag. */
  const centered = variant === "centered" || (variant === "default" && globals?.logoPosition === "center");
  const prominent = variant === "search-prominent";
  const showSearch = boolSetting(s, "showSearch", true);
  const logoUrl = globals?.logo;
  const items = boolSetting(s, "showNav", true) ? (menuByLocation(menus, "header")?.items ?? []) : [];

  const menuButton = items.length ? (
    <button type="button" onClick={() => setDrawerOpen(true)} aria-label={t("menu")} className={cn(iconButton, "md:hidden")}>
      <MenuIcon className="size-5" aria-hidden />
    </button>
  ) : null;

  return (
    <header className={cn("bg-background/95 border-b backdrop-blur", boolSetting(s, "sticky", true) && "sticky top-0 z-40")}>
      {boolSetting(s, "showAnnouncement", true) && announcement ? (
        <p className="bg-primary text-primary-foreground px-4 py-1.5 text-center text-xs font-medium">{announcement}</p>
      ) : null}
      {centered ? (
        /* centered: logo in the middle, nav row below — icons split to both ends. */
        <div className="container flex h-16 items-center">
          <div className="flex flex-1 items-center gap-1">
            {menuButton}
            {showSearch ? (
              <a href="/search" className={cn(iconButton, "hidden md:inline-flex")} aria-label={t("search")}>
                <Search className="size-5" aria-hidden />
              </a>
            ) : null}
          </div>
          <HeaderLogo name={name} logoUrl={logoUrl} />
          <div className="flex flex-1 items-center justify-end gap-1">
            <HeaderIcons s={s} />
          </div>
        </div>
      ) : (
        /* default + search-prominent: logo | search | icons. */
        <div className="container flex h-16 items-center gap-4">
          {menuButton}
          <HeaderLogo name={name} logoUrl={logoUrl} />
          {showSearch ? (
            <SearchField className={cn("mx-auto hidden w-full md:block", prominent ? "max-w-2xl flex-1" : "max-w-md")} />
          ) : null}
          <div className="ms-auto flex items-center gap-1">
            <HeaderIcons s={s} />
          </div>
        </div>
      )}
      {prominent && showSearch ? (
        /* search-prominent keeps a full-width search row on mobile (سلة/نون style). */
        <div className="container pb-3 md:hidden">
          <SearchField className="w-full" />
        </div>
      ) : null}
      <HeaderNav items={items} locale={locale} centered={centered} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} items={items} locale={locale} title={name} />
    </header>
  );
}
