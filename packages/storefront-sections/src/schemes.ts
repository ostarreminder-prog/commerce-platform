import type { CSSProperties } from "react";
import type { ColorScheme } from "./types";
import { hexToHslTriplet } from "@repo/ui/lib/color";

/**
 * Color scheme → CSS var scope. Sections consume semantic tokens
 * (`bg-background`, `text-foreground`, `bg-primary`…), so remapping the token
 * vars on a wrapper re-skins a section without touching its markup.
 * `buttonBg`/`buttonText` drive `--primary`/`--primary-foreground`; `accent`
 * feeds `--accent` with the scheme text as its foreground.
 */
export function schemeStyleVars(scheme: ColorScheme): CSSProperties {
  const vars: Record<string, string> = {};
  const assign = (token: string, hex: string) => {
    const hsl = hexToHslTriplet(hex);
    if (hsl) vars[token] = hsl;
  };
  assign("--background", scheme.background);
  assign("--foreground", scheme.text);
  assign("--card", scheme.background);
  assign("--card-foreground", scheme.text);
  assign("--popover", scheme.background);
  assign("--popover-foreground", scheme.text);
  assign("--primary", scheme.buttonBg);
  assign("--primary-foreground", scheme.buttonText);
  assign("--accent", scheme.accent);
  assign("--accent-foreground", scheme.text);
  assign("--muted", scheme.accent);
  return vars as CSSProperties;
}

/** Resolve a section's `colorScheme` setting to a scheme record. */
export function findScheme(schemes: ColorScheme[] | undefined, id: unknown): ColorScheme | undefined {
  if (typeof id !== "string" || !id) return undefined;
  return schemes?.find((s) => s.id === id);
}
