import type { Customer, CustomerSegment, CustomerSource } from "@repo/contracts";
import type { SavedCustomerSegment } from "@repo/api-client";
import { inPeriod } from "@repo/api-client";
import { toHalalas } from "@repo/ui/lib/money";

export const SEGMENTS: CustomerSegment[] = ["new", "returning", "vip", "at_risk"];
export const SOURCES: CustomerSource[] = ["storefront", "whatsapp", "voice", "manual", "import", "app"];

/** URL-state defaults — `segment` accepts an enum value, `preset:<key>` or `saved:<id>`. */
export const DEFAULTS = { segment: "all", city: "all", source: "all", tag: "", consent: "all", minOrders: "", minSpent: "", maxSpent: "", period: "all", q: "" };
export type CustomerFilters = typeof DEFAULTS;
export const MORE_KEYS = ["tag", "consent", "minOrders", "minSpent", "maxSpent", "period"] as const;

/* Preset segments (§5.13+) — computed, no stored state. Applied via `?segment=preset:<key>`. */
export type PresetSegmentKey = "new" | "repeat" | "top_spenders" | "inactive" | "high_order_count";
export const PRESET_SEGMENTS: PresetSegmentKey[] = ["new", "repeat", "top_spenders", "inactive", "high_order_count"];
export const presetParam = (key: PresetSegmentKey) => `preset:${key}`;
export const savedParam = (id: string) => `saved:${id}`;

/** ≥ 5,000 SAR lifetime spend counts as a top spender in the mock segment. */
const TOP_SPENDER_HALALAS = 500_000;
const HIGH_ORDER_COUNT = 5;

export function matchesPreset(key: PresetSegmentKey, c: Customer): boolean {
  const lastActivity = c.stats.lastOrderAt ?? c.createdAt;
  switch (key) {
    case "new":
      return inPeriod(c.createdAt, "30d");
    case "repeat":
      return c.stats.ordersCount >= 2;
    case "top_spenders":
      return c.stats.totalSpent.amount >= TOP_SPENDER_HALALAS;
    case "inactive":
      return !inPeriod(lastActivity, "90d");
    case "high_order_count":
      return c.stats.ordersCount >= HIGH_ORDER_COUNT;
  }
}

function matchesSegmentParam(param: string, c: Customer, saved: SavedCustomerSegment[]): boolean {
  if (param.startsWith("preset:")) {
    const key = param.slice("preset:".length) as PresetSegmentKey;
    return PRESET_SEGMENTS.includes(key) ? matchesPreset(key, c) : true;
  }
  if (param.startsWith("saved:")) {
    const seg = saved.find((s) => s.id === param.slice("saved:".length));
    /* Stale param (segment deleted) → no constraint. The saved map replays its
     * filters recursively with `segment`/`q` stripped so nesting can't cycle. */
    if (!seg) return true;
    return matchesCustomer(c, { ...DEFAULTS, ...seg.filters, segment: "all", q: "" }, saved, "");
  }
  return c.segment === param;
}

/** Single predicate for the list filter, also used to evaluate saved segments. */
export function matchesCustomer(c: Customer, f: CustomerFilters, saved: SavedCustomerSegment[], q: string): boolean {
  if (f.segment !== "all" && !matchesSegmentParam(f.segment, c, saved)) return false;
  if (f.city !== "all" && c.addresses[0]?.city !== f.city) return false;
  if (f.source !== "all" && c.source !== f.source) return false;
  if (f.tag && !c.tags.includes(f.tag)) return false;
  if (f.consent !== "all" && c.marketingConsent.whatsapp !== (f.consent === "yes")) return false;
  if (f.minOrders && c.stats.ordersCount < Number(f.minOrders)) return false;
  if (f.minSpent && c.stats.totalSpent.amount < toHalalas(f.minSpent)) return false;
  if (f.maxSpent && c.stats.totalSpent.amount > toHalalas(f.maxSpent)) return false;
  if (f.period !== "all" && (!c.stats.lastOrderAt || !inPeriod(c.stats.lastOrderAt, f.period))) return false;
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (c.name ?? "").toLowerCase().includes(q) || (digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits)) || (c.email ?? "").toLowerCase().includes(q);
}

/** Filters serialized into a saved segment — `segment`/`q` stay session-level. */
export function filtersForSegment(f: CustomerFilters): Record<string, string> {
  const { segment: _s, q: _q, ...rest } = f;
  return Object.fromEntries(Object.entries(rest).filter(([k, v]) => v !== DEFAULTS[k as keyof typeof rest]));
}

export const hasActiveFilters = (f: CustomerFilters) =>
  Object.entries(f).some(([k, v]) => v !== DEFAULTS[k as keyof CustomerFilters]);
