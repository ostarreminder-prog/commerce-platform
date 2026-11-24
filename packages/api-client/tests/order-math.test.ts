/* Unit tests for the order business-math invariants — plain node:test so they
 * run without a bundler: `node --test packages/api-client/tests/`
 * (this file lives outside tsconfig `include` and is not shipped). */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canApplyPaymentEvent, canCancelOrder, canEditOrder, canShipOrder, canTransitionFulfillment, canTransitionReturn, computeTotals,
  findRefundByKey, paidAmount, refundableBalance, refundableItemQty, vatIncluded,
} from "../src/commerce/order-math.ts";
import type { Order, Payment, Refund } from "@repo/contracts";

const money = (amount: number) => ({ amount, currency: "SAR" as const });
const order = (over: Partial<Order> = {}): Order =>
  ({
    id: "ord_1", total: money(11_500), paymentStatus: "paid", status: "in_progress", fulfillmentStatus: "processing",
    items: [{ id: "oi_1", quantity: 2, refundedQty: 0, returnedQty: 0, fulfilledQty: 0 }],
    ...over,
  }) as Order;
const payment = (over: Partial<Payment> = {}): Payment =>
  ({ id: "pay_1", orderId: "ord_1", amount: money(11_500), status: "captured", ...over }) as Payment;
const refund = (over: Partial<Refund> = {}): Refund =>
  ({ id: "rfd_1", orderId: "ord_1", amount: money(1_000), status: "succeeded", idempotencyKey: null, ...over }) as Refund;

test("totals: subtotal/discount/shipping/vat/total are consistent", () => {
  const t = computeTotals(
    [
      { unitPrice: 10_000, quantity: 2 }, // 200.00
      { unitPrice: 5_000, quantity: 1 }, //  50.00
    ],
    5_000, // 50.00 discount
    2_500, // 25.00 shipping
  );
  assert.equal(t.subtotal, 25_000);
  assert.equal(t.discountTotal, 5_000);
  assert.equal(t.shippingTotal, 2_500);
  assert.equal(t.total, 22_500); // 25000 - 5000 + 2500
  assert.equal(t.taxTotal, vatIncluded(22_500)); // 15% included
  assert.equal(t.taxTotal, 2_935); // 22500 - 22500/1.15
  // invariant: subtotal - discount + shipping = total, and tax ⊆ total
  assert.equal(t.subtotal - t.discountTotal + t.shippingTotal, t.total);
  assert.ok(t.taxTotal < t.total);
});

test("totals: discount is capped at subtotal and total never goes negative", () => {
  const t = computeTotals([{ unitPrice: 1_000, quantity: 1 }], 9_999, 500);
  assert.equal(t.discountTotal, 1_000);
  assert.equal(t.total, 500);
});

test("refund cap: balance = paid − refunded; paid prefers captured rows", () => {
  const o = order();
  const refunds = [refund({ amount: money(4_000) }), refund({ id: "rfd_2", amount: money(500), status: "failed" })];
  // captured payment row present → paid = 11_500, refunded = 4_000 (failed ignored)
  assert.equal(refundableBalance(o, [payment()], refunds), 7_500);
  // no payment rows but status paid → falls back to order.total
  assert.equal(refundableBalance(o, [], refunds), 7_500);
  // unpaid order → zero refundable
  assert.equal(refundableBalance(order({ paymentStatus: "pending" }), [], []), 0);
  assert.equal(paidAmount(order({ paymentStatus: "pending" }), [payment({ status: "pending" })]), 0);
});

test("refund idempotency: same key resolves the stored refund", () => {
  const stored = refund({ idempotencyKey: "k-1" });
  assert.equal(findRefundByKey([stored], "k-1")?.id, stored.id);
  assert.equal(findRefundByKey([stored], "k-2"), null);
  assert.equal(findRefundByKey([stored], null), null);
  assert.equal(findRefundByKey([stored], undefined), null);
});

test("per-item refund cap: quantity − refundedQty", () => {
  assert.equal(refundableItemQty({ quantity: 3, refundedQty: 1 }), 2);
  assert.equal(refundableItemQty({ quantity: 2, refundedQty: 2 }), 0);
  assert.equal(refundableItemQty({ quantity: 2, refundedQty: 5 }), 0); // never negative
});

