import type {
  ActorRef, Collection, Coupon, ImportJob, Invoice, KnowledgeSource, MediaRef, Order, Page, Phone, Product, ProductStatus, Promotion, ReturnReason, Shipment, ShipmentStatus, Slug, Variant,
} from "@repo/contracts";
import type { spec } from "@repo/mocks";

export interface ShipmentInput {
  carrier: string;
  service: string;
  weightGrams: number;
  items?: { orderItemId: string; quantity: number }[];
  packages?: Shipment["packages"];
  pickupDate?: string;
  cost?: number;
}

/** Carrier-scan update — status transition + optional scan location / staff note
 * that lands in the shipment timeline event description. */
export interface ShipmentStatusInput {
  status: ShipmentStatus;
  location?: string;
  note?: string;
}

/** Carrier returned/assigned a real tracking code after the label was created. */
export interface TrackingInput {
  trackingNumber: string;
  trackingUrl?: string | null;
}

/** One submission attempt to the (mock) ZATCA gateway — kept in a side-table so
 * the Invoice contract stays untouched; `result` mirrors the status the gateway
 * came back with, `detail` carries the rejection reason on failures. */
export interface ZatcaAttempt {
  id: string;
  invoiceId: string;
  at: string;
  actor: ActorRef;
  result: Invoice["zatcaStatus"];
  detail: string | null;
}
export type CartRecoverySettings = typeof spec.cartRecoverySettings;

/** Merchant-saved customer segment — a named snapshot of the /customers filter
 * state (the `useUrlState` map minus `q`/`segment`). Applied via `?segment=saved:<id>`. */
export interface SavedCustomerSegment {
  id: string;
  name: string;
  filters: Record<string, string>;
  createdAt: string;
}

export interface RefundInput {
  amount: number;
  reason: string;
  restock: boolean;
  items: { orderItemId: string; quantity: number }[];
  /** Dedupe key — a replayed request returns the stored refund instead of double-refunding. */
  idempotencyKey?: string;
}

/** orders.edit — replaces the item set and re-derives totals (order-math).
 * Same shape as the item lines of NewOrderInput; existing lines are matched by
 * variantId so fulfilled/returned/refunded counters carry over. */
export interface EditOrderInput {
  items: { variantId: string; quantity: number; unitPrice?: number }[];
  discount: number;
  shippingFee: number;
}

export interface NewReturnInput {
  orderId: string;
  items: { orderItemId: string; quantity: number; reason: ReturnReason }[];
  reason: ReturnReason;
  customerNote?: string;
  /** Mock attachment uploads — pre-uploaded MediaRefs. */
  photos?: MediaRef[];
}

export interface SendRecoveryInput {
  templateId?: string | null;
  message?: string;
  channel?: "whatsapp" | "sms" | "email";
}

export interface NewOrderInput {
  customerId: string;
  items: { variantId: string; quantity: number; unitPrice?: number }[];
  addressId: string;
  shippingFee: number;
  discount: number;
  paymentMethod: Order["paymentMethod"];
  /** Channel the order came through — admin defaults to "manual", storefront checkout passes "storefront". */
  channel?: Order["channel"];
  markPaid?: boolean;
  shipping?: { carrier: string; service: string; etaDays: number };
  couponCode?: string | null;
  internalNote: string;
  sendPaymentLink: boolean;
  sendConfirmation?: boolean;
  conversationId?: string | null;
  /** Warehouse the order stock commits from — defaults to the default location. */
  locationId?: string | null;
  /** Gift card code applied as (part-)payment — deducts balance, idempotent. */
  giftCardCode?: string | null;
  /** Loyalty points to burn as an extra discount. */
  loyaltyPoints?: number;
  /** Affiliate referral code — attributes the order + accrues commission. */
  affiliateCode?: string | null;
  /** Free-text note the customer wrote at checkout (stored on `Order.customerNote`). */
  customerNote?: string | null;
  /** Gift-wrap add-on — `fee` (halalas) is charged on top of the order total. */
  giftWrap?: { fee: number } | null;
}

/** Guest order tracking (`/track`) — order number + the phone it was placed with. */
export interface OrderLookupInput {
  number: number;
  phone: string;
}

/** Public contact form (`/contact`) — opens a webchat conversation in the inbox. */
export interface NewConversationInput {
  name: string;
  phone: Phone;
  message: string;
  /** Optional order the message refers to — linked on the conversation. */
  orderId?: string | null;
}

/** Newsletter footer signup — recorded honestly, no real delivery yet. */
export interface NewsletterInput {
  contact: string;
  channel: "email" | "whatsapp";
}
export interface NewsletterSubscriber extends NewsletterInput {
  id: string;
  at: string;
}

export interface ProductInput {
  id?: string;
  /** Optional storefront slug — sanitized via slugify; on create it falls back to the name. */
  slug?: Slug;
  name: { ar: string; en?: string };
  description: { ar: string; en?: string };
  shortDescription: { ar: string; en?: string };
  status: ProductStatus;
  categoryIds: string[];
  collectionIds: string[];
  brand: string | null;
  tags: string[];
  requiresShipping: boolean;
  taxable: boolean;
  aiNotes: string;
  seo: { title: string; description: string };
  options: Product["options"];
  variants: (Omit<Variant, "id"> & { id?: string })[];
  media: Product["media"];
}
export interface BrandInput {
  id?: string;
  name: { ar: string; en?: string };
  description: { ar: string; en?: string };
  logo: MediaRef | null;
  website: string | null;
  status: "active" | "archived";
}
export interface CategoryInput {
  id?: string;
  name: { ar: string; en?: string };
  description: { ar: string; en?: string };
  parentId: string | null;
  sortOrder: number;
  seo: { title: string; description: string };
  image?: MediaRef | null;
}
export interface CollectionInput {
  id?: string;
  name: { ar: string; en?: string };
  description: { ar: string; en?: string };
  type: Collection["type"];
  productIds: string[];
  rules: Collection["rules"];
  match: Collection["match"];
  seo: { title: string; description: string };
  image?: MediaRef | null;
}
export interface CouponInput {
  id?: string;
  code: string;
  type: Coupon["type"];
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  appliesTo: Coupon["appliesTo"];
  excludeSaleItems: boolean;
  usageLimit: number | null;
  usageLimitPerCustomer: number | null;
  customerEligibility: Coupon["customerEligibility"];
  startsAt: string;
  endsAt: string | null;
}
export interface PromotionInput {
  id?: string;
  name: { ar: string; en: string };
  type: Promotion["type"];
  benefit: Promotion["benefit"];
  config: Promotion["config"];
  startsAt: string;
  endsAt: string | null;
}
export interface ImportInput {
  type: ImportJob["type"];
  source: ImportJob["source"];
  fileName: string;
  updateExisting: boolean;
}
export interface KnowledgeInput {
  type: KnowledgeSource["type"];
  title: string;
  detail: string;
  faq?: { q: string; a: string }[];
}
export interface PageInput {
  id?: string;
  title: { ar: string; en?: string };
  slug: Slug;
  content: { ar: string; en?: string };
  seo: { title: string; description: string };
  status: Page["status"];
  showInMenu: boolean;
  /** Custom theme template id — landing pages render it instead of plain content. */
  templateId?: string | null;
}
export interface RedirectInput {
  from: string;
  to: string;
}
export type ConversationMessageInput =
  | { type: "text"; content: string }
  | { type: "internal_note"; content: string }
  | { type: "product_card"; productId: string }
  | { type: "payment_link"; orderId?: string }
  | { type: "image" | "document"; content?: string; attachments: MediaRef[] }
  | { type: "template"; content: string };
