"use client";

import { useActiveTheme } from "@repo/api-client";
import type { ThemeFeature } from "@repo/contracts";

export interface StoreFeatures {
  /** Feature enabled unless the theme explicitly sets it to `false`. */
  on: (key: ThemeFeature) => boolean;
  /** Scarcity "باقي X" threshold — theme featureSettings, default 5. */
  scarcityThreshold: number;
}

/**
 * Reads `Theme.features`/`featureSettings` from the active theme (toggled in
 * the editor's "مميزات المتجر" card). Missing keys default to enabled.
 */
export function useStoreFeatures(): StoreFeatures {
  const { data: theme } = useActiveTheme();
  return {
    on: (key) => theme?.features?.[key] !== false,
    scarcityThreshold: theme?.featureSettings?.scarcityThreshold ?? 5,
  };
}
