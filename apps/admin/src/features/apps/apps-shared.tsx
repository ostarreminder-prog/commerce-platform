"use client";

import type { App } from "@repo/contracts";
import type { Locale } from "@repo/ui/lib/format";
import { formatMoney } from "@repo/ui/lib/format";

/** Fixture icons encode the brand hue as `placeholder:<hue>` (same as product media). */
export const appHue = (a: App): number => {
  const hue = Number(a.icon?.url.replace("placeholder:", ""));
  return Number.isFinite(hue) ? hue : 210;
};

export function AppIcon({ app, locale, size = "size-12" }: { app: App; locale: Locale; size?: string }) {
  const hue = appHue(app);
  const name = app.name[locale] ?? app.name.ar;
  return (
    <span
      className={`text-paper flex ${size} shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-sm`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 50%), hsl(${(hue + 30) % 360} 70% 40%))` }}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  );
}

/** Returns the `apps.*` price key + params — callers pass them to their namespaced `t`. */
export function priceLabel(app: App, locale: Locale): { key: "free" | "perMonth" | "oneTime" | "usageBased"; params?: { price: string } } {
  const p = app.pricing;
  if (p.type === "free" || !p.price) return { key: "free" };
  const price = formatMoney(p.price.amount, locale);
  if (p.type === "monthly") return { key: "perMonth", params: { price } };
  if (p.type === "one_time") return { key: "oneTime", params: { price } };
  return { key: "usageBased", params: { price } };
}
