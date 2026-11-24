import type { Theme } from "@repo/contracts";
import { themes as sectionThemes } from "@repo/storefront-sections/themes";

/**
 * Storefront themes (perfume/fashion/generic) live in @repo/storefront-sections/themes
 * so the admin editor and the storefront share the same fixtures. Perfume is first = active.
 */
export const themes: Theme[] = sectionThemes;
