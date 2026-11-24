import { SHIPPING_FEE } from "@/components/cart-context";

export const STEPS = ["info", "shipping", "payment"] as const;
export type Step = (typeof STEPS)[number];

export const SHIPPING = [
  { id: "standard", fee: SHIPPING_FEE, etaDays: 3 },
  { id: "express", fee: 4500, etaDays: 1 },
  { id: "pickup", fee: 0, etaDays: 0 },
] as const;
export type ShippingId = (typeof SHIPPING)[number]["id"];

export const PAYMENTS = ["mada", "applePay", "stcPay", "tabby", "cod"] as const;
export type PaymentMethod = (typeof PAYMENTS)[number];
export const COD_FEE = 1500;

/** Gift-wrap add-on — flat VAT-inclusive fee, stored on the order. */
export const GIFT_WRAP_FEE = 1500;

/** Test card that simulates a declined payment at the mock gateway. */
export const DECLINE_CARD = "4000000000000002";

/** Sentinel for the "new address" radio option in the info step. */
export const NEW_ADDRESS = "new";

export interface CheckoutInfo {
  name: string;
  phone: string;
  email: string;
}

/** Address form shown when the "new address" option is picked. */
export interface NewAddress {
  city: string;
  district: string;
  street: string;
}

/** Draft persisted across refreshes so a checkout is never lost mid-flow. */
export interface CheckoutDraft {
  info: CheckoutInfo;
  addressId: string | null;
  newAddr: NewAddress;
  shippingId: ShippingId;
  payment: PaymentMethod;
}

export const DRAFT_KEY = "nakhla-checkout-draft";
