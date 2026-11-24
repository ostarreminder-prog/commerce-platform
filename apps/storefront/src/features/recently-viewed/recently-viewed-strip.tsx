"use client";

import { useTranslations } from "next-intl";
import { useStoreProducts } from "@/lib/store-product";
import { ProductCard } from "@/components/product-card";
import { useStoreFeatures } from "@/lib/features";
import { useRecentlyViewedIds } from "@/lib/recently-viewed";

/**
 * "شاهدت مؤخراً" horizontal strip (last 10 ids from localStorage).
 * `excludeId` drops the product the visitor is currently looking at (PDP).
 */
export function RecentlyViewedStrip({ excludeId }: { excludeId?: string }) {
  const t = useTranslations("store");
  const { on } = useStoreFeatures();
  const ids = useRecentlyViewedIds();
  const { data: products } = useStoreProducts();

  if (!on("recentlyViewed")) return null;
  const list = ids
    .filter((id) => id !== excludeId)
    .flatMap((id) => {
      const p = products?.find((x) => x.id === id && x.status === "active");
      return p ? [p] : [];
    })
    .slice(0, 10);
  if (!list.length) return null;

  return (
    <section className="space-y-5" aria-label={t("recentlyViewed")}>
      <h2 className="text-xl font-bold">{t("recentlyViewed")}</h2>
      <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} className="w-40 shrink-0 sm:w-48" />
        ))}
      </div>
    </section>
  );
}
