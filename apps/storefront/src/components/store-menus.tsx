"use client";

import * as React from "react";
import Link from "next/link";
import { useCategoryList, useCollectionList, useMenus, usePageList, useProductList } from "@repo/api-client";
import type { Menu, MenuItem } from "@repo/contracts";
import { menuByLocation, menuItemHref } from "@repo/storefront-sections";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";

/**
 * Merchant menus (admin `/storefront/menus`) rendered on the real storefront
 * chrome. Link resolution mirrors the theme header/footer sections:
 * page → /pages/<slug>, category → /c/<slug>, product → /products/<id>,
 * collection → /search?collection=<slug>, url → as stored.
 */
function useMenuResolver() {
  const { data: pages = [] } = usePageList();
  const { data: categories = [] } = useCategoryList();
  const { data: collections = [] } = useCollectionList();
  const { data: products = [] } = useProductList();
  const { locale } = useAppLocale();
  const data = React.useMemo(
    () => ({
      pages,
      collections,
      pickCategory: (id: string) => categories.find((c) => c.id === id),
      pickProduct: (id: string) => products.find((p) => p.id === id),
    }),
    [pages, collections, categories, products],
  );
  const label = React.useCallback(
    (item: MenuItem) => item.label[locale] || item.label.ar,
    [locale],
  );
  const href = React.useCallback((item: MenuItem) => menuItemHref(item, data), [data]);
  return { label, href };
}

const useMenu = (location: Menu["location"]) => {
  const { data: menus = [] } = useMenus();
  return menuByLocation(menus, location);
};

function MenuLink({ item, href, className, children }: { item: MenuItem; href: string; className?: string; children?: React.ReactNode }) {
  const external = item.linkType === "url" && /^https?:\/\//.test(href);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  /* mailto:/tel: are safe URI schemes — render as plain anchors. */
  if (/^(mailto|tel):/.test(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  /* Anything that isn't root-relative or an anchor is unsafe — render it inert
   * rather than emitting e.g. a `javascript:` href. */
  const safe = href.startsWith("/") || href.startsWith("#") ? href : "#";
  return (
    <Link href={safe} className={className}>
      {children}
    </Link>
  );
}

/** Header nav strip — top-level items of the "header" menu (children render as a dropdown). */
export function HeaderMenu() {
  const menu = useMenu("header");
  const { label, href } = useMenuResolver();
  if (!menu || menu.items.length === 0) return null;
  return (
    <>
      {menu.items.map((item) => {
        const url = href(item);
        if (item.children.length === 0) {
          return (
            <MenuLink key={item.id} item={item} href={url} className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
              {label(item)}
            </MenuLink>
          );
        }
        return (
          <div key={item.id} className="group relative shrink-0">
            <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">
              {label(item)}
            </button>
            <ul className="bg-popover absolute start-0 top-full z-50 hidden min-w-44 rounded-lg border py-1 shadow-md group-hover:block group-focus-within:block">
              {item.children.map((child) => (
                <li key={child.id}>
                  <MenuLink item={child} href={href(child)} className="text-muted-foreground hover:text-foreground hover:bg-accent block px-4 py-2 text-sm">
                    {label(child)}
                  </MenuLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </>
  );
}

/** Footer columns built from the "footer" menu — parent label = column title. */
export function FooterMenu({ className }: { className?: string }) {
  const menu = useMenu("footer");
  const { label, href } = useMenuResolver();
  if (!menu || menu.items.length === 0) return null;
  return (
    <>
      {menu.items.map((group) => (
        <div key={group.id} className={cn("space-y-2 text-sm", className)}>
          <p className="font-semibold">{label(group)}</p>
          <ul className="text-muted-foreground space-y-1.5">
            {group.children.map((child) => (
              <li key={child.id}>
                <MenuLink item={child} href={href(child)} className="hover:text-foreground transition-colors">
                  {label(child)}
                </MenuLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
