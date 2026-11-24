/**
 * "#rrggbb" (or "#rgb") → "H S% L%" triplet matching the globals.css token
 * format. Shared by the storefront theme-css helper and the section renderer's
 * color-scheme scoping.
 */
export function hexToHslTriplet(hex: string): string | null {
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim())?.[1];
  if (!match) return null;
  const raw = match.length === 3 ? match.split("").map((c) => c + c).join("") : match;
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return `0 0% ${Math.round(l * 100)}%`;
  const d = max - min;
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (max === r) h = 60 * (((g - b) / d) % 6);
  else if (max === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  if (h < 0) h += 360;
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** True when `value` is a usable hex color string. */
export const isHexColor = (value: string): boolean => hexToHslTriplet(value) !== null;
