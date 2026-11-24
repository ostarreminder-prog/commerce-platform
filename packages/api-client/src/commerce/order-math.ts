import type { FulfillmentStatus, Order, Payment, Refund, ReturnStatus, ShipmentStatus } from "@repo/contracts";

/* Pure order business-math — no db access, so the same rules are unit-testable
 * with plain `node --test` (see packages/api-client/tests/order-math.test.ts)
 * and reused by the commerce.* endpoints for invariants.
 * All money amounts are integer halalas; prices include 15% VAT. */

export const VAT_RATE = 0.15;

/** VAT portion of a tax-inclusive amount (halalas). */
export const vatIncluded = (total: number) => Math.round(total - total / (1 + VAT_RATE));

export interface OrderLineLike {
  unitPrice: number;
  quantity: number;
}

export const lineTotal = (line: OrderLineLike) => line.unitPrice * line.quantity;

export interface OrderTotals {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  taxTotal: number;
  total: number;
}

/** subtotal − discount + shipping, floored at 0; tax is the included VAT share. */
export const computeTotals = (items: OrderLineLike[], discount: number, shippingFee: number): OrderTotals => {
  const subtotal = items.reduce((s, i) => s + lineTotal(i), 0);
  const discountTotal = Math.max(0, Math.min(discount, subtotal));
  const total = Math.max(0, subtotal - discountTotal + shippingFee);
  return { subtotal, discountTotal, shippingTotal: shippingFee, taxTotal: vatIncluded(total), total };
};

/** Amount actually captured for the order — captured payment rows win; falls
 * back to `order.total` when the order is flagged paid but has no rows (seeded
 * data predates the payments ledger, COD collected, etc.). */
export const paidAmount = (order: Pick<Order, "id" | "total" | "paymentStatus">, payments: Payment[]): number => {
  const captured = payments.filter((p) => p.orderId === order.id && p.status === "captured").reduce((s, p) => s + p.amount.amount, 0);
  if (captured > 0) return captured;
  return ["paid", "partially_refunded", "refunded", "cod_collected"].includes(order.paymentStatus) ? order.total.amount : 0;
};

/** Sum of non-failed refunds for the order. */
export const refundedAmount = (orderId: string, refunds: Refund[]): number =>
  refunds.filter((r) => r.orderId === orderId && r.status !== "failed").reduce((s, r) => s + r.amount.amount, 0);

/** Hard refund cap: never refund more than (paid − already refunded). */
export const refundableBalance = (order: Pick<Order, "id" | "total" | "paymentStatus">, payments: Payment[], refunds: Refund[]): number =>
  Math.max(0, paidAmount(order, payments) - refundedAmount(order.id, refunds));

/** Idempotent replay: a stored refund carrying the same key wins, no double charge-back. */
export const findRefundByKey = (refunds: Refund[], key: string | null | undefined): Refund | null =>
  key ? (refunds.find((r) => r.idempotencyKey === key) ?? null) : null;

/** Per-item refund cap: a line can refund at most `quantity − refundedQty` units. */
export const refundableItemQty = (item: Pick<Order["items"][number], "quantity" | "refundedQty">): number =>
  Math.max(0, item.quantity - item.refundedQty);

/* ---- lifecycle ---- */
const FULFILLMENT_FLOW: FulfillmentStatus[] = ["unfulfilled", "processing", "shipped", "delivered"];

/** Forward-only inside unfulfilled→processing→shipped→delivered (skips allowed);
 * `returned`/`cancelled` are terminal and unreachable through this transition. */
export const canTransitionFulfillment = (from: FulfillmentStatus, to: FulfillmentStatus): boolean => {
  const a = FULFILLMENT_FLOW.indexOf(from);
  const b = FULFILLMENT_FLOW.indexOf(to);
  return a >= 0 && b > a;
};

/** Cancel is legal only before anything has shipped — never un-cancels. */
export const canCancelOrder = (o: Pick<Order, "status" | "fulfillmentStatus">): boolean =>
  o.status !== "cancelled" && !["shipped", "delivered", "returned", "cancelled"].includes(o.fulfillmentStatus);

/** Editing items/totals is legal only while nothing shipped and no money moved
 * back — shipped/cancelled orders are frozen, (partially) refunded ones too. */
export const canEditOrder = (o: Pick<Order, "status" | "fulfillmentStatus" | "paymentStatus">): boolean =>
  o.status !== "cancelled" &&
  !["shipped", "delivered", "returned", "cancelled"].includes(o.fulfillmentStatus) &&
  !["refunded", "partially_refunded"].includes(o.paymentStatus);

/** A shipment may be created only while the order is open and not fully shipped. */
export const canShipOrder = (o: Pick<Order, "status" | "fulfillmentStatus">): boolean =>
  o.status !== "cancelled" && !["shipped", "delivered", "cancelled"].includes(o.fulfillmentStatus);

/* ---- shipment lifecycle ----
 * label_created → picked_up → in_transit → out_for_delivery → delivered
 *                        ↘ cancelled      ↘ returned (RTS)   ↘ failed_attempt → out_for_delivery | returned
 * delivered/returned/cancelled are terminal — nothing regresses them. */
const SHIPMENT_FLOW: Record<ShipmentStatus, ShipmentStatus[]> = {
  label_created: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["out_for_delivery", "returned", "failed_attempt"],
  out_for_delivery: ["delivered", "failed_attempt", "returned"],
  failed_attempt: ["out_for_delivery", "returned"],
  delivered: [],
  returned: [],
  cancelled: [],
};

export const canTransitionShipment = (from: ShipmentStatus, to: ShipmentStatus): boolean =>
  (SHIPMENT_FLOW[from] ?? []).includes(to);

export const shipmentTerminal = (s: ShipmentStatus): boolean => SHIPMENT_FLOW[s].length === 0;

/** Label-print eligibility: a label needs a carrier-assigned label + tracking pair. */
export const labelEligible = (s: { trackingNumber: string | null; labelNumber: string | null }): boolean =>
  Boolean(s.trackingNumber) && Boolean(s.labelNumber);

const RETURN_FLOW: ReturnStatus[] = ["requested", "approved", "in_transit", "received", "refunded"];

/** requested→approved|rejected · requested→info_requested (ask customer for
 * details) → approved|rejected|closed · approved→in_transit→received→refunded→closed ·
 * rejected→closed. One-shot: nothing moves backwards or re-decides. */
export const canTransitionReturn = (from: ReturnStatus, to: ReturnStatus): boolean => {
  if (from === "requested" && to === "rejected") return true;
  if (from === "requested" && to === "info_requested") return true;
  if (from === "info_requested") return to === "approved" || to === "rejected" || to === "closed";
  if (to === "closed") return from === "rejected" || from === "refunded";
  if (to === "refunded") return from === "received"; // money only moves after inspection
  const a = RETURN_FLOW.indexOf(from);
  const b = RETURN_FLOW.indexOf(to);
  return a >= 0 && b > a;
};

/** Payment status progression for gateway events — `captured`/`voided` are
 * terminal; anything else may still change (failed→captured = retry recovery),
 * so late/duplicate events can never regress a completed payment. */
export const canApplyPaymentEvent = (current: Payment["status"], next: Payment["status"]): boolean => {
  if (current === "captured" || current === "voided") return false;
  return next !== current;
};
