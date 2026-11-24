"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { SectionCommerceProvider, type SectionCommerceAdapter } from "@repo/storefront-sections";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useStoreFeatures } from "@/lib/features";
import { useStoreProducts, type StoreProduct } from "@/lib/store-product";
import { QuickViewDialog } from "@/features/product/quick-view-dialog";
import { useCart } from "./cart-context";
import { useWishlist } from "./wishlist-context";

/**
 * Wires the theme-engine's commerce adapter to the real storefront contexts —
 * section product cards/experiences gain cart, wishlist and quick-view actions
 * plus client-side product links. Mount it inside any theme-rendered tree.
 */
export function SectionCommerceBridge({ children }: { children: React.ReactNode }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const cart = useCart();
  const wishlist = useWishlist();
  const { on } = useStoreFeatures();
  const { data: storeProducts = [] } = useStoreProducts();
  const [quickViewProduct, setQuickViewProduct] = React.useState<StoreProduct | null>(null);

  const adapter = React.useMemo<SectionCommerceAdapter>(
    () => ({
      linkComponent: Link,
      productHref: (p) => `/products/${p.id}`,
      addToCart: (p, options) => {
        cart.add(p.id, options?.qty ?? 1, options?.variantId);
        toast.success(t("added"), { description: p.name[locale] ?? p.name.ar });
      },
      inCart: (productId, variantId) =>
        cart.lines.some((l) => l.product.id === productId && (!variantId || l.variant.id === variantId)),
      wishlist: on("wishlist")
        ? {
            has: wishlist.has,
            toggle: (p: Product) => {
              const saved = wishlist.toggle(p.id);
              toast.success(saved ? t("wishlist.added") : t("wishlist.removed"), { description: p.name[locale] ?? p.name.ar });
            },
          }
        : undefined,
      quickView: on("quickView")
        ? (p) => {
            const storeProduct = storeProducts.find((x) => x.id === p.id);
            if (storeProduct) setQuickViewProduct(storeProduct);
          }
        : undefined,
    }),
    [cart, wishlist, on, storeProducts, t, locale],
  );

  return (
    <SectionCommerceProvider adapter={adapter}>
      {children}
      {quickViewProduct ? (
        <QuickViewDialog product={quickViewProduct} open onOpenChange={(v) => !v && setQuickViewProduct(null)} />
      ) : null}
    </SectionCommerceProvider>
  );
}
