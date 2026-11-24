"use client";

import * as React from "react";
import { useStoreProducts } from "@/lib/store-product";
import type { StoreProduct } from "@/lib/store-product";

export const COMPARE_KEY = "nakhla-compare";
export const COMPARE_MAX = 4;

export type CompareResult = "added" | "removed" | "max" | "category";

interface CompareContextValue {
  items: StoreProduct[];
  count: number;
  has: (productId: string) => boolean;
  /** Toggle a product; reports `max` / `category` violations for the caller to toast. */
  add: (product: StoreProduct) => CompareResult;
  remove: (productId: string) => void;
  clear: () => void;
}

const CompareContext = React.createContext<CompareContextValue | null>(null);

/** Compare tray — max 4 products, all from the same category, persisted locally. */
export function CompareProvider({ children }: { children: React.ReactNode }) {
  const { data: products } = useStoreProducts();
  const [ids, setIds] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPARE_KEY);
      const saved = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(saved)) setIds(saved.filter((x): x is string => typeof x === "string").slice(0, COMPARE_MAX));
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (hydrated) localStorage.setItem(COMPARE_KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  const value = React.useMemo<CompareContextValue>(() => {
    const items = ids.flatMap((id) => {
      const p = products?.find((x) => x.id === id);
      return p ? [p] : [];
    });
    return {
      items,
      count: items.length,
      has: (id) => ids.includes(id),
      add: (p) => {
        if (ids.includes(p.id)) {
          setIds(ids.filter((x) => x !== p.id));
          return "removed";
        }
        if (ids.length >= COMPARE_MAX) return "max";
        const first = items[0];
        if (first && first.categoryId !== p.categoryId) return "category";
        setIds([...ids, p.id]);
        return "added";
      },
      remove: (id) => setIds(ids.filter((x) => x !== id)),
      clear: () => setIds([]),
    };
  }, [ids, products]);

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = React.useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}
