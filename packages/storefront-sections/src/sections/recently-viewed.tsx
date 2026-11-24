"use client";

import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { numSetting, SectionProductCard, useLocalized } from "./helpers";

/**
 * Horizontal strip of the visitor's last-viewed products. Ids come from
 * `SectionData.recentlyViewedIds` (localStorage-backed in the storefront);
 * editor previews without ids fall back to the newest active products.
 */
export function RecentlyViewedSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const s = section.settings;
  const L = useLocalized(s);
  const { products, pickProduct, recentlyViewedIds } = useSectionData();

  const limit = Math.min(10, Math.max(1, numSetting(s, "limit", 8)));
  const seen = new Set<string>();
  const recent = (recentlyViewedIds ?? [])
    .map(pickProduct)
    .filter((p): p is NonNullable<typeof p> => {
      if (!p || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  /* Preview/fallback: without a visitor history show the newest actives. */
  const list = (recent.length ? recent : [...products].filter((p) => p.status === "active").reverse()).slice(0, limit);
  if (!list.length) return null;

  return (
    <section className="sec-pad">
      <div className="container">
        {L("title") ? <h2 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">{L("title")}</h2> : null}
        <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2" aria-label={t("recentlyViewedLabel")}>
          {list.map((p) => (
            <SectionProductCard key={p.id} product={p} className="w-40 shrink-0 sm:w-48" />
          ))}
        </div>
      </div>
    </section>
  );
}
