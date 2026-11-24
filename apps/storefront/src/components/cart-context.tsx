"use client";

import * as React from "react";
import { defaultVariant, useStoreProducts } from "@/lib/store-product";
import type { StoreProduct, StoreVariant } from "@/lib/store-product";

export interface CartLine {
  /** Stable line id — `${productId}|${variantId}`. */
  key: string;
  product: StoreProduct;
  variant: StoreVariant;
  qty: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  /** Add `qty` of a product; `variantId` defaults to the first in-stock variant. */
  add: (productId: string, qty?: number, variantId?: string) => void;
  setQty: (lineKey: string, qty: number) => void;
  remove: (lineKey: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "nakhla-cart";
const CartContext = React.createContext<CartContextValue | null>(null);
export const FREE_SHIPPING_FROM = 20000;
export const SHIPPING_FEE = 2500;

/** Line key separator — legacy entries were bare product ids and resolve to the default variant. */
const lineKey = (productId: string, variantId: string) => `${productId}|${variantId}`;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: products } = useStoreProducts();
  const [items, setItems] = React.useState<Record<string, number>>({});
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as Record<string, number>);
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const value = React.useMemo<CartContextValue>(() => {
    const lines = Object.entries(items).flatMap(([key, qty]) => {
      const [pid, vid = ""] = key.split("|");
      const product = products?.find((p) => p.id === pid);
      if (!product) return [];
      const variant = product.variants.find((v) => v.id === vid) ?? defaultVariant(product);
      return variant ? [{ key: lineKey(product.id, variant.id), product, variant, qty }] : [];
    });
    /* Stock cap for a line — untracked variants are uncapped. */
    const capOf = (variant: StoreVariant) => (variant.trackInventory ? variant.stock : Number.MAX_SAFE_INTEGER);
    return {
      lines,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * l.variant.price, 0),
      ready: hydrated && Boolean(products),
      add: (id, qty = 1, variantId) => {
        const product = products?.find((p) => p.id === id);
        const variant = (variantId ? product?.variants.find((v) => v.id === variantId) : undefined) ?? (product ? defaultVariant(product) : undefined);
        if (!product || !variant) return;
        const key = lineKey(id, variant.id);
        setItems((s) => {
          const cap = Math.max(capOf(variant), s[key] ?? 0);
          const next = Math.min((s[key] ?? 0) + qty, cap);
          return next <= 0 ? s : { ...s, [key]: next };
        });
      },
      setQty: (key, qty) =>
        setItems((s) => {
          if (qty <= 0) return Object.fromEntries(Object.entries(s).filter(([k]) => k !== key));
          const line = lines.find((l) => l.key === key);
          return { ...s, [key]: Math.min(qty, line ? Math.max(1, capOf(line.variant)) : qty) };
        }),
      remove: (key) =>
        setItems((s) => Object.fromEntries(Object.entries(s).filter(([k]) => k !== key))),
      clear: () => setItems({}),
    };
  }, [items, products, hydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
