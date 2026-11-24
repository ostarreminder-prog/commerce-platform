"use client";

import * as React from "react";
import { readWishlist, writeWishlist } from "@/lib/wishlist";

interface WishlistContextValue {
  ids: string[];
  count: number;
  has: (productId: string) => boolean;
  /** Toggle a product; returns whether it ended up saved. */
  toggle: (productId: string) => boolean;
}

const WishlistContext = React.createContext<WishlistContextValue | null>(null);

/**
 * Guest wishlist backed by localStorage.
 * TODO(auth): when the visitor logs in, merge `readWishlist()` into the
 * customer account wishlist server-side, then clear the local copy.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = React.useState<string[]>([]);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    setIds(readWishlist());
    setHydrated(true);
  }, []);

  const value = React.useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: hydrated ? ids.length : 0,
      has: (id) => ids.includes(id),
      toggle: (id) => {
        const saved = !ids.includes(id);
        setIds((cur) => {
          const next = saved ? [...cur, id] : cur.filter((x) => x !== id);
          writeWishlist(next);
          return next;
        });
        return saved;
      },
    }),
    [ids, hydrated],
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = React.useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
