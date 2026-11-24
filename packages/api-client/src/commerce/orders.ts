import type {
  Address, CancelReason, FulfillmentStatus, Invoice, Order, OrderItem, Payment, Refund, Return, ReturnPolicySettings, ReturnStatus, Shipment, ShipmentStatus,
} from "@repo/contracts";
import { money } from "@repo/contracts";
import { NOW } from "@repo/mocks";
import type {
  EditOrderInput, NewOrderInput, NewReturnInput, OrderLookupInput, RefundInput, ShipmentInput, ShipmentStatusInput, TrackingInput, ZatcaAttempt,
} from "./types";
import {
  SYSTEM, audit, adjustStock, db, defaultLocation, event, find, guard, me, processedWebhookEvents, requirePerm, respond, returnEvent, seq, stockAvailable, uid,
} from "./db";
import { awardLoyalty, deliverDigital, redeemGiftCard, redeemLoyalty, restoreGiftCard } from "./growth";
import { attributeOrder, resolvePrice } from "./growth-b2b";
import {
  canApplyPaymentEvent, canCancelOrder, canEditOrder, canShipOrder, canTransitionFulfillment, canTransitionReturn, canTransitionShipment, computeTotals,
  findRefundByKey, paidAmount, refundableBalance, refundableItemQty, vatIncluded,
} from "./order-math";

/** Default Arabic scan descriptions (db content, not UI copy) matching the
 * seeded event texts — a staff `note` overrides them. */
const SHIPMENT_EVENT_DESC: Record<ShipmentStatus, string> = {
  label_created: "تم إنشاء البوليصة",
  picked_up: "استلمت شركة الشحن الشحنة",
  in_transit: "الشحنة في الطريق",
  out_for_delivery: "خرجت للتوصيل",
  delivered: "تم التسليم",
  failed_attempt: "تعذر التسليم",
  returned: "أُعيدت الشحنة إلى المرسل",
  cancelled: "أُلغيت البوليصة",
};

/* ---- shared helpers (mock "server" invariants) ---- */

const orderRef = (o: Order) => ({ type: "order" as const, id: o.id, label: `#${o.number}` });
const shipmentRef = (s: Shipment) => ({ type: "shipment" as const, id: s.id, label: s.trackingNumber ?? s.id });

/** One ZATCA submission-log row — the invoices.* side-table keeps a durable
 * trail (who/when/result) because the Invoice contract has no attempt field. */
const zatcaLog = (inv: Invoice, result: Invoice["zatcaStatus"], detail: string | null, actor = me()): ZatcaAttempt => {
  const attempt: ZatcaAttempt = { id: uid("zat"), invoiceId: inv.id, at: new Date().toISOString(), actor, result, detail };
  db.zatcaAttempts.unshift(attempt);
  return attempt;
};

/** Issues the order's sale invoice once it legally exists (payment captured,
 * COD sale placed, or goods actually shipped — mirrors the seed's rule).
 * Idempotent: a second call is a no-op, and it never duplicates a sale invoice. */
export const issueInvoice = (o: Order): Invoice | null => {
  if (o.invoiceId) return null;
  if (db.invoices.some((i) => i.orderId === o.id && i.type !== "credit_note")) return null;
  const customer = db.customers.find((c) => c.id === o.customerId);
  const number = `INV-2026-${String(o.number).padStart(6, "0")}`;
  const inv: Invoice = {
    id: uid("inv"), number, type: "simplified", orderId: o.id, returnId: null, customerId: o.customerId,
    customer: { name: customer?.name ?? o.shippingAddress.recipientName, vatNumber: null },
    lines: o.items.map((it) => ({ description: it.productName.ar, quantity: it.quantity, unitPrice: it.unitPrice, vat: it.tax, total: it.lineTotal })),
    subtotal: money(o.total.amount - o.taxTotal.amount), vatAmount: money(o.taxTotal.amount), total: money(o.total.amount),
    issuedAt: new Date().toISOString(), qrCode: `zatca:${o.number}`, pdfUrl: "#",
    zatcaStatus: "reported", zatcaErrors: [], relatedInvoiceId: null,
  };
  db.invoices.unshift(inv);
  o.invoiceId = inv.id;
  zatcaLog(inv, "reported", null, SYSTEM);
  event(o, "invoice_issued", { number: inv.number }, { type: "invoice", id: inv.id, label: inv.number });
  return inv;
};

/** Items the carrier must move — digital/service products skip the shipment flow. */
const shippableProduct = (productId: string) => db.products.find((p) => p.id === productId)?.requiresShipping !== false;
const tracksStock = (variantId: string) => {
  const v = db.products.flatMap((p) => p.variants).find((x) => x.id === variantId);
  return v?.trackInventory === true;
};

/** Writes one refund row + keeps paymentStatus in sync. Shared by orders.refund,
 * returns.refund, cancel(with refund) and inbox approvals. Idempotent by key. */
export const applyRefund = (
  o: Order,
  input: { amount: number; reason: string; restock?: boolean; items?: { orderItemId: string; quantity: number }[]; idempotencyKey?: string | null; returnId?: string | null; actor?: ReturnType<typeof me> },
): Refund => {
  const existing = findRefundByKey(db.refunds, input.idempotencyKey);
  if (existing) return existing;
  const balance = refundableBalance(o, db.payments, db.refunds);
  if (input.amount <= 0 || input.amount > balance) throw new Error("amount");
  const items = input.items ?? [];
  items.forEach((line) => {
    const it = o.items.find((i) => i.id === line.orderItemId);
    if (!it) throw new Error("item");
    if (line.quantity <= 0 || line.quantity > refundableItemQty(it)) throw new Error("item_qty");
  });
  const r: Refund = {
    id: uid("rfd"), paymentId: `pay_${o.number}`, orderId: o.id, amount: money(input.amount), reason: input.reason, status: "succeeded",
    items: items.map((i) => ({ orderItemId: i.orderItemId, quantity: i.quantity })), restock: input.restock ?? false,
    gatewayRef: `re_${Date.now().toString(36)}${seq}`, idempotencyKey: input.idempotencyKey ?? null, returnId: input.returnId ?? null,
    actor: input.actor ?? me(), approvedBy: null, createdAt: new Date().toISOString(),
  };
  db.refunds.push(r);
  items.forEach((line) => {
    const it = o.items.find((i) => i.id === line.orderItemId);
    if (it) it.refundedQty = Math.min(it.quantity, it.refundedQty + line.quantity);
    if (input.restock && it && tracksStock(it.variantId)) adjustStock(it.variantId, line.quantity, "return", { reference: orderRef(o) });
  });
  const refunded = db.refunds.filter((x) => x.orderId === o.id).reduce((t, x) => t + x.amount.amount, 0);
  o.paymentStatus = refunded >= paidAmount(o, db.payments) ? "refunded" : "partially_refunded";
  event(o, "refunded", { amount: input.amount });
  return r;
};