test("fulfillment lifecycle: forward-only, terminals unreachable", () => {
  assert.equal(canTransitionFulfillment("unfulfilled", "processing"), true);
  assert.equal(canTransitionFulfillment("unfulfilled", "shipped"), true); // skip allowed
  assert.equal(canTransitionFulfillment("processing", "delivered"), true);
  assert.equal(canTransitionFulfillment("delivered", "shipped"), false); // backwards
  assert.equal(canTransitionFulfillment("shipped", "shipped"), false); // same-state no-op
  assert.equal(canTransitionFulfillment("cancelled", "processing"), false); // un-cancel impossible
  assert.equal(canTransitionFulfillment("delivered", "returned"), false); // returns flow only
  assert.equal(canTransitionFulfillment("processing", "cancelled"), false); // cancel via orders.cancel only
});

test("cancel/ship guards", () => {
  assert.equal(canCancelOrder(order({ status: "cancelled", fulfillmentStatus: "cancelled" })), false);
  assert.equal(canCancelOrder(order({ fulfillmentStatus: "shipped" })), false);
  assert.equal(canCancelOrder(order({ fulfillmentStatus: "unfulfilled" })), true);
  assert.equal(canShipOrder(order({ fulfillmentStatus: "processing" })), true);
  assert.equal(canShipOrder(order({ fulfillmentStatus: "shipped" })), false);
  assert.equal(canShipOrder(order({ status: "cancelled", fulfillmentStatus: "cancelled" })), false);
});

test("return lifecycle: decide once, refund once", () => {
  assert.equal(canTransitionReturn("requested", "approved"), true);
  assert.equal(canTransitionReturn("requested", "rejected"), true);
  assert.equal(canTransitionReturn("approved", "in_transit"), true);
  assert.equal(canTransitionReturn("in_transit", "received"), true);
  assert.equal(canTransitionReturn("approved", "received"), true); // no-shipment path
  assert.equal(canTransitionReturn("received", "refunded"), true);
  assert.equal(canTransitionReturn("refunded", "closed"), true);
  assert.equal(canTransitionReturn("rejected", "closed"), true);
  assert.equal(canTransitionReturn("rejected", "approved"), false); // can't re-decide
  assert.equal(canTransitionReturn("refunded", "received"), false); // backwards
  assert.equal(canTransitionReturn("requested", "refunded"), false); // skip receive
  // info_requested branch: ask the customer, then decide or close
  assert.equal(canTransitionReturn("requested", "info_requested"), true);
  assert.equal(canTransitionReturn("info_requested", "approved"), true);
  assert.equal(canTransitionReturn("info_requested", "rejected"), true);
  assert.equal(canTransitionReturn("info_requested", "closed"), true);
  assert.equal(canTransitionReturn("info_requested", "requested"), false); // no re-opening
  assert.equal(canTransitionReturn("info_requested", "refunded"), false); // still needs receive
});

test("edit guard: only open unshipped unrefunded orders", () => {
  assert.equal(canEditOrder(order()), true);
  assert.equal(canEditOrder(order({ fulfillmentStatus: "unfulfilled" })), true);
  assert.equal(canEditOrder(order({ status: "cancelled", fulfillmentStatus: "cancelled" })), false);
  assert.equal(canEditOrder(order({ fulfillmentStatus: "shipped" })), false);
  assert.equal(canEditOrder(order({ fulfillmentStatus: "delivered" })), false);
  assert.equal(canEditOrder(order({ paymentStatus: "refunded" })), false);
  assert.equal(canEditOrder(order({ paymentStatus: "partially_refunded" })), false);
});

test("payment webhook: terminal states can't regress, retries recover", () => {
  assert.equal(canApplyPaymentEvent("captured", "failed"), false); // late failure ignored
  assert.equal(canApplyPaymentEvent("captured", "authorized"), false); // out-of-order
  assert.equal(canApplyPaymentEvent("voided", "captured"), false);
  assert.equal(canApplyPaymentEvent("pending", "captured"), true);
  assert.equal(canApplyPaymentEvent("authorized", "captured"), true);
  assert.equal(canApplyPaymentEvent("pending", "failed"), true);
  assert.equal(canApplyPaymentEvent("failed", "captured"), true); // retry succeeded
  assert.equal(canApplyPaymentEvent("captured", "captured"), false); // exact replay
});
