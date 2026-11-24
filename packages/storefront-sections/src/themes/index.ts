import type { Theme } from "@repo/contracts";
import { perfumeTheme } from "./perfume";
import { fashionTheme } from "./fashion";
import { genericTheme } from "./generic";

export { perfumeTheme, fashionTheme, genericTheme };

/** Perfume is the default/active theme — keep it first. */
export const themes: Theme[] = [perfumeTheme, fashionTheme, genericTheme];
