import type { ISODate, LocalizedText } from "@repo/contracts";

/* Raw seed shapes used only to *generate* the commerce spec fixtures in
 * `spec/index.ts` — never exported to consumers (the old legacy layer). */

export interface SeedCategory {
  id: string;
  name: LocalizedText;
}

export type SeedProductStatus = "draft" | "active" | "archived";

export interface SeedProduct {
  id: string;
  sku: string;
  name: LocalizedText;
  description: LocalizedText;
  categoryId: string;
  price: number;
  compareAtPrice: number | null;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  status: SeedProductStatus;
  imageHue: number;
  rating: number;
  reviewsCount: number;
  salesCount: number;
  /** Digital products skip the shipment flow (requiresShipping=false, type="digital"). */
  digital?: boolean;
  createdAt: ISODate;
}

export type SeedCustomerSegment = "vip" | "loyal" | "returning" | "new" | "atRisk";

export interface SeedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  segment: SeedCustomerSegment;
  ordersCount: number;
  totalSpent: number;
  lastOrderAt: ISODate | null;
  createdAt: ISODate;
}

export type SeedOrderStatus = "new" | "processing" | "ready" | "shipped" | "delivered" | "cancelled" | "returned";
export type SeedPaymentMethod = "mada" | "applePay" | "visa" | "stcPay" | "tabby" | "tamara" | "cod";
export type SeedPaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type SeedOrderChannel = "store" | "whatsapp" | "instagram";

export interface SeedOrderEvent {
  status: SeedOrderStatus;
  at: ISODate;
  actor: "system" | "staff" | "agent";
}

export interface SeedOrderItem {
  productId: string;
  name: LocalizedText;
  sku: string;
  imageHue: number;
  quantity: number;
  unitPrice: number;
}

export interface SeedOrder {
  id: string;
  number: number;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: SeedOrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  vat: number;
  total: number;
  status: SeedOrderStatus;
  paymentStatus: SeedPaymentStatus;
  paymentMethod: SeedPaymentMethod;
  carrier: string;
  trackingNumber: string | null;
  channel: SeedOrderChannel;
  address: { city: string; district: string; street: string };
  note: string | null;
  createdAt: ISODate;
  timeline: SeedOrderEvent[];
}

export interface SeedMessage {
  id: string;
  sender: "customer" | "agent" | "staff";
  text: string;
  at: ISODate;
}

export type SeedConversationChannel = "whatsapp" | "instagram" | "webchat" | "messenger" | "x" | "tiktok" | "email";

export interface SeedConversation {
  id: string;
  customerId: string;
  customerName: string;
  orderId: string | null;
  lastMessageAt: ISODate;
  messages: SeedMessage[];
  channel: SeedConversationChannel;
  status: "open" | "waiting" | "resolved";
  handledBy: "agent" | "staff";
  unread: number;
  intent: string;
}
