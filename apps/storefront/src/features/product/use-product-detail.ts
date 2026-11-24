"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCategoryList } from "@repo/api-client";
import { defaultVariant, useStoreProducts } from "@/lib/store-product";
import type { StoreProduct, StoreVariant } from "@/lib/store-product";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { useCart } from "@/components/cart-context";
import { COMPARE_MAX, useCompare } from "@/components/compare-context";
import { useWishlist } from "@/components/wishlist-context";
import { useStoreFeatures } from "@/lib/features";
import { pushRecentlyViewed } from "@/lib/recently-viewed";

/**
 * Shared PDP state — variant/qty/stock resolution, cart/wishlist/compare
 * actions and derived lists. Every page-experience layout (classic,
 * immersive, editorial) consumes this so the variants differ only in
 * composition, never in behavior.
 */
export function useProductDetail(p: StoreProduct) {
  const t = useTranslations("store");
  const { locale, dir } = useAppLocale();
  const router = useRouter();
  const { add } = useCart();
  const { on } = useStoreFeatures();
  const wishlist = useWishlist();
  const compare = useCompare();
  const { data: categories = [] } = useCategoryList();
  const { data: all = [] } = useStoreProducts();
  const [qty, setQty] = React.useState(1);
  const [variant, setVariant] = React.useState<StoreVariant | null>(null);
  const [variantError, setVariantError] = React.useState(false);
  const buyRef = React.useRef<HTMLButtonElement | null>(null);
  /* Products with options require a full pick before the order can proceed;
   * single-variant products silently use their one variant. */
  const needsPick = p.product.options.length > 0;
  const effVariant = needsPick ? variant : (variant ?? defaultVariant(p));
  const stock = effVariant ? effVariant.stock : p.stock;
  const price = effVariant?.price ?? p.price;
  const compareAt = effVariant ? effVariant.compareAtPrice : p.compareAtPrice;
  const out = needsPick ? Boolean(variant) && stock <= 0 : stock <= 0;
  const sale = compareAt && compareAt > price ? 1 - price / compareAt : 0;
  const category = categories.find((c) => c.id === p.categoryId);
  const related = all.filter((x) => x.categoryId === p.categoryId && x.id !== p.id && x.status === "active").slice(0, 5);
  /** Commerce-contract variant matching the flat pick — specs need it. */
  const contractVariant = effVariant ? (p.product.variants.find((v) => v.id === effVariant.id) ?? null) : null;

  /* Record the visit for the "شاهدت مؤخراً" strips (last-10 localStorage). */
  React.useEffect(() => {
    pushRecentlyViewed(p.id);
  }, [p.id]);

  const selectVariant = (v: StoreVariant | null) => {
    setVariant(v);
    setVariantError(false);
  };
  const addToCart = (go?: boolean) => {
    if (needsPick && !variant) {
      setVariantError(true);
      return;
    }
    add(p.id, qty, effVariant?.id);
    if (go) router.push("/cart");
    else toast.success(t("added"), { description: variant?.label ? `${(p.name[locale] ?? p.name.ar)} — ${variant.label}` : (p.name[locale] ?? p.name.ar) });
  };
  const toggleWishlist = () => {
    const saved = wishlist.toggle(p.id);
    toast.success(saved ? t("wishlist.added") : t("wishlist.removed"), { description: (p.name[locale] ?? p.name.ar) });
  };
  const toggleCompare = () => {
    const result = compare.add(p);
    if (result === "added") toast.success(t("compare.added"), { description: (p.name[locale] ?? p.name.ar) });
    else if (result === "max") toast.error(t("compare.maxReached", { max: formatNumber(COMPARE_MAX) }));
    else if (result === "category") toast.error(t("compare.sameCategory"));
  };

  return {
    t,
    locale,
    dir,
    on,
    wishlist,
    compare,
    qty,
    setQty,
    variant,
    variantError,
    selectVariant,
    buyRef,
    needsPick,
    effVariant,
    stock,
    price,
    compareAt,
    out,
    sale,
    category,
    related,
    contractVariant,
    addToCart,
    toggleWishlist,
    toggleCompare,
  };
}

export type ProductDetailCtx = ReturnType<typeof useProductDetail>;
