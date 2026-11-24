import type { CSSProperties } from "react";
import type { ThemeGlobals } from "@repo/storefront-sections";
import { hexToHslTriplet } from "@repo/ui/lib/color";

/**
 * Theme globals → inline styles applied on a wrapper element (pair it with the
 * `sec-scope` class so `--font-heading`/`--sec-density` reach sections).
 * `--primary` / `--radius` are the design-token CSS vars consumed by the
 * tailwind preset, so sections re-theme automatically. `fontFamily` maps
 * `globals.font` ("default" | "cairo" | "tajawal" | "ibm") to font CSS vars
 * loaded in the root layout ("default"/"ibm" inherit --font-sans).
 */
const FONT_STACKS: Record<string, string> = {
  cairo: "var(--font-cairo), var(--font-sans), sans-serif",
  tajawal: "var(--font-tajawal), var(--font-sans), sans-serif",
};

const DENSITY: Record<ThemeGlobals["spacing"], string> = {
  compact: "0.75",
  normal: "1",
  relaxed: "1.25",
};

export function themeCssVars(globals?: ThemeGlobals): CSSProperties {
  const vars: Record<string, string> = {};
  if (globals) {
    const primary = hexToHslTriplet(globals.primaryColor);
    if (primary) vars["--primary"] = primary;
    if (typeof globals.radius === "number") vars["--radius"] = `${globals.radius}px`;
    const heading = FONT_STACKS[globals.headingFont] ?? FONT_STACKS[globals.font];
    if (heading) vars["--font-heading"] = heading;
    vars["--sec-density"] = DENSITY[globals.spacing] ?? "1";
  }
  return {
    ...(vars as CSSProperties),
    fontFamily: globals ? FONT_STACKS[globals.font] : undefined,
  };
}
