import type { Address, Coupon } from "@repo/contracts";

export interface Line { variantId: string; productId: string; name: string; sku: string; image: string | undefined; quantity: number; unitPrice: number; basePrice: number; available: number | null }
export const PAYMENT_OPTIONS = ["payment_link", "cod", "bank_transfer", "external"] as const;
export type PaymentOption = (typeof PAYMENT_OPTIONS)[number];
export const PHONE_RE = /^(\+9665|05)\d{8}$/;
export const normalizePhone = (p: string) => p.replace(/\s/g, "").replace(/^05/, "+9665");

export function couponDiscount(c: Coupon | undefined, subtotal: number, shipping: number) {
  if (!c || c.status !== "active") return { amount: 0, error: c ? "inactive" : null };
  if (c.minOrderAmount && subtotal < c.minOrderAmount.amount) return { amount: 0, error: "min" };
  if (c.type === "free_shipping") return { amount: shipping, error: null };
  const raw = c.type === "percentage" ? Math.round((subtotal * c.value) / 100) : c.value;
  return { amount: Math.min(raw, c.maxDiscount?.amount ?? raw, subtotal), error: null };
}

export const EMPTY_ADDRESS = { recipientName: "", phone: "", city: "الرياض" as Address["city"], district: "", street: "" };
export type NewAddressDraft = typeof EMPTY_ADDRESS;
