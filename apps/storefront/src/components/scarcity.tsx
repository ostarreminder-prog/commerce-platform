"use client";

import { Flame } from "lucide-react";
import { useTranslations } from "next-intl";
import type { StoreProduct } from "@/lib/store-product";
import { formatNumber } from "@repo/ui/lib/format";
import { useStoreFeatures } from "@/lib/features";

/** "باقي X قطعة" — renders when 0 < stock <= the theme's scarcity threshold. */
export function ScarcityBadge({ product }: { product: StoreProduct }) {
  const t = useTranslations("store");
  const { on, scarcityThreshold } = useStoreFeatures();
  if (!on("scarcity") || product.stock <= 0 || product.stock > scarcityThreshold) return null;
  return (
    <span className="text-warning flex items-center gap-1 text-xs font-medium">
      <Flame className="size-3" aria-hidden />
      {t("onlyLeft", { count: formatNumber(product.stock) })}
    </span>
  );
}

/** Deterministic fake "يشاهده الآن X" count seeded per product id (spec: fake count is fine). */
export function ViewersNow({ seed }: { seed: string }) {
  const t = useTranslations("store");
  const { on } = useStoreFeatures();
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  const count = 4 + (hash % 28);
  if (!on("viewersNow")) return null;
  return <span className="text-muted-foreground text-xs">{t("watchingNow", { count: formatNumber(count) })}</span>;
}
