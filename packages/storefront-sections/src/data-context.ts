"use client";

import * as React from "react";
import type { Category, Collection, Menu, Page, Product } from "@repo/contracts";
import type { Locale } from "@repo/ui/lib/format";
import type { ColorScheme, PreviewPersona, ThemeDevice, ThemeGlobals } from "./types";

/** Entity the surrounding page is about — editor pick / storefront route param. */
export interface PreviewEntity {
  type: "product" | "category" | "page";
  id: string;
}

export interface SectionData {
  products: Product[];
  categories: Category[];
  menus: Menu[];
  /** CMS pages — header/footer resolve `linkType: "page"` menu items to `/pages/<slug>`. */
  pages?: Page[];
  /** Collections — resolve `linkType: "collection"` menu items to `/search?collection=<slug>`. */
  collections?: Collection[];
  /** Store display name used when a header section doesn't set its own. */
  storeName?: string;
  /** Theme globals (announcement bar, logo position, radius…). */
  globals?: ThemeGlobals;
  /** Theme color schemes — sections pick one via their `colorScheme` setting. */
  colorSchemes?: ColorScheme[];
  /**
   * Device the preview renders for. When set it wins over `useDevice()`;
   * when absent the renderer resolves the real viewport via matchMedia.
   */
  device?: ThemeDevice;
  /** Context entity (e.g. the product a `main-product` section renders). */
  previewEntity?: PreviewEntity;
  /** Editor "preview as" toggle — guest / signed-in customer / cart with items. */
  previewPersona?: PreviewPersona;
  /** Visitor's last-viewed product ids (newest first) — feeds the `recently-viewed` section. */
  recentlyViewedIds?: string[];
  locale: Locale;
  pickProduct: (id: string) => Product | undefined;
  pickCategory: (id: string) => Category | undefined;
}

const EMPTY: SectionData = {
  products: [],
  categories: [],
  menus: [],
  locale: "ar",
  pickProduct: () => undefined,
  pickCategory: () => undefined,
};

const SectionDataContext = React.createContext<SectionData>(EMPTY);

export interface SectionDataProviderProps extends Omit<SectionData, "pickProduct" | "pickCategory"> {
  children: React.ReactNode;
}

/**
 * Apps inject their data here (api-client hooks in the storefront,
 * editor state in admin). This package never imports @repo/mocks or
 * @repo/api-client itself.
 */
export function SectionDataProvider({
  products,
  categories,
  menus,
  pages,
  collections,
  storeName,
  globals,
  colorSchemes,
  device,
  previewEntity,
  previewPersona,
  recentlyViewedIds,
  locale,
  children,
}: SectionDataProviderProps) {
  const value = React.useMemo<SectionData>(() => {
    const byId = <T extends { id: string }>(list: T[]) => {
      const map = new Map(list.map((x) => [x.id, x]));
      return (id: string) => map.get(id);
    };
    return {
      products,
      categories,
      menus: menus ?? [],
      pages,
      collections,
      storeName,
      globals,
      colorSchemes,
      device,
      previewEntity,
      previewPersona,
      recentlyViewedIds,
      locale,
      pickProduct: byId(products),
      pickCategory: byId(categories),
    };
  }, [products, categories, menus, pages, collections, storeName, globals, colorSchemes, device, previewEntity, previewPersona, recentlyViewedIds, locale]);
  return React.createElement(SectionDataContext.Provider, { value }, children);
}

export function useSectionData(): SectionData {
  return React.useContext(SectionDataContext);
}
