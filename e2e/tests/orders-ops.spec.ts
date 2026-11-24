import { test, expect } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Orders-module operations coverage.
 * Two layers, on purpose:
 *  1. UI flows — manual order create, tags, cancel, return approval, cart recovery.
 *  2. Server-side invariants — driven straight at `window.__commerce` (the mock
 *     "server"), so refund caps / idempotency / webhook dedupe / permission
 *     rejection are asserted deterministically regardless of seed randomness.
 *
 * Each test runs in a fresh browser context → the in-memory db reseeds per test.
 */
const ADMIN = `${BASES.ADMIN}/nakhla`;
const T = 15_000;
const load = (page: import("@playwright/test").Page, url: string) => page.goto(url, { waitUntil: "domcontentloaded" });
const waitApi = (page: import("@playwright/test").Page) => page.waitForFunction(() => (window as unknown as { __commerce?: unknown }).__commerce);

test.describe("orders module — عمليات الطلبات", () => {
  test.setTimeout(90_000);

  test("new order: quick-create customer → add item → submit lands on detail", async ({ page }) => {
    await load(page, `${ADMIN}/orders/new`);
    await page.getByRole("button", { name: "عميل جديد" }).click();
    await page.locator("#qc-name").fill("عميلة الاختبار E2E");
    await page.locator("#qc-phone").fill("0512345678");
    await page.getByRole("button", { name: "إنشاء العميل" }).click();
    // customer picked → picker swaps to the selected row
    await expect(page.getByRole("button", { name: "تغيير" })).toBeVisible({ timeout: T });

    await page.getByPlaceholder("ابحث باسم المنتج أو SKU").fill("تمر سكري");
    await page.getByRole("button", { name: /تمر سكري فاخر/ }).first().click();

    // a quick-created customer has no saved address → the "new address" form
    await page.locator("#na-district").fill("حي النرجس");

    await page.getByRole("button", { name: "إنشاء الطلب" }).click();
    await expect(page.getByText(/تم إنشاء الطلب/)).toBeVisible({ timeout: T });
    await expect(page).toHaveURL(/\/orders\/ord_/, { timeout: T });

    // server-side: the sale wrote a stock movement for the new order
    const orderId = page.url().split("/orders/")[1];
    await waitApi(page);
    const moved = await page.evaluate(async (id) => {
      const c = (window as unknown as { __commerce: { inventory: { movements: () => Promise<{ reference: { id: string } | null }[]> } } }).__commerce;
      return (await c.inventory.movements()).some((m) => m.reference?.id === id);
    }, orderId);
    expect(moved).toBe(true);
  });

  test("order detail: add tag then remove it", async ({ page }) => {
    await load(page, `${ADMIN}/orders/ord_10289`);
    await page.getByRole("button", { name: "إضافة وسم" }).click();
    await page.getByPlaceholder("مثال: VIP").fill("E2E");
    await page.getByPlaceholder("مثال: VIP").press("Enter");
    await expect(page.getByRole("link", { name: "E2E" })).toBeVisible({ timeout: T });

    await page.getByRole("button", { name: 'إزالة الوسم "E2E"' }).click();
    await expect(page.getByRole("link", { name: "E2E" })).toHaveCount(0, { timeout: T });
  });

  test("order detail: cancel with reason → cancelled banner", async ({ page }) => {
    await load(page, `${ADMIN}/orders/ord_10289`);
    await page.getByRole("button", { name: "إلغاء الطلب" }).click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText(/إلغاء الطلب/)).toBeVisible();
    await dlg.locator("#cancel-reason").click();
    await page.getByRole("option", { name: "طلب العميل" }).click();
    await dlg.getByRole("button", { name: "تأكيد الإلغاء" }).click();
    await expect(page.getByText(/تم إلغاء الطلب/)).toBeVisible({ timeout: T });
  });

  test("returns: approve → receive → refund a requested return", async ({ page }) => {
    await load(page, `${ADMIN}/returns`);
    await waitApi(page);
    const retId = await page.evaluate(async () => {
      const c = (window as unknown as { __commerce: { returns: { list: () => Promise<{ id: string; status: string }[]> } } }).__commerce;
      return (await c.returns.list()).find((r) => r.status === "requested")?.id ?? null;
    });
    expect(retId).not.toBeNull();

    await load(page, `${ADMIN}/returns/${retId}`);
    await page.getByRole("button", { name: "قبول", exact: true }).click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByRole("heading", { name: /قبول المرتجع/ })).toBeVisible();
    await dlg.getByRole("button", { name: "قبول المرتجع" }).click();
    await expect(page.getByText("تم قبول المرتجع")).toBeVisible({ timeout: T });

    await page.getByRole("button", { name: "تأكيد الاستلام" }).click();
    await expect(page.getByRole("button", { name: "استرداد" })).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "استرداد" }).click();
    const dlg2 = page.getByRole("dialog");
    await dlg2.getByRole("button", { name: /استرداد/ }).last().click();
    await expect(page.getByText(/إشعار دائن/)).toBeVisible({ timeout: T });
  });

  test("abandoned carts: due cart sends, fresh cart is rejected with reason", async ({ page }) => {
    // cart_101 is 30min idle → under the 1h threshold → cart_not_due
    await load(page, `${ADMIN}/abandoned-carts/cart_101`);
    await page.getByRole("button", { name: "إرسال تذكير" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "إرسال" }).click();
    await expect(page.getByText("هذه السلة لم يحن وقت استرجاعها بعد")).toBeVisible({ timeout: T });

    // cart_102 is 80min idle with an old attempt → due → send succeeds
    await load(page, `${ADMIN}/abandoned-carts/cart_102`);
    await page.getByRole("button", { name: "إرسال تذكير" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "إرسال" }).click();
    await expect(page.getByText("تم إرسال رسالة الاسترجاع")).toBeVisible({ timeout: T });
  });

  test("server invariants: refund cap, idempotency, shipment caps, webhook dedupe", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    await waitApi(page);
    const out = await page.evaluate(async () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const c = (window as any).__commerce;
      const res: Record<string, unknown> = {};
      const orders: any[] = await c.orders.list();
      const paid = orders.find((o: any) => o.paymentStatus === "paid" && o.status !== "cancelled");
      res.paidId = paid.id;

      // refund > paid − refunded → rejected ("amount")
      res.overCap = await c.orders
        .refund(paid.id, { amount: paid.total.amount + 10_000, reason: "x", restock: false, items: [] })
        .then(() => "resolved", (e: Error) => e.message);

      // identical replay with the same idempotency key → one stored refund
      const key = "e2e-idem";
      const before = (await c.orders.refunds(paid.id)).length;
      await c.orders.refund(paid.id, { amount: 1_000, reason: "r", restock: false, idempotencyKey: key, items: [] });
      await c.orders.refund(paid.id, { amount: 1_000, reason: "r", restock: false, idempotencyKey: key, items: [] });
      res.refundDelta = (await c.orders.refunds(paid.id)).length - before;

      // shipment over remaining qty → rejected; duplicate full shipment → rejected
      const open = orders.find(
        (o: any) => o.status !== "cancelled" && ["unfulfilled", "processing"].includes(o.fulfillmentStatus) && o.items.some((i: any) => i.fulfilledQty < i.quantity),
      );
      const line = open.items.find((i: any) => i.fulfilledQty < i.quantity);
      res.overQty = await c.orders
        .createShipment(open.id, { carrier: "أرامكس", service: "x", weightGrams: 500, items: [{ orderItemId: line.id, quantity: line.quantity - line.fulfilledQty + 1 }] })
        .then(() => "resolved", (e: Error) => e.message);
      await c.orders.createShipment(open.id, { carrier: "أرامكس", service: "x", weightGrams: 500 });
      res.dupShip = await c.orders
        .createShipment(open.id, { carrier: "أرامكس", service: "x", weightGrams: 500 })
        .then(() => "resolved", (e: Error) => e.message);

      // payment webhook: replay deduped; captured is terminal vs late "authorized"
      const pending = orders.find((o: any) => o.paymentStatus === "pending");
      const pay = (await c.orders.payments(pending.id))[0];
      res.wh1 = await c.orders.paymentWebhook({ eventId: "evt_e2e_1", providerRef: pay.providerRef, type: "captured" });
      res.wh2 = await c.orders.paymentWebhook({ eventId: "evt_e2e_1", providerRef: pay.providerRef, type: "captured" });
      res.wh3 = await c.orders.paymentWebhook({ eventId: "evt_e2e_2", providerRef: pay.providerRef, type: "authorized" });
      return res;
    });
    expect(out.overCap).toBe("amount");
    expect(out.refundDelta).toBe(1);
    expect(out.overQty).toBe("item_qty");
    expect(out.dupShip).toBe("not_shippable");
    expect(out.wh1).toEqual({ applied: true, duplicate: false });
    expect(out.wh2).toEqual({ applied: false, duplicate: true });
    expect(out.wh3).toEqual({ applied: false, duplicate: false });
  });

  test("server invariants: manual order decrements stock; digital item ships nowhere", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    await waitApi(page);
    const out = await page.evaluate(async () => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const c = (window as any).__commerce;
      const res: Record<string, unknown> = {};
      const customers: any[] = await c.customers.list();
      const customer = customers.find((cu: any) => cu.addresses.length);
      const products: any[] = await c.products.list();
      const physical = products.find((p: any) => p.requiresShipping && p.status === "active");
      const digital = products.find((p: any) => !p.requiresShipping && p.status === "active");
      const variantId = physical.variants[0].id;
      const before = (await c.inventory.levels()).find((l: any) => l.variantId === variantId)?.available ?? null;

      const order = await c.orders.create({
        customerId: customer.id, addressId: customer.addresses[0].id, shippingFee: 0, discount: 0, couponCode: null,
        items: [{ variantId, quantity: 2 }],
        paymentMethod: "cod", markPaid: false, internalNote: "e2e", sendPaymentLink: false, sendConfirmation: false, conversationId: null,
      });
      const after = (await c.inventory.levels()).find((l: any) => l.variantId === variantId)?.available ?? null;
      res.stockDelta = before !== null && after !== null ? after - before : "no-level";

      // digital-only order: every shipment attempt is rejected at the endpoint
      const digitalOrder = await c.orders.create({
        customerId: customer.id, addressId: customer.addresses[0].id, shippingFee: 0, discount: 0, couponCode: null,
        items: [{ variantId: digital.variants[0].id, quantity: 1 }],
        paymentMethod: "cod", markPaid: false, internalNote: "e2e", sendPaymentLink: false, sendConfirmation: false, conversationId: null,
      });
      res.digitalShip = await c.orders
        .createShipment(digitalOrder.id, { carrier: "أرامكس", service: "x", weightGrams: 500 })
        .then(() => "resolved", (e: Error) => e.message);

      // cancellation restores the decremented stock
      await c.orders.cancel(order.id, { code: "customer_request", text: "", refund: false, restock: true, notify: false });
      const restored = (await c.inventory.levels()).find((l: any) => l.variantId === variantId)?.available ?? null;
      res.restoredDelta = before !== null && restored !== null ? restored - before : "no-level";
      return res;
    });
    expect(out.stockDelta).toBe(-2);
    expect(out.digitalShip).toBe("not_shippable_item");
    expect(out.restoredDelta).toBe(0);
  });

  test("permissions: readonly role — reads pass, mutations rejected server-side", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    await page.evaluate(() => window.localStorage.setItem("admin-role-id", "role_readonly"));
    await load(page, `${ADMIN}/orders`);
    await waitApi(page);

    // reads still work (orders.read is in the readonly set)…
    await expect.poll(async () => page.evaluate(async () => {
      const c = (window as unknown as { __commerce: { orders: { list: () => Promise<unknown[]> } } }).__commerce;
      return (await c.orders.list()).length > 0;
    }), { timeout: T }).toBe(true);

    // wait until the provider has pushed the readonly context into the mock
    // server — before that the context is `null` (unrestricted) by design
    await expect.poll(async () => page.evaluate(async () => {
      const c = (window as any).__commerce; // eslint-disable-line @typescript-eslint/no-explicit-any
      return c.orders.addTag(["ord_10289"], "e2e_probe").then(() => "resolved", (e: Error) => e.message);
    }), { timeout: T }).toBe("permission_denied:orders.manage");

    // …but mutations are denied by the endpoint, not just hidden in the UI
    const rejected = await page.evaluate(async () => {
      const c = (window as any).__commerce; // eslint-disable-line @typescript-eslint/no-explicit-any
      const refund = await c.orders.refund("ord_10290", { amount: 100, reason: "x", restock: false, items: [] }).then(() => "resolved", (e: Error) => e.message);
      const tag = await c.orders.addTag(["ord_10289"], "x").then(() => "resolved", (e: Error) => e.message);
      const ship = await c.orders.createShipment("ord_10289", { carrier: "x", service: "x", weightGrams: 1 }).then(() => "resolved", (e: Error) => e.message);
      return { refund, tag, ship };
    });
    expect(rejected.refund).toBe("permission_denied:orders.refund");
    expect(rejected.tag).toBe("permission_denied:orders.manage");
    expect(rejected.ship).toBe("permission_denied:orders.manage");
  });
});
