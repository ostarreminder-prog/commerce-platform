"use client";

import type { Menu, MenuItem } from "@repo/contracts";
import { useSectionData, type SectionData } from "./data-context";

/** First menu assigned to a chrome location (header/footer). */
export const menuByLocation = (menus: Menu[] | undefined, location: Menu["location"]): Menu | undefined =>
  menus?.find((m) => m.location === location);

/**
 * Resolve a menu item to an href using section context data:
 * `url` → the stored url, `page` → `/pages/<slug>`, `category` → `/c/<slug>`,
 * `product` → `/products/<slug-or-id>`, `collection` → `/search?collection=<slug>`
 * (no dedicated collection route exists yet). Unresolvable items fall back to `#`.
 */
export function menuItemHref(item: MenuItem, data: Pick<SectionData, "pages" | "collections" | "pickCategory" | "pickProduct">): string {
  const target = item.targetId ?? "";
  switch (item.linkType) {
    case "url":
      return item.url?.trim() || "#";
    case "page": {
      const slug = data.pages?.find((p) => p.id === target)?.slug;
      return slug ? `/pages/${slug}` : "#";
    }
    case "category": {
      const slug = data.pickCategory(target)?.slug;
      return slug ? `/c/${slug}` : "#";
    }
    case "product": {
      const product = data.pickProduct(target);
      return product ? `/products/${product.slug || product.id}` : "#";
    }
    case "collection": {
      const slug = data.collections?.find((c) => c.id === target)?.slug ?? target;
      return slug ? `/search?collection=${encodeURIComponent(slug)}` : "#";
    }
    default:
      return "#";
  }
}

/** Bound resolver — reads pages/collections/pickers from the section context. */
export function useMenuLinks() {
  const data = useSectionData();
  return (item: MenuItem) => menuItemHref(item, data);
}
