"use client";

import type { Coupon, Customer } from "@repo/contracts";
import type { CartLine } from "@/components/cart-context";

export type CouponFail =
  | "invalid"
  | "disabled"
  | "not_started"
  | "expired"
  | "usage_limit"
  | "not_eligible"
  | "min_order"
  | "not_applicable";

export interface CouponResult {
  ok: boolean;
  reason?: CouponFail;
  /** Discount in halalas (0 for free-shipping coupons). */
  discount: number;
  freeShipping: boolean;
  coupon?: Coupon;
}

const COUPON_KEY = "nakhla-coupon";

export const readCouponCode = (): string | null => {
  try {
    return localStorage.getItem(COUPON_KEY);
  } catch {
    return null;
  }
};

export const writeCouponCode = (code: string | null) => {
  try {
    if (code) localStorage.setItem(COUPON_KEY, code);
    else localStorage.removeItem(COUPON_KEY);
  } catch {
    /* storage may be unavailable */
  }
};

/** Subtotal (halalas) of the lines a coupon applies to — before min-order checks. */
const applicableBase = (coupon: Coupon, lines: CartLine[]): number => {
  const { type, ids } = coupon.appliesTo;
  const eligible = lines.filter((l) => {
    if (type === "products") return ids.includes(l.product.id);
    if (type === "categories") return l.product.product.categoryIds.some((c) => ids.includes(c));
    if (type === "collections") return l.product.product.collectionIds.some((c) => ids.includes(c));
    return true;
  });
  const onSale = (l: CartLine) => l.variant.compareAtPrice !== null && l.variant.compareAtPrice > l.variant.price;
  return eligible.filter((l) => !(coupon.excludeSaleItems && onSale(l))).reduce((s, l) => s + l.variant.price * l.qty, 0);
};

/**
 * Storefront coupon evaluation — mirrors the marketing rules on the Coupon
 * contract (status window, usage caps, eligibility, scope, sale exclusion).
 * Pure function so cart + checkout share one source of truth.
 */
export function evaluateCoupon(code: string, coupons: Coupon[], lines: CartLine[], customer: Customer | undefined): CouponResult {
  const coupon = coupons.find((c) => c.code.toLowerCase() === code.trim().toLowerCase());
  if (!coupon) return { ok: false, reason: "invalid", discount: 0, freeShipping: false };
  if (coupon.status === "disabled") return { ok: false, reason: "disabled", discount: 0, freeShipping: false, coupon };
  const now = Date.now();
  if (coupon.status === "scheduled" || +new Date(coupon.startsAt) > now) return { ok: false, reason: "not_started", discount: 0, freeShipping: false, coupon };
  if (coupon.status === "expired" || (coupon.endsAt && +new Date(coupon.endsAt) < now)) return { ok: false, reason: "expired", discount: 0, freeShipping: false, coupon };
  if (coupon.usageLimit !== null && coupon.stats.uses >= coupon.usageLimit) return { ok: false, reason: "usage_limit", discount: 0, freeShipping: false, coupon };
  if (coupon.usageLimitPerCustomer !== null && customer && coupon.usages.filter((u) => u.customerId === customer.id).length >= coupon.usageLimitPerCustomer)
    return { ok: false, reason: "usage_limit", discount: 0, freeShipping: false, coupon };
  const eligibility = coupon.customerEligibility;
  if (customer) {
    if (eligibility.type === "specific" && !eligibility.customerIds.includes(customer.id))
      return { ok: false, reason: "not_eligible", discount: 0, freeShipping: false, coupon };
    if (eligibility.type === "new" && customer.stats.ordersCount > 0) return { ok: false, reason: "not_eligible", discount: 0, freeShipping: false, coupon };
  }
  const base = applicableBase(coupon, lines);
  if (base <= 0) return { ok: false, reason: "not_applicable", discount: 0, freeShipping: false, coupon };
  if (coupon.minOrderAmount && base < coupon.minOrderAmount.amount) return { ok: false, reason: "min_order", discount: 0, freeShipping: false, coupon };
  if (coupon.type === "free_shipping") return { ok: true, discount: 0, freeShipping: true, coupon };
  const discount =
    coupon.type === "percentage"
      ? Math.min(Math.round((base * coupon.value) / 100), coupon.maxDiscount?.amount ?? Number.MAX_SAFE_INTEGER)
      : Math.min(coupon.value, base);
  return { ok: true, discount, freeShipping: false, coupon };
}
