import type { ActorRef, EntityRef, ISODate, LocalizedText, MediaRef, Money } from "../common";
import type { Address } from "./entities-customer";

/* 4.8 Order */
export type OrderChannel = "storefront" | "whatsapp" | "voice" | "manual" | "app";
export type PaymentMethod = "card" | "mada" | "apple_pay" | "stc_pay" | "cod" | "bank_transfer" | "payment_link" | "gift_card";
export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "failed"
  | "cod_pending"
  | "cod_collected";
export type FulfillmentStatus = "unfulfilled" | "processing" | "shipped" | "delivered" | "returned" | "cancelled";
export type OrderStatus = "needs_action" | "in_progress" | "completed" | "cancelled";
export type CancelReason = "customer_request" | "out_of_stock" | "fraud" | "payment_failed" | "other";

export interface OrderItem {
  id: string;
  variantId: string;
  productId: string;
  productName: LocalizedText;
  variantLabel: string | null;
  sku: string;
  image: MediaRef | null;
  quantity: number;
  unitPrice: Money;
  discount: Money;
  tax: Money;
  lineTotal: Money;
  fulfilledQty: number;
  returnedQty: number;
  /** Units already refunded — per-item refund cap is `quantity - refundedQty`. */
  refundedQty: number;
}

export type OrderEventType =
  | "created"
  | "paid"
  | "payment_failed"
  | "status_changed"
  | "shipment_created"
  | "shipment_updated"
  | "delivered"
  | "refunded"
  | "note_added"
  | "invoice_issued"
  | "message_sent"
  | "return_requested"
  | "cancelled"
  | "edited"
  | "digital_delivered"
  | "loyalty_earned";

export interface OrderEvent {
  id: string;
  type: OrderEventType;
  actor: ActorRef;
  at: ISODate;
  data: Record<string, string | number>;
  link: EntityRef | null;
}

export interface Order {
  id: string;
  number: number;
  customerId: string;
  channel: OrderChannel;
  agentId: string | null;
  conversationId: string | null;
  /** Referral code the order was attributed to (null = direct sale). */
  affiliateCode: string | null;
  /** Warehouse the stock was committed from (multi-location inventory). */
  locationId: string | null;
  items: OrderItem[];
  shippingAddress: Address;
  /** Billing snapshot — null means "same as shipping" (most storefront orders). */
  billingAddress: Address | null;
  shippingMethod: { carrier: string; service: string; price: Money; etaDays: number } | null;
  couponCode: string | null;
  subtotal: Money;
  discountTotal: Money;
  shippingTotal: Money;
  taxTotal: Money;
  total: Money;
  pricesIncludeTax: boolean;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Optional gift-wrap charge (storefront checkout) — included in `total`. */
  giftWrapFee?: Money | null;
  fulfillmentStatus: FulfillmentStatus;
  status: OrderStatus;
  customerNote: string | null;
  internalNotes: { text: string; actor: ActorRef; at: ISODate }[];
  tags: string[];
  invoiceId: string | null;
  shipmentIds: string[];
  returnIds: string[];
  events: OrderEvent[];
  createdAt: ISODate;
  paidAt: ISODate | null;
  cancelledAt: ISODate | null;
  cancelReason: { code: CancelReason; text: string } | null;
}

/* 4.9 Return */
export type ReturnReason = "damaged" | "wrong_item" | "not_as_described" | "size_issue" | "changed_mind" | "other";
/* `info_requested` = merchant asked the customer for more details before deciding. */
export type ReturnStatus = "requested" | "info_requested" | "approved" | "rejected" | "in_transit" | "received" | "refunded" | "closed";

export type ReturnEventType = "created" | "status_changed" | "info_requested" | "note_added";

export interface ReturnEvent {
  id: string;
  type: ReturnEventType;
  actor: ActorRef;
  at: ISODate;
  data: Record<string, string | number>;
}

export interface Return {
  id: string;
  number: number;
  orderId: string;
  customerId: string;
  items: { orderItemId: string; quantity: number; reason: ReturnReason }[];
  reason: ReturnReason;
  customerNote: string | null;
  photos: MediaRef[];
  status: ReturnStatus;
  resolution: "refund" | "exchange" | "store_credit" | null;
  refundAmount: Money | null;
  restock: boolean;
  returnShipmentId: string | null;
  rejectionReason: string | null;
  creditNoteId: string | null;
  /** Refund created by returns.refund — links the money movement back. */
  refundId: string | null;
  /** Warehouse inspection outcome once the parcel is received (mock: auto-passed). */
  inspectionStatus: "pending" | "passed" | "failed" | null;
  /** When restocked units were written back to inventory (null = not restocked). */
  restockedAt: ISODate | null;
  /** Per-return activity log (review actions, info requests, staff notes). */
  events: ReturnEvent[];
  createdAt: ISODate;
}

/* 4.10 Payment / Refund */
export interface Payment {
  id: string;
  orderId: string;
  amount: Money;
  method: PaymentMethod;
  status: "pending" | "authorized" | "captured" | "failed" | "voided";
  provider: string;
  providerRef: string;
  cardBrand: string | null;
  cardLast4: string | null;
  failureReason: string | null;
  /** Last payment-gateway webhook event applied to this payment (dedupe anchor). */
  webhookEventId: string | null;
  createdAt: ISODate;
}

export interface Refund {
  id: string;
  paymentId: string;
  orderId: string;
  amount: Money;
  reason: string;
  status: "pending" | "succeeded" | "failed";
  /** Itemized refund — which order lines (and how many units) were refunded. */
  items: { orderItemId: string; quantity: number }[];
  /** Whether the refunded units were written back to stock. */
  restock: boolean;
  /** Gateway-side refund reference (mock: synthetic `re_*`). */
  gatewayRef: string | null;
  /** Client-supplied dedupe key — replaying the same key returns the existing refund. */
  idempotencyKey: string | null;
  /** Set when the refund originated from a return (returns.refund). */
  returnId: string | null;
  actor: ActorRef;
  approvedBy: ActorRef | null;
  createdAt: ISODate;
}

/* 4.11 Shipment */
export type ShipmentStatus =
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed_attempt"
  | "returned"
  | "cancelled";

export interface Shipment {
  id: string;
  orderId: string;
  customerId: string;
  type: "outbound" | "return";
  carrier: string;
  service: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  /** Carrier shipping-label number — printed on the label next to the tracking code. */
  labelNumber: string | null;
  items: { orderItemId: string; quantity: number }[];
  packages: { weightGrams: number; dimensionsCm: { l: number; w: number; h: number } }[];
  codAmount: Money | null;
  status: ShipmentStatus;
  events: { status: ShipmentStatus; location: string; description: string; at: ISODate }[];
  estimatedDelivery: string | null;
  cost: Money;
}

/* 4.12 Invoice */
export interface Invoice {
  id: string;
  number: string;
  type: "simplified" | "standard" | "credit_note";
  orderId: string;
  returnId: string | null;
  customerId: string;
  customer: { name: string; vatNumber: string | null };
  lines: { description: string; quantity: number; unitPrice: Money; vat: Money; total: Money }[];
  subtotal: Money;
  vatAmount: Money;
  total: Money;
  issuedAt: ISODate;
  qrCode: string;
  pdfUrl: string;
  zatcaStatus: "pending" | "reported" | "cleared" | "rejected";
  zatcaErrors: string[];
  relatedInvoiceId: string | null;
}
