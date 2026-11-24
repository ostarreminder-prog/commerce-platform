"use client";

import type { ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { experienceEntry } from "../experiences/registry";
import { useSectionCommerce } from "../commerce-context";
import { useDevice } from "../device";
import { idsSetting, numSetting, strSetting } from "./helpers";

/**
 * Featured products — delegates its product area to the commerce experience
 * picked via the `view` setting (EXPERIENCE_REGISTRY). `adaptive-grid` is the
 * default and reproduces the classic grid exactly.
 */
export function FeaturedProductsSection({ section }: { section: ThemeSection }) {
  const s = section.settings;
  const { products, pickProduct, device: contextDevice } = useSectionData();
  const viewportDevice = useDevice();
  const adapter = useSectionCommerce();

  const limit = Math.max(1, numSetting(s, "limit", 8));
  const picked = idsSetting(s, "productIds").map(pickProduct).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const list = (picked.length ? picked : products.filter((p) => p.status === "active")).slice(0, limit);

  /* Experience device-rules: too few products → grid; hideOnMobile → nothing. */
  const device = contextDevice ?? viewportDevice;
  let entry = experienceEntry(strSetting(s, "view", "adaptive-grid"));
  const rules = entry.deviceRules;
  if (rules?.hideOnMobile && device === "mobile") return null;
  if (rules?.minProducts && list.length < rules.minProducts) entry = experienceEntry("adaptive-grid");
  const Component = entry.component;

  /* `data-experience` reports the effective view (post device-rules) — used by
   * e2e selectors and future experience analytics. */
  return (
    <div data-experience={entry.id}>
      <Component products={list} section={section} settings={s} adapter={adapter} />
    </div>
  );
}