export const ordersApi = {
  orders: {
    list: () => guard<Order[]>(() => { requirePerm("orders.read"); return db.orders; }),
    get: (id: string) => guard<Order>(() => { requirePerm("orders.read"); return find(db.orders, id, "order"); }),
    /* Guest order tracking (`/track`) — the order number alone isn't a
     * credential, so the lookup also verifies the phone it was placed with
     * (customer record or the delivery address). */
    lookup: (input: OrderLookupInput) => guard<Order>(() => {
      const digits = (s: string) => {
        const d = s.replace(/\D/g, "");
        return d.startsWith("966") ? d.slice(3) : d.startsWith("0") ? d.slice(1) : d;
      };
      const want = digits(input.phone);
      const o = db.orders.find((x) => x.number === input.number);
      if (!o) throw new Error("order_not_found");
      const customer = db.customers.find((x) => x.id === o.customerId);
      const phones = [customer?.phone, o.shippingAddress.phone].filter((x): x is string => Boolean(x)).map(digits);
      if (!want || !phones.includes(want)) throw new Error("phone_mismatch");
      return o;
    }),
    payments: (orderId: string) => guard<Payment[]>(() => { requirePerm("orders.read"); return db.payments.filter((p) => p.orderId === orderId); }),
    refunds: (orderId: string) => guard<Refund[]>(() => { requirePerm("orders.read"); return db.refunds.filter((r) => r.orderId === orderId); }),
    addNote: (id: string, text: string) => guard(() => {
      requirePerm("orders.manage");
      const o = find(db.orders, id, "order");
      const n = { text, actor: me(), at: new Date().toISOString() };
      o.internalNotes.push(n);
      event(o, "note_added", { text });
      return o;
    }),
    fulfill: (id: string) => guard(() => {
      requirePerm("orders.manage");
      const o = find(db.orders, id, "order");
      if (!canTransitionFulfillment(o.fulfillmentStatus, "processing")) throw new Error("invalid_transition");
      o.fulfillmentStatus = "processing";
      o.status = "in_progress";
      event(o, "status_changed", { to: "processing" });
      return o;
    }),
    createShipment: (id: string, input: ShipmentInput) => guard(() => {
      requirePerm("orders.manage");
      requirePerm("shipments.manage");
      const o = find(db.orders, id, "order");
      if (!canShipOrder(o)) throw new Error("not_shippable");
      const requested = input.items ?? o.items.map((i) => ({ orderItemId: i.id, quantity: i.quantity - i.fulfilledQty }));
      const lines = requested.filter((l) => l.quantity > 0);
      if (!lines.length) throw new Error("no_items");
      lines.forEach((line) => {
        const it = o.items.find((i) => i.id === line.orderItemId);
        if (!it) throw new Error("item");
        if (!shippableProduct(it.productId)) throw new Error("not_shippable_item");
        if (line.quantity > it.quantity - it.fulfilledQty) throw new Error("item_qty");
      });
      /* Goods moving = the sale invoice legally exists (seed rule). */
      issueInvoice(o);
      const s: Shipment = {
        id: uid("shp"), orderId: o.id, customerId: o.customerId, type: "outbound", carrier: input.carrier, service: input.service,
        trackingNumber: `TRK${o.number}${seq}SA`, trackingUrl: "#", labelUrl: "#", labelNumber: `LBL${o.number}${seq}SA`, items: lines.map((l) => ({ orderItemId: l.orderItemId, quantity: l.quantity })),
        packages: input.packages ?? [{ weightGrams: input.weightGrams, dimensionsCm: { l: 30, w: 20, h: 12 } }], codAmount: o.paymentMethod === "cod" ? o.total : null,
        status: "label_created", events: [{ status: "label_created", location: "الرياض", description: "تم إنشاء البوليصة", at: new Date().toISOString() }],
        estimatedDelivery: input.pickupDate ?? null, cost: money(input.cost ?? 2_500),
      };
      db.shipments.unshift(s);
      o.shipmentIds.push(s.id);
      s.items.forEach((line) => { const it = o.items.find((i) => i.id === line.orderItemId); if (it) it.fulfilledQty = Math.min(it.quantity, it.fulfilledQty + line.quantity); });
      o.fulfillmentStatus = o.items.filter((i) => shippableProduct(i.productId)).every((i) => i.fulfilledQty >= i.quantity) ? "shipped" : "processing";
      o.status = "in_progress";
      event(o, "shipment_created", { carrier: s.carrier, tracking: s.trackingNumber ?? "" }, { type: "shipment", id: s.id });
      audit("shipment.created", { type: "shipment", id: s.id, label: s.trackingNumber ?? s.id }, [{ field: "order", from: null, to: String(o.number) }]);
      return s;
    }),
    setFulfillment: (ids: string[], to: FulfillmentStatus) => guard(() => {
      requirePerm("orders.manage");
      let applied = 0;
      ids.forEach((id) => {
        const o = find(db.orders, id, "order");
        if (!canTransitionFulfillment(o.fulfillmentStatus, to)) return;
        event(o, "status_changed", { from: o.fulfillmentStatus, to });
        o.fulfillmentStatus = to;
        o.status = to === "delivered" ? "completed" : "in_progress";
        if (to === "delivered" && o.paymentMethod === "cod" && o.paymentStatus === "cod_pending") {
          o.paymentStatus = "cod_collected";
          o.paidAt = new Date().toISOString();
        }
        if (to === "delivered") {
          issueInvoice(o);
          deliverDigital(o);
          awardLoyalty(o);
        }
        applied += 1;
      });
      if (ids.length > 1) audit("orders.bulk_fulfillment", null, [{ field: "fulfillmentStatus", from: null, to: `${to} ×${applied}` }]);
      return { applied };
    }),
    addTag: (ids: string[], tag: string) => guard(() => {
      requirePerm("orders.manage");
      ids.forEach((id) => { const o = find(db.orders, id, "order"); if (!o.tags.includes(tag)) o.tags.push(tag); });
    }),
    removeTag: (ids: string[], tag: string) => guard(() => {
      requirePerm("orders.manage");
      ids.forEach((id) => { const o = find(db.orders, id, "order"); o.tags = o.tags.filter((t) => t !== tag); });
    }),
    updateAddress: (id: string, patch: Partial<Address>) => guard(() => {
      requirePerm("orders.manage");
      const o = find(db.orders, id, "order");
      if (o.fulfillmentStatus === "shipped" || o.fulfillmentStatus === "delivered") throw new Error("shipped");
      Object.assign(o.shippingAddress, patch);
      event(o, "edited", { field: "shippingAddress" });
      audit("order.address_updated", orderRef(o));
      return o;
    }),
    sendPaymentLink: (id: string) => guard(() => {
      requirePerm("orders.manage");
      const o = find(db.orders, id, "order");
      if (["paid", "cod_collected"].includes(o.paymentStatus)) throw new Error("already_paid");
      event(o, "message_sent", { kind: "payment_link" });
    }),
    /* Order editing — replaces the line set and re-derives totals while the
     * order is still editable (canEditOrder: nothing shipped/cancelled/refunded).
     * Stock follows the quantity delta per variant; a line that already has
     * returned/refunded units is locked (qty can't move past them). */
    edit: (id: string, input: EditOrderInput) => guard(() => {
      requirePerm("orders.manage");
      const o = find(db.orders, id, "order");
      if (!canEditOrder(o)) throw new Error(o.status === "cancelled" ? "cancelled" : "not_editable");
      if (!input.items.length) throw new Error("no_items");
      const buildLine = (line: EditOrderInput["items"][number], n: number): OrderItem => {
        if (line.quantity <= 0) throw new Error("quantity");
        const prev = o.items.find((i) => i.variantId === line.variantId);
        if (prev) {
          if ((prev.returnedQty > 0 || prev.refundedQty > 0) && line.quantity !== prev.quantity) throw new Error("line_locked");
          if (line.quantity < prev.fulfilledQty) throw new Error("below_fulfilled");
          const unit = line.unitPrice ?? prev.unitPrice.amount;
          const total = unit * line.quantity;
          return { ...prev, quantity: line.quantity, unitPrice: money(unit), tax: money(vatIncluded(total)), lineTotal: money(total) };
        }
        const p = db.products.find((x) => x.variants.some((v) => v.id === line.variantId));
        const v = p?.variants.find((x) => x.id === line.variantId);
        if (!p || !v) throw new Error("variant");
        /* Same stock gate as create — tracked physical variants can't oversell. */
        if (p.requiresShipping && v.trackInventory && line.quantity > stockAvailable(v.id)) throw new Error(`insufficient_stock:${v.sku}`);
        const unit = line.unitPrice ?? v.price.amount;
        const total = unit * line.quantity;
        return {
          id: uid(`oi${n}`), variantId: v.id, productId: p.id, productName: p.name, variantLabel: v.optionValues.join(" / ") || null, sku: v.sku,
          image: p.media[0] ?? null, quantity: line.quantity, unitPrice: money(unit), discount: money(0), tax: money(vatIncluded(total)),
          lineTotal: money(total), fulfilledQty: 0, returnedQty: 0, refundedQty: 0,
        };
      };
      const next = input.items.map(buildLine);
      const before = new Map(o.items.map((i) => [i.variantId, i.quantity]));
      next.forEach((it) => {
        const delta = it.quantity - (before.get(it.variantId) ?? 0);
        if (delta !== 0 && tracksStock(it.variantId)) adjustStock(it.variantId, -delta, delta > 0 ? "sale" : "cancellation", { reference: orderRef(o) });
      });
      before.forEach((qty, variantId) => {
        if (!next.some((i) => i.variantId === variantId) && tracksStock(variantId)) {
          const it = o.items.find((i) => i.variantId === variantId);
          const releasable = (it?.quantity ?? 0) - (it?.returnedQty ?? 0);
          if (releasable > 0) adjustStock(variantId, releasable, "cancellation", { reference: orderRef(o) });
        }
      });
      const totals = computeTotals(next.map((i) => ({ unitPrice: i.unitPrice.amount, quantity: i.quantity })), input.discount, input.shippingFee);
      const changes = [
        { field: "items", from: String(o.items.reduce((s, i) => s + i.quantity, 0)), to: String(next.reduce((s, i) => s + i.quantity, 0)) },
        { field: "discount", from: String(o.discountTotal.amount), to: String(totals.discountTotal) },
        { field: "total", from: String(o.total.amount), to: String(totals.total) },
      ];
      Object.assign(o, {
        items: next,
        subtotal: money(totals.subtotal), discountTotal: money(totals.discountTotal), shippingTotal: money(totals.shippingTotal),
        taxTotal: money(totals.taxTotal), total: money(totals.total),
      });
      /* An unpaid pending payment row tracks the new total (captured/failed/voided rows are immutable). */
      db.payments.filter((p) => p.orderId === o.id && p.status === "pending").forEach((p) => (p.amount = o.total));
      event(o, "edited", { items: String(next.length), total: String(totals.total) });
      audit("order.edited", orderRef(o), changes);
      return o;
    }),
    cancel: (id: string, input: { code: CancelReason; text: string; refund: boolean; restock: boolean; notify: boolean }) => guard(() => {
      requirePerm("orders.manage");
      const o = find(db.orders, id, "order");
      if (!canCancelOrder(o)) throw new Error(o.status === "cancelled" ? "already_cancelled" : "shipped");
      o.status = "cancelled";
      o.fulfillmentStatus = "cancelled";
      o.cancelledAt = new Date().toISOString();
      o.cancelReason = { code: input.code, text: input.text };
      if (input.restock) {
        o.items.forEach((it) => {
          const qty = it.quantity - it.returnedQty;
          if (qty > 0 && tracksStock(it.variantId)) adjustStock(it.variantId, qty, "cancellation", { reference: orderRef(o) });
        });
      }
      if (input.refund) {
        const balance = refundableBalance(o, db.payments, db.refunds);
        if (balance > 0) {
          applyRefund(o, { amount: balance, reason: `إلغاء الطلب — ${input.code}`, restock: false });
        } else if (o.paymentStatus === "paid") o.paymentStatus = "refunded";
      }
      /* Whatever a gift card covered goes back to the card's balance. */
      restoreGiftCard(o);
      event(o, "cancelled", { reason: input.code });
      audit("order.cancelled", orderRef(o), [{ field: "status", from: "open", to: "cancelled" }, { field: "reason", from: null, to: input.code }]);
      return o;
    }),
    refund: (id: string, input: RefundInput) => guard(() => {
      requirePerm("orders.refund");
      const o = find(db.orders, id, "order");
      const r = applyRefund(o, { amount: input.amount, reason: input.reason, restock: input.restock, items: input.items, idempotencyKey: input.idempotencyKey });
      audit("order.refunded", orderRef(o), [{ field: "amount", from: null, to: String(r.amount.amount) }, { field: "reason", from: null, to: input.reason }]);
      return o;
    }),
    create: (input: NewOrderInput) => guard(() => {
      requirePerm("orders.manage");
      const c = find(db.customers, input.customerId, "customer");
      const address = c.addresses.find((a) => a.id === input.addressId) ?? c.addresses[0];
      if (!address) throw new Error("address");
      /* Warehouse the order commits stock against — the picker on the manual
       * order screen wins; otherwise the store's default location. */
      const loc = input.locationId ? find(db.locations, input.locationId, "location") : defaultLocation();
      if (loc && loc.status !== "active") throw new Error("location_inactive");
      const levelAvailable = (variantId: string) =>
        db.inventoryLevels.filter((l) => l.variantId === variantId && (!loc || l.locationId === loc.id)).reduce((s, l) => s + l.available, 0);
      const items: OrderItem[] = input.items.map((line, n) => {
        const p = db.products.find((x) => x.variants.some((v) => v.id === line.variantId));
        const v = p?.variants.find((x) => x.id === line.variantId);
        if (!p || !v) throw new Error("variant");
        if (line.quantity <= 0) throw new Error("quantity");
        /* Stock gate: physical tracked variants can't sell past availability. */
        if (p.requiresShipping && v.trackInventory && line.quantity > levelAvailable(v.id)) throw new Error(`insufficient_stock:${v.sku}`);
        /* Price precedence: explicit staff override > customer price list > base. */
        const unit = line.unitPrice ?? resolvePrice(c.id, v.id, v.price.amount)?.price ?? v.price.amount;
        const total = unit * line.quantity;
        return {
          id: uid(`oi${n}`), variantId: v.id, productId: p.id, productName: p.name, variantLabel: v.optionValues.join(" / ") || null, sku: v.sku, image: p.media[0] ?? null,
          quantity: line.quantity, unitPrice: money(unit), discount: money(0), tax: money(vatIncluded(total)), lineTotal: money(total), fulfilledQty: 0, returnedQty: 0, refundedQty: 0,
        };
      });
      /* Loyalty redemption folds into the discount — points burn only after
       * every other guard passed (below, before stock commit). */
      const pointsWanted = Math.max(0, Math.floor(input.loyaltyPoints ?? 0));
      if (pointsWanted > 0) {
        if (!db.loyaltySettings.enabled) throw new Error("loyalty_disabled");
        const balance = db.loyaltyAccounts.find((a) => a.customerId === c.id)?.points ?? 0;
        if (pointsWanted > balance) throw new Error("insufficient_points");
      }
      const pointsValue = Math.round(pointsWanted * db.loyaltySettings.redeemRate);
      const totals = computeTotals(items.map((i) => ({ unitPrice: i.unitPrice.amount, quantity: i.quantity })), input.discount + pointsValue, input.shippingFee);
      /* Gift card as (part-)payment — validated here, redeemed after `o` exists. */
      const gc = input.giftCardCode?.trim().toLowerCase();
      const card = gc ? db.giftCards.find((x) => x.code.toLowerCase() === gc) : null;
      if (input.giftCardCode && !card) throw new Error("gift_card_not_found");
      if (card) {
        if (card.status === "deactivated") throw new Error("gift_card_deactivated");
        if (card.expiresAt && +new Date(card.expiresAt) < Date.now()) throw new Error("gift_card_expired");
        if (card.balance.amount <= 0) throw new Error("gift_card_empty");
      }
      const ac = input.affiliateCode?.trim().toLowerCase();
      const affiliate = ac ? db.affiliates.find((a) => a.code.toLowerCase() === ac) : null;
      if (input.affiliateCode && !affiliate) throw new Error("affiliate_not_found");
      if (affiliate && affiliate.status !== "active") throw new Error("affiliate_inactive");
      const number = Math.max(...db.orders.map((o) => o.number)) + 1;
      /* Fully-digital carts carry no shipping obligation — keep the row honest. */
      const needsShipping = items.some((it) => shippableProduct(it.productId));
      /* Gift wrap is a flat VAT-inclusive service fee on top of the order total. */
      const wrapFee = Math.max(0, Math.round(input.giftWrap?.fee ?? 0));
      const grandTotal = totals.total + wrapFee;
      const o: Order = {
        id: `ord_${number}`, number, customerId: c.id, channel: input.channel ?? "manual", agentId: null, conversationId: input.conversationId ?? null,
        affiliateCode: affiliate?.code ?? null, locationId: loc?.id ?? null, items, shippingAddress: address,
        billingAddress: null /* same as shipping — the storefront checkout has no separate billing step */,
        shippingMethod: needsShipping
          ? { carrier: input.shipping?.carrier ?? "أرامكس", service: input.shipping?.service ?? "توصيل عادي", price: money(input.shippingFee), etaDays: input.shipping?.etaDays ?? 3 }
          : null,
        couponCode: input.couponCode ?? null,
        subtotal: money(totals.subtotal), discountTotal: money(totals.discountTotal), shippingTotal: money(totals.shippingTotal), taxTotal: money(vatIncluded(grandTotal)),
        total: money(grandTotal), pricesIncludeTax: true, paymentMethod: input.paymentMethod,
        paymentStatus: input.markPaid ? "paid" : input.paymentMethod === "cod" ? "cod_pending" : "pending",
        giftWrapFee: wrapFee ? money(wrapFee) : null,
        fulfillmentStatus: "unfulfilled", status: "needs_action", customerNote: input.customerNote?.trim() || null,
        internalNotes: input.internalNote ? [{ text: input.internalNote, actor: me(), at: new Date().toISOString() }] : [], tags: [], invoiceId: null,
        shipmentIds: [], returnIds: [], events: [], createdAt: new Date().toISOString(), paidAt: input.markPaid ? new Date().toISOString() : null, cancelledAt: null, cancelReason: null,
      };
      /* Burn points + redeem the card now that every guard passed — the ledger
       * entries carry the order reference. */
      if (pointsWanted > 0) redeemLoyalty(c.id, pointsWanted, o);
      const cardApplied = card ? redeemGiftCard(card.code, o, o.total.amount) : 0;
      const remainder = Math.max(0, o.total.amount - cardApplied);
      if (cardApplied > 0 && remainder === 0) {
        o.paymentMethod = "gift_card";
        o.paymentStatus = "paid";
        o.paidAt = new Date().toISOString();
      }
      /* Stock commit: decrement availability for tracked physical items at the
       * order's location (mock has no reservation — sale = the reservation). */
      items.forEach((it) => {
        const p = db.products.find((x) => x.id === it.productId);
        if (p?.requiresShipping && tracksStock(it.variantId)) adjustStock(it.variantId, -it.quantity, "sale", { reference: orderRef(o), actor: me(), locationId: loc?.id });
      });
      const now = new Date().toISOString();
      if (cardApplied > 0) {
        db.payments.push({
          id: `pay_${o.number}_gc`, orderId: o.id, amount: money(cardApplied), method: "gift_card", status: "captured",
          provider: "gift_card", providerRef: gc ?? "", cardBrand: null, cardLast4: null, failureReason: null, webhookEventId: null, createdAt: now,
        });
      }
      if (remainder > 0) {
        db.payments.push({
          id: `pay_${o.number}`, orderId: o.id, amount: money(remainder), method: input.paymentMethod, status: input.markPaid ? "captured" : "pending",
          provider: input.paymentMethod === "cod" ? "cod" : "moyasar", providerRef: `mys_${(number * 7919).toString(36)}`,
          cardBrand: null, cardLast4: null, failureReason: null, webhookEventId: null, createdAt: now,
        });
      }
      event(o, "created", { channel: o.channel });
      if (input.markPaid || o.paymentStatus === "paid") event(o, "paid", { method: o.paymentMethod });
      /* The tax invoice exists once the sale is real — paid up front or COD. */
      if (input.markPaid || o.paymentMethod === "cod" || o.paymentStatus === "paid") {
        issueInvoice(o);
        deliverDigital(o);
        if (db.digitalDeliveries.some((d) => d.orderId === o.id)) event(o, "digital_delivered", {});
      }
      if (affiliate) attributeOrder(affiliate.code, o);
      if (input.sendPaymentLink) event(o, "message_sent", { kind: "payment_link" });
      if (input.sendConfirmation) event(o, "message_sent", { kind: "confirmation" });
      c.stats.ordersCount += 1;
      db.orders.unshift(o);
      audit("order.created", orderRef(o), [
        { field: "channel", from: null, to: o.channel }, { field: "total", from: null, to: String(o.total.amount) },
        ...(cardApplied ? [{ field: "giftCard", from: null, to: `${gc ?? "?"}:${cardApplied}` }] : []),
        ...(pointsWanted ? [{ field: "loyaltyPoints", from: null, to: String(pointsWanted) }] : []),
        ...(affiliate ? [{ field: "affiliate", from: null, to: affiliate.code }] : []),
      ]);
      return o;
    }),
    /* Mock payment-gateway webhook — `eventId` dedupes replays; out-of-order
     * events can never regress a captured payment (see canApplyPaymentEvent). */
    paymentWebhook: (input: { eventId: string; providerRef: string; type: "authorized" | "captured" | "failed" | "voided" }) => guard(() => {
      if (processedWebhookEvents.has(input.eventId)) return { applied: false as const, duplicate: true as const };
      processedWebhookEvents.add(input.eventId);
      const p = db.payments.find((x) => x.providerRef === input.providerRef);
      if (!p) return { applied: false as const, duplicate: false as const };
      if (!canApplyPaymentEvent(p.status, input.type)) return { applied: false as const, duplicate: false as const };
      p.status = input.type;
      p.webhookEventId = input.eventId;
      const o = db.orders.find((x) => x.id === p.orderId);
      if (o) {
        if (input.type === "captured") { o.paymentStatus = "paid"; o.paidAt = new Date().toISOString(); event(o, "paid", { method: p.method }, null, { type: "system", id: "webhook", name: "بوابة الدفع" }); issueInvoice(o); deliverDigital(o); }
        if (input.type === "failed") { o.paymentStatus = "failed"; event(o, "payment_failed", { reason: "webhook" }); }
        if (input.type === "authorized") o.paymentStatus = "authorized";
        if (input.type === "voided") o.paymentStatus = "pending";
      }
      return { applied: true as const, duplicate: false as const };
    }),
  },
  shipments: {
    /* Read stays at orders.read — shipment rows back the order-detail card and
     * entity previews for anyone who can see the order. */
    list: () => guard<Shipment[]>(() => { requirePerm("orders.read"); return db.shipments; }),
    get: (id: string) => guard<Shipment>(() => { requirePerm("orders.read"); return find(db.shipments, id, "shipment"); }),
    /* Carrier-scan update. Transitions run through SHIPMENT_FLOW — no illogical
     * jumps and delivered/returned/cancelled never regress. Every accepted
     * update appends a timeline event (status/location/note + server time) and
     * an audit row (actor + from→to). */
    setStatus: (id: string, input: ShipmentStatusInput) => guard(() => {
      requirePerm("shipments.manage");
      const s = find(db.shipments, id, "shipment");
      const to = input.status;
      if (s.status === to) throw new Error("same_status");
      if (!canTransitionShipment(s.status, to)) throw new Error("invalid_transition");
      const from = s.status;
      s.status = to;
      s.events.push({
        status: to, location: input.location?.trim() ?? "",
        description: input.note?.trim() || SHIPMENT_EVENT_DESC[to], at: new Date().toISOString(),
      });
      const o = db.orders.find((x) => x.id === s.orderId);
      if (o && s.type === "outbound") {
        if (to === "delivered") {
          o.fulfillmentStatus = "delivered";
          o.status = "completed";
          if (o.paymentMethod === "cod" && o.paymentStatus === "cod_pending") { o.paymentStatus = "cod_collected"; o.paidAt = new Date().toISOString(); }
          deliverDigital(o);
          awardLoyalty(o);
          event(o, "delivered", {}, { type: "shipment", id: s.id });
        } else if (to === "cancelled") {
          /* Voided label frees the units — the order can be re-shipped; fulfillment
           * re-derives from what's still committed to live shipments. */
          s.items.forEach((line) => {
            const it = o.items.find((i) => i.id === line.orderItemId);
            if (it) it.fulfilledQty = Math.max(0, it.fulfilledQty - line.quantity);
          });
          const shippable = o.items.filter((i) => shippableProduct(i.productId));
          o.fulfillmentStatus = shippable.every((i) => i.fulfilledQty >= i.quantity)
            ? "shipped"
            : shippable.some((i) => i.fulfilledQty > 0)
              ? "processing"
              : "unfulfilled";
          if (o.status === "completed") o.status = "in_progress";
          event(o, "shipment_updated", { to }, { type: "shipment", id: s.id });
        } else if (to === "returned") {
          /* Outbound parcel came back undelivered (RTS). */
          o.fulfillmentStatus = "returned";
          event(o, "shipment_updated", { to }, { type: "shipment", id: s.id });
        } else {
          event(o, "shipment_updated", { to }, { type: "shipment", id: s.id });
        }
      }
      audit("shipment.status_updated", shipmentRef(s), [{ field: "status", from, to }]);
      return s;
    }),
    /** Carrier-assigned tracking code/url — e.g. a label bought before pickup. */
    updateTracking: (id: string, input: TrackingInput) => guard(() => {
      requirePerm("shipments.manage");
      const s = find(db.shipments, id, "shipment");
      const tn = input.trackingNumber.trim();
      if (!tn) throw new Error("tracking_required");
      const before = s.trackingNumber;
      s.trackingNumber = tn;
      if (input.trackingUrl !== undefined) s.trackingUrl = input.trackingUrl?.trim() || null;
      audit("shipment.tracking_updated", shipmentRef(s), [{ field: "trackingNumber", from: before, to: tn }]);
      return s;
    }),
    /** Customer notification — the mock can't reach WhatsApp, so this records a
     * real `message_sent` order event + audit row (the in-app trail the UI shows). */
    notifyCustomer: (id: string) => guard(() => {
      requirePerm("shipments.manage");
      const s = find(db.shipments, id, "shipment");
      const o = db.orders.find((x) => x.id === s.orderId);
      if (o) event(o, "message_sent", { kind: "shipment_update", status: s.status, tracking: s.trackingNumber ?? "" }, { type: "shipment", id: s.id });
      audit("shipment.customer_notified", shipmentRef(s));
      return s;
    }),
  },
  invoices: {
    list: () => guard<Invoice[]>(() => { requirePerm("invoices.read"); return db.invoices; }),
    get: (id: string) => guard<Invoice>(() => { requirePerm("invoices.read"); return find(db.invoices, id, "invoice"); }),
    /** Full ZATCA submission log for one invoice, newest first — seeded rows
     * (written at issue time) plus every resend attempt. */
    attempts: (invoiceId: string) => guard<ZatcaAttempt[]>(() => {
      requirePerm("invoices.read");
      const inv = find(db.invoices, invoiceId, "invoice");
      return db.zatcaAttempts.filter((a) => a.invoiceId === inv.id).sort((a, b) => b.at.localeCompare(a.at));
    }),
    /* Resubmit to the (simulated) FATOORA gateway. Eligibility: only a pending
     * or rejected invoice can be (re)sent — a reported/cleared one is final.
     * The gateway verdict is deterministic, not random: a standard invoice whose
     * buyer VAT number is malformed keeps failing until the data is fixed;
     * anything else reports cleanly. Every call appends an attempt row + audit. */
    resend: (id: string) => guard(() => {
      requirePerm("invoices.read");
      /* The catalog has no invoices.manage — resubmission is an ops action, so
       * it gates on the operations manage perm in addition to the read one. */
      requirePerm("orders.manage");
      const inv = find(db.invoices, id, "invoice");
      if (inv.zatcaStatus !== "rejected" && inv.zatcaStatus !== "pending") throw new Error("not_resendable");
      const from = inv.zatcaStatus;
      const badVat = inv.type === "standard" && inv.customer.vatNumber !== null && !/^3\d{13}3$/.test(inv.customer.vatNumber);
      const result: Invoice["zatcaStatus"] = badVat ? "rejected" : "reported";
      const detail = badVat ? "رقم التسجيل الضريبي للمشتري غير صالح" : null;
      inv.zatcaStatus = result;
      inv.zatcaErrors = detail ? [detail] : [];
      const attempt = zatcaLog(inv, result, detail);
      audit("invoice.zatca_submitted", { type: "invoice", id: inv.id, label: inv.number }, [{ field: "zatcaStatus", from, to: result }]);
      return { invoice: inv, attempt };
    }),
  },
  returns: {
    list: () => guard<Return[]>(() => { requirePerm("orders.read"); return db.returns; }),
    get: (id: string) => guard<Return>(() => { requirePerm("orders.read"); return find(db.returns, id, "return"); }),
    policy: () => respond<ReturnPolicySettings>(db.returnPolicy),
    savePolicy: (patch: Partial<ReturnPolicySettings>) => guard<ReturnPolicySettings>(() => {
      requirePerm("returns.manage");
      Object.assign(db.returnPolicy, patch);
      audit("settings.return_policy", null, Object.keys(patch).map((field) => ({ field, from: null, to: "updated" })));
      return db.returnPolicy;
    }),
    /* Submit a return request (from the order screen). Eligibility is driven by
     * the merchant's return policy: window days from order creation (mock clock),
     * per-product exclusion rules, and the enabled-reasons list. */
    create: (input: NewReturnInput) => guard(() => {
      requirePerm("returns.manage");
      const o = find(db.orders, input.orderId, "order");
      if (!input.items.length) throw new Error("no_items");
      if (NOW - new Date(o.createdAt).getTime() > db.returnPolicy.windowDays * 86_400_000) throw new Error("window_expired");
      if (!db.returnPolicy.reasons.includes(input.reason)) throw new Error("reason_disabled");
      input.items.forEach((line) => {
        const it = o.items.find((i) => i.id === line.orderItemId);
        if (!it) throw new Error("item");
        if (db.returnPolicy.nonReturnableProductIds.includes(it.productId)) throw new Error("not_returnable");
        /* Cap: ordered − already returned − already pending in open returns. */
        const pending = db.returns
          .filter((x) => x.orderId === o.id && !["rejected", "closed"].includes(x.status))
          .reduce((s, x) => s + x.items.filter((y) => y.orderItemId === it.id).reduce((t, y) => t + y.quantity, 0), 0);
        if (line.quantity <= 0 || line.quantity > it.quantity - it.returnedQty - pending) throw new Error("item_qty");
        if (!db.returnPolicy.reasons.includes(line.reason)) throw new Error("reason_disabled");
      });
      const number = Math.max(5000, ...db.returns.map((r) => r.number)) + 1;
      const c = db.customers.find((x) => x.id === o.customerId);
      const r: Return = {
        id: uid("ret"), number, orderId: o.id, customerId: o.customerId,
        items: input.items.map((l) => ({ orderItemId: l.orderItemId, quantity: l.quantity, reason: l.reason })),
        reason: input.reason, customerNote: input.customerNote ?? null, photos: input.photos ?? [], status: "requested",
        resolution: null, refundAmount: null, restock: true, returnShipmentId: null, rejectionReason: null,
        creditNoteId: null, refundId: null, inspectionStatus: null, restockedAt: null,
        events: [], createdAt: new Date(NOW).toISOString(),
      };
      returnEvent(r, "created", { items: String(r.items.length) });
      db.returns.unshift(r);
      o.returnIds.push(r.id);
      if (c) c.stats.returnsCount += 1;
      event(o, "return_requested", { number: r.number }, { type: "return", id: r.id, label: `#${r.number}` });
      audit("return.created", { type: "return", id: r.id, label: `#${r.number}` }, [{ field: "order", from: null, to: `#${o.number}` }]);
      return r;
    }),
    /* "Request more info" — the reviewer asks the customer for details/photos
     * before deciding; the note is logged on the return's activity timeline. */
    requestInfo: (id: string, note: string) => guard(() => {
      requirePerm("returns.manage");
      const r = find(db.returns, id, "return");
      if (!canTransitionReturn(r.status, "info_requested")) throw new Error("invalid_transition");
      r.status = "info_requested";
      returnEvent(r, "info_requested", { note });
      const o = find(db.orders, r.orderId, "order");
      event(o, "status_changed", { to: "return:info_requested" });
      audit("return.info_requested", { type: "return", id: r.id, label: `#${r.number}` }, [{ field: "status", from: "requested", to: "info_requested" }]);
      return r;
    }),
    addNote: (id: string, text: string) => guard(() => {
      requirePerm("returns.manage");
      const r = find(db.returns, id, "return");
      returnEvent(r, "note_added", { text });
      return r;
    }),
    setStatus: (id: string, status: ReturnStatus, extra: Partial<Pick<Return, "rejectionReason" | "refundAmount" | "restock" | "resolution">> = {}) => guard(() => {
      requirePerm("returns.manage");
      const r = find(db.returns, id, "return");
      if (!canTransitionReturn(r.status, status)) throw new Error("invalid_transition");
      Object.assign(r, extra, { status });
      returnEvent(r, "status_changed", { to: status });
      const o = find(db.orders, r.orderId, "order");
      if (status === "received" && r.restock && !r.restockedAt) {
        r.inspectionStatus = "passed";
        r.restockedAt = new Date().toISOString();
        r.items.forEach((line) => {
          const it = o.items.find((i) => i.id === line.orderItemId);
          if (it) it.returnedQty = Math.min(it.quantity, it.returnedQty + line.quantity);
          if (it && tracksStock(it.variantId)) adjustStock(it.variantId, line.quantity, "return", { reference: { type: "return", id: r.id, label: `#${r.number}` } });
        });
      }
      event(o, "status_changed", { to: `return:${status}` });
      audit(status === "rejected" ? "return.rejected" : "return.status_changed", { type: "return", id: r.id, label: `#${r.number}` }, [{ field: "status", from: null, to: status }]);
      return r;
    }),
    approve: (id: string, input: { resolution: NonNullable<Return["resolution"]>; refundAmount: number; restock: boolean; createShipment: boolean; acceptedItems?: { orderItemId: string; quantity: number }[] }) => guard(() => {
      requirePerm("returns.manage");
      const r = find(db.returns, id, "return");
      if (r.status !== "requested" && r.status !== "info_requested") throw new Error("already_decided");
      const o = find(db.orders, r.orderId, "order");
      /* Partial acceptance — the reviewer may trim each line down (or drop it)
       * below the requested quantity; accepted qty replaces the request. */
      if (input.acceptedItems) {
        r.items = r.items.flatMap((line) => {
          const accepted = input.acceptedItems?.find((x) => x.orderItemId === line.orderItemId);
          const qty = accepted ? Math.min(accepted.quantity, line.quantity) : line.quantity;
          if (qty < 0) throw new Error("item_qty");
          return qty > 0 ? [{ ...line, quantity: qty }] : [];
        });
        if (!r.items.length) throw new Error("no_items");
      }
      const itemsValue = r.items.reduce((s, line) => {
        const it = o.items.find((i) => i.id === line.orderItemId);
        return s + (it ? (it.lineTotal.amount / it.quantity) * line.quantity : 0);
      }, 0);
      if (input.refundAmount < 0 || input.refundAmount > Math.round(itemsValue)) throw new Error("amount");
      Object.assign(r, { status: "approved", resolution: input.resolution, refundAmount: money(input.refundAmount), restock: input.restock });
      returnEvent(r, "status_changed", { to: "approved", resolution: input.resolution });
      if (input.createShipment) {
        const s: Shipment = {
          id: uid("shp"), orderId: o.id, customerId: o.customerId, type: "return", carrier: "أرامكس", service: "استرجاع",
          trackingNumber: `RTN${r.number}${seq}SA`, trackingUrl: "#", labelUrl: "#", labelNumber: `RLB${r.number}${seq}SA`, items: r.items.map((i) => ({ orderItemId: i.orderItemId, quantity: i.quantity })),
          packages: [{ weightGrams: 1_000, dimensionsCm: { l: 30, w: 20, h: 12 } }], codAmount: null, status: "label_created",
          events: [{ status: "label_created", location: o.shippingAddress.city, description: "تم إنشاء بوليصة الإرجاع", at: new Date().toISOString() }],
          estimatedDelivery: null, cost: money(2_000),
        };
        db.shipments.unshift(s);
        r.returnShipmentId = s.id;
      }
      audit("return.approved", { type: "return", id: r.id, label: `#${r.number}` }, [{ field: "resolution", from: null, to: input.resolution }, { field: "refundAmount", from: null, to: String(input.refundAmount) }]);
      return r;
    }),
    refund: (id: string) => guard(() => {
      requirePerm("returns.manage");
      requirePerm("orders.refund");
      const r = find(db.returns, id, "return");
      if (r.status !== "received" || r.resolution !== "refund" || r.refundId) throw new Error("not_refundable");
      const o = find(db.orders, r.orderId, "order");
      const amount = r.refundAmount?.amount ?? 0;
      const refund = applyRefund(o, { amount, reason: `مرتجع #${r.number}`, restock: false, items: r.items.map((i) => ({ orderItemId: i.orderItemId, quantity: i.quantity })), returnId: r.id });
      /* Restock safety net — normally done at "received"; covers restock flagged
       * after receipt or inspections completed out of band. */
      if (r.restock && !r.restockedAt) {
        r.restockedAt = new Date().toISOString();
        r.items.forEach((line) => {
          const it = o.items.find((i) => i.id === line.orderItemId);
          if (it && tracksStock(it.variantId)) adjustStock(it.variantId, line.quantity, "return", { reference: { type: "return", id: r.id, label: `#${r.number}` } });
        });
      }
      const original = db.invoices.find((i) => i.orderId === o.id && i.type !== "credit_note");
      const vat = vatIncluded(amount);
      const cn: Invoice = {
        id: uid("inv"), number: `CN-${r.number}`, type: "credit_note", orderId: o.id, returnId: r.id, customerId: o.customerId,
        customer: original?.customer ?? { name: o.shippingAddress.recipientName, vatNumber: null },
        lines: [{ description: `مرتجع #${r.number}`, quantity: 1, unitPrice: money(amount - vat), vat: money(vat), total: money(amount) }],
        subtotal: money(amount - vat), vatAmount: money(vat), total: money(amount), issuedAt: new Date().toISOString(), qrCode: "", pdfUrl: "#",
        zatcaStatus: "pending", zatcaErrors: [], relatedInvoiceId: original?.id ?? null,
      };
      db.invoices.unshift(cn);
      zatcaLog(cn, "reported", null, SYSTEM);
      Object.assign(r, { status: "refunded", creditNoteId: cn.id, refundId: refund.id });
      returnEvent(r, "status_changed", { to: "refunded", amount: String(amount) });
      audit("return.refunded", { type: "return", id: r.id, label: `#${r.number}` }, [{ field: "amount", from: null, to: String(amount) }, { field: "refundId", from: null, to: refund.id }]);
      return r;
    }),
  },
};
