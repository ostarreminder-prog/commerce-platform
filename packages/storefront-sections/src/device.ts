"use client";

import * as React from "react";
import type { SectionSettings, ThemeDevice, ThemeSection } from "./types";

/** Viewport breakpoints — mobile <md, tablet md–lg, desktop ≥lg. */
const QUERIES: [ThemeDevice, string][] = [
  ["desktop", "(min-width: 1024px)"],
  ["tablet", "(min-width: 768px) and (max-width: 1023.98px)"],
  ["mobile", "(max-width: 767.98px)"],
];

export function deviceForWidth(width: number): ThemeDevice {
  return width >= 1024 ? "desktop" : width >= 768 ? "tablet" : "mobile";
}

/**
 * Current viewport device — undefined until mounted so SSR/first paint renders
 * the CSS-media-query fallback (`visibilityClasses`) instead of JS-filtering.
 */
export function useDevice(): ThemeDevice | undefined {
  const [device, setDevice] = React.useState<ThemeDevice | undefined>(undefined);
  React.useEffect(() => {
    const lists = QUERIES.map(([d, q]) => [d, window.matchMedia(q)] as const);
    const update = () => setDevice(lists.find(([, m]) => m.matches)?.[0] ?? "mobile");
    update();
    lists.forEach(([, m]) => m.addEventListener("change", update));
    return () => lists.forEach(([, m]) => m.removeEventListener("change", update));
  }, []);
  return device;
}

/** Tailwind classes that hide the section on the breakpoints it disables. */
export function visibilityClasses(visibility: ThemeSection["visibility"]): string {
  if (!visibility) return "";
  const m = visibility.mobile !== false;
  const t = visibility.tablet !== false;
  const d = visibility.desktop !== false;
  if (m && t && d) return "";
  if (!m && !t && !d) return "hidden";
  const parts: string[] = m ? [] : ["hidden"];
  if (m !== t) parts.push(t ? "md:block" : "md:hidden");
  if (t !== d) parts.push(d ? "lg:block" : "lg:hidden");
  return parts.join(" ");
}

export const isVisibleOnDevice = (section: ThemeSection, device: ThemeDevice | undefined): boolean =>
  !device || section.visibility?.[device] !== false;

/** True when `key` holds a per-device override map rather than a primitive. */
const isOverrideKey = (key: string): key is "mobile" | "tablet" => key === "mobile" || key === "tablet";

/**
 * Effective settings for a device: base values + `settings[device]` overrides.
 * The reserved `mobile`/`tablet` keys are stripped from the result.
 */
export function resolveDeviceSettings(settings: SectionSettings, device: ThemeDevice | undefined): SectionSettings {
  const base: SectionSettings = {};
  for (const [key, value] of Object.entries(settings)) {
    /* Arrays are primitive settings; only the mobile/tablet override maps are objects. */
    if (!isOverrideKey(key) && (typeof value !== "object" || Array.isArray(value))) base[key] = value;
  }
  const overrides = device && device !== "desktop" ? settings[device] : undefined;
  if (overrides && typeof overrides === "object") {
    for (const [key, value] of Object.entries(overrides)) {
      if (typeof value !== "object" || Array.isArray(value)) base[key] = value;
    }
  }
  return base;
}
