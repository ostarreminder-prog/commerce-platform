"use client";

import { useActiveTheme } from "@repo/api-client";
import { isPageExperience } from "@repo/storefront-sections";

/**
 * Resolved full-page experience for a real route ("product" = PDP,
 * "category" = PLP/search). Reads `theme.pageExperiences` from the published
 * theme; unknown/missing values fall back to `"classic"`.
 */
export function usePageExperience(template: "product" | "category"): string {
  const { data: theme } = useActiveTheme();
  const value = theme?.pageExperiences?.[template];
  return isPageExperience(template, value) ? value : "classic";
}
