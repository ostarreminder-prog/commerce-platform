import { inPeriod } from "@repo/api-client";
import type { Customer, FulfillmentStatus, Order, PaymentMethod, PaymentStatus, Shipment } from "@repo/contracts";
import { toHalalas } from "@repo/ui/lib/money";

export const TABS = ["all", "needs_action", "in_progress", "completed", "cancelled", "unpaid"] as const;
export const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "authorized", "paid", "partially_refunded", "refunded", "failed", "cod_pending", "cod_collected"];
export const FULFILLMENT: FulfillmentStatus[] = ["unfulfilled", "processing", "shipped", "delivered", "returned", "cancelled"];
export const METHODS: PaymentMethod[] = ["card", "mada", "apple_pay", "stc_pay", "cod", "bank_transfer", "payment_link"];
export const UNPAID: PaymentStatus[] = ["pending", "failed", "authorized"];

export const DEFAULTS = {
  status: "all", q: "", period: "all", payment: "all", fulfillment: "all", method: "all", channel: "all", agent: "all", city: "all",
  min: "", max: "", coupon: "", tag: "", customer: "", product: "", sort: "",
};
export type Filters = typeof DEFAULTS;
export const MORE_KEYS = ["method", "channel", "agent", "city", "min", "max", "coupon", "tag", "customer", "product"] as const;

export interface Row {
  order: Order;
  customer: Customer | undefined;
  shipment: Shipment | undefined;
}

export function matches(r: Row, f: Filters, q: string) {
  const o = r.order;
  if (f.status === "unpaid" ? !UNPAID.includes(o.paymentStatus) : f.status !== "all" && o.status !== f.status) return false;
  if (!inPeriod(o.createdAt, f.period)) return false;
  if (f.payment !== "all" && o.paymentStatus !== f.payment) return false;
  if (f.fulfillment !== "all" && o.fulfillmentStatus !== f.fulfillment) return false;
  if (f.method !== "all" && o.paymentMethod !== f.method) return false;
  if (f.channel !== "all" && o.channel !== f.channel) return false;
  if (f.agent !== "all" && o.agentId !== f.agent) return false;
  if (f.city !== "all" && o.shippingAddress.city !== f.city) return false;
  if (f.min && o.total.amount < toHalalas(f.min)) return false;
  if (f.max && o.total.amount > toHalalas(f.max)) return false;
  if (f.coupon && o.couponCode?.toLowerCase() !== f.coupon.toLowerCase()) return false;
  if (f.tag && !o.tags.includes(f.tag)) return false;
  if (f.customer && o.customerId !== f.customer) return false;
  if (f.product && !o.items.some((i) => i.productId === f.product)) return false;
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  return (
    String(o.number).includes(q.replace(/^#/, "")) ||
    (r.customer?.name ?? "").toLowerCase().includes(q) ||
    (digits.length >= 4 && (r.customer?.phone ?? "").replace(/\D/g, "").includes(digits)) ||
    o.items.some((i) => i.sku.toLowerCase().includes(q)) ||
    (r.shipment?.trackingNumber ?? "").toLowerCase().includes(q)
  );
}

export function exportCsv(rows: Row[]) {
  const head = ["number", "date", "customer", "phone", "channel", "total", "paymentStatus", "fulfillmentStatus"];
  const lines = rows.map((r) => [r.order.number, r.order.createdAt, r.customer?.name ?? "", r.customer?.phone ?? "", r.order.channel, (r.order.total.amount / 100).toFixed(2), r.order.paymentStatus, r.order.fulfillmentStatus].join(","));
  const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "orders.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
