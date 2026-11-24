import type { Coupon } from "@repo/contracts";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";

export const COUPON_TYPES: Coupon["type"][] = ["percentage", "fixed", "free_shipping"];

export function couponValue(c: Coupon, locale: "ar" | "en") {
  if (c.type === "percentage") return `${formatNumber(c.value)}%`;
  if (c.type === "fixed") return formatMoney(c.value, locale);
  return null;
}
