import type { ActorRef, EntityRef, ISODate, LocalizedText, MediaRef, Money, Phone } from "../common";

/* 4.13 Coupon / Promotion */
export type CouponStatus = "scheduled" | "active" | "expired" | "disabled";

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  /** Percent (1–100) for percentage, halalas for fixed. */
  value: number;
  maxDiscount: Money | null;
  minOrderAmount: Money | null;
  appliesTo: { type: "all" | "products" | "categories" | "collections"; ids: string[] };
  excludeSaleItems: boolean;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
  customerEligibility: { type: "all" | "new" | "specific"; customerIds: string[] };
  startsAt: ISODate;
  endsAt: ISODate | null;
  status: CouponStatus;
  stats: { uses: number; revenue: Money; discountGiven: Money };
  /** Per-order usage rows shown on the coupon detail screen (§5.13). */
  usages: { orderId: string; customerId: string | null; at: ISODate; discount: Money; orderTotal: Money }[];
  createdBy: ActorRef;
}

export type PromotionType = "percentage" | "fixed_amount" | "free_shipping" | "buy_x_get_y";

export interface Promotion {
  id: string;
  name: LocalizedText;
  type: PromotionType;
  status: CouponStatus;
  /** The benefit: percent (1–100) or halalas; free_shipping/buy_x_get_y use `config`. */
  benefit: { kind: "percentage" | "amount" | "free_shipping" | "buy_x_get_y"; value: number | null };
  /** buy_x_get_y config (buy quantity → free quantity). */
  config: { buy: number; get: number } | null;
  startsAt: ISODate;
  endsAt: ISODate | null;
  stats: { orders: number; revenue: Money };
  createdBy: ActorRef;
}

/* 4.14 AbandonedCart */
export type RecoveryStatus = "not_contacted" | "message_sent" | "recovered" | "lost";
export type CartSource = "storefront" | "instagram" | "google" | "whatsapp" | "direct";

export interface RecoveryAttempt {
  channel: "whatsapp" | "sms" | "email";
  at: ISODate;
  agentId: string | null;
  opened: boolean;
  /** Recovery template used (null = ad-hoc message). */
  templateId?: string | null;
  /** Exact message body sent — kept so the cart's activity log shows what went out. */
  message?: string | null;
}

export interface AbandonedCart {
  id: string;
  customerId: string | null;
  phone: Phone;
  items: { variantId: string; productId: string; name: LocalizedText; image: MediaRef | null; quantity: number; price: Money }[];
  total: Money;
  abandonedAt: ISODate;
  /** Where the visit that built this cart came from (utm-ish classification). */
  source: CartSource;
  recoveryStatus: RecoveryStatus;
  recoveryAttempts: RecoveryAttempt[];
  recoveredOrderId: string | null;
}

/** Editable cart-recovery message template (mock — no real template engine). */
export interface RecoveryTemplate {
  id: string;
  name: LocalizedText;
  channel: RecoveryAttempt["channel"];
  content: LocalizedText;
  enabled: boolean;
}
/* 5.11 Imports */
export interface ImportJob {
  id: string;
  type: "products" | "customers" | "inventory";
  source: "file" | "salla" | "zid";
  fileName: string;
  status: "processing" | "completed" | "failed";
  rowsSucceeded: number;
  rowsFailed: number;
  errorFileUrl: string | null;
  /** Product ids created/updated by a products import — powers `/products?import=<id>`. */
  productIds?: string[];
  actor: ActorRef;
  at: ISODate;
}

/* 8. In-app notifications */
export type AdminNotificationEvent =
  | "order_created"
  | "payment_failed"
  | "conversation_waiting"
  | "approval_requested"
  | "low_stock"
  | "shipments_delayed"
  | "invoice_rejected"
  | "return_requested"
  | "app_installed"
  | "usage_limit";

export interface AdminNotification {
  id: string;
  event: AdminNotificationEvent;
  params: Record<string, string | number>;
  href: string;
  /** The entity the notification points at — powers the EntityLink on /notifications. */
  ref: EntityRef | null;
  at: ISODate;
  read: boolean;
  archived: boolean;
}

/** Delivery channels the merchant can toggle per event (`/notifications` prefs). */
export type NotificationPrefChannel = "inapp" | "whatsapp" | "email" | "sms";

/**
 * Merchant notification preferences — which channels fire per admin event.
 * Only `inapp` is delivered for real (the bell + /notifications); the rest are
 * stored honestly as the merchant's choice until real delivery exists.
 */
export interface NotificationPreferences {
  matrix: Record<AdminNotificationEvent, Record<NotificationPrefChannel, boolean>>;
}
