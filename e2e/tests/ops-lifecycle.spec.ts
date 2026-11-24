import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Operations lifecycle coverage — Order→Invoice→Shipment→Delivery and
 * Order→OriginalInvoice→Return→CreditNote.
 *
 * Same two layers as orders-ops.spec.ts: real UI flows on top, deterministic
 * `window.__commerce` (mock "server") assertions underneath — transition
 * guards, attempt logs, audit rows and permission rejection don't depend on
 * seed randomness. Fresh browser context per test → the db reseeds.
 */
const ADMIN = `${BASES.ADMIN}/nakhla`;
const T = 15_000;
const load = (page: Page, url: string) => page.goto(url, { waitUntil: "domcontentloaded" });
const waitApi = (page: Page) => page.waitForFunction(() => (window as unknown as { __commerce?: unknown }).__commerce);

/* eslint-disable @typescript-eslint/no-explicit-any */

test.describe("operations lifecycle — دورة العمليات", () => {
  test.setTimeout(120_000);

  test("1. order → create shipment → list → detail → status update → timeline event", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    await waitApi(page);
    const order = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const [orders, products] = await Promise.all([c.orders.list(), c.products.list()]);
      const phys = new Set(products.filter((p: any) => p.requiresShipping).map((p: any) => p.id));
      const o = orders.find(
        (x: any) =>
          x.status !== "cancelled" &&
          !["shipped", "delivered", "cancelled"].includes(x.fulfillmentStatus) &&
          x.items.some((i: any) => phys.has(i.productId) && i.fulfilledQty < i.quantity),
      );
      return { id: o.id, number: o.number };
    });

    /* Create from the order screen — carrier/service options come from shipping settings. */
    await load(page, `${ADMIN}/orders/${order.id}`);
    await page.getByRole("button", { name: "إنشاء شحنة" }).first().click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText(/شحنة جديدة/)).toBeVisible();
    await dlg.getByRole("button", { name: /إنشاء الشحنة/ }).click();
    await expect(page.getByText(/تم إنشاء الشحنة/)).toBeVisible({ timeout: T });

    const ship = await page.evaluate(async (oid: string) => {
      const c = (window as any).__commerce;
      return (await c.shipments.list()).filter((s: any) => s.orderId === oid).at(-1);
    }, order.id);
    expect(ship.status).toBe("label_created");
    expect(ship.trackingNumber).toBeTruthy();

    /* Appears in /shipments — navigate via the SPA link so the in-memory db
     * (with the just-created shipment) survives; a full page.goto reseeds. */
    await page.locator('a[href="/nakhla/shipments"]').first().click();
    await expect(page).toHaveURL(/\/shipments/, { timeout: T });
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: T });
    const search = page.getByPlaceholder("ابحث برقم التتبع أو الطلب أو العميل");
    await search.fill(String(order.number));
    await expect(page).toHaveURL(new RegExp(`q=${order.number}`));
    const rowLink = page.getByRole("link", { name: ship.trackingNumber });
    await expect(rowLink).toBeVisible({ timeout: T });

    /* Detail → status update (label_created → picked_up, the only forward step) */
    await rowLink.click();
    await expect(page).toHaveURL(new RegExp(`/shipments/${ship.id}`), { timeout: T });
    await expect(page.getByRole("heading", { name: ship.trackingNumber })).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "تحديث الحالة" }).click();
    const dlg2 = page.getByRole("dialog");
    await expect(dlg2.getByText("تحديث حالة الشحنة")).toBeVisible();
    await dlg2.getByRole("button", { name: "حفظ الحالة" }).click();
    await expect(page.getByText("تم تحديث حالة الشحنة")).toBeVisible({ timeout: T });

    /* Timeline event + audit row both exist server-side. */
    const after = await page.evaluate(async (sid: string) => {
      const c = (window as any).__commerce;
      const s = await c.shipments.get(sid);
      const audit = (await c.audit.list()).filter((a: any) => a.action === "shipment.status_updated" && a.target?.id === sid);
      return { status: s.status, lastEvent: s.events.at(-1), auditRows: audit.length };
    }, ship.id);
    expect(after.status).toBe("picked_up");
    expect(after.lastEvent.status).toBe("picked_up");
    expect(after.auditRows).toBeGreaterThan(0);
  });

  test("2. invalid transition is rejected — delivered can't regress", async ({ page }) => {
    await load(page, `${ADMIN}/shipments`);
    await waitApi(page);
    const out = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const list = await c.shipments.list();
      const terminal = list.find((s: any) => ["delivered", "returned", "cancelled"].includes(s.status));
      const res: Record<string, unknown> = {};
      if (terminal) {
        res.regress = await c.shipments
          .setStatus(terminal.id, { status: "in_transit" })
          .then(() => "resolved", (e: Error) => e.message);
      }
      const open = list.find((s: any) => s.status === "label_created") ?? list.find((s: any) => s.status === "in_transit");
      if (open) {
        res.illogical = await c.shipments
          .setStatus(open.id, { status: "delivered" })
          .then(() => "resolved", (e: Error) => e.message);
      }
      res.terminalFound = Boolean(terminal);
      return res;
    });
    expect(out.terminalFound).toBe(true);
    expect(out.regress).toBe("invalid_transition");
    expect(out.illogical).toBe("invalid_transition");
  });

  test("3. bulk print labels — selection, eligibility, real print window", async ({ page }) => {
    await load(page, `${ADMIN}/shipments`);
    await waitApi(page);
    /* Select all rows on page one — every seeded shipment carries label+tracking. */
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: T });
    await page.getByRole("checkbox", { name: "تحديد كل الصفوف" }).check();
    const printBtn = page.getByRole("button", { name: /طباعة البوالص \(\d+\)/ });
    await expect(printBtn).toBeVisible();
    const popup = page.waitForEvent("popup", { timeout: T });
    await printBtn.click();
    const win = await popup;
    await win.waitForLoadState("domcontentloaded");
    /* The generated label sheet is a real document — one 10x15 label per shipment. */
    expect(await win.locator(".label").count()).toBeGreaterThan(0);
  });

  test("4. order → invoice → detail: totals consistent, print + download real", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    await waitApi(page);
    const ref = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const inv = (await c.invoices.list()).find((i: any) => i.type !== "credit_note");
      const o = (await c.orders.list()).find((x: any) => x.id === inv.orderId);
      return { invoiceId: inv.id, orderId: o.id, subtotal: inv.subtotal.amount, vat: inv.vatAmount.amount, total: inv.total.amount };
    });
    /* invoice math is internally consistent (subtotal + VAT = total) */
    expect(ref.subtotal + ref.vat).toBe(ref.total);

    /* order detail → open invoice */
    await load(page, `${ADMIN}/orders/${ref.orderId}`);
    await page.getByRole("link", { name: /INV-/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/invoices/${ref.invoiceId}`), { timeout: T });
    await expect(page.getByText("الملخص المالي")).toBeVisible({ timeout: T });
    await expect(page.getByText("بنود الفاتورة")).toBeVisible();

    /* print opens the generated A4 document */
    const popup = page.waitForEvent("popup", { timeout: T });
    await page.getByRole("button", { name: "طباعة" }).click();
    const win = await popup;
    await win.waitForLoadState("domcontentloaded");
    await expect(win.locator("table")).toBeVisible();

    /* download produces a real file */
    const download = page.waitForEvent("download", { timeout: T });
    await page.getByRole("button", { name: "تنزيل" }).click();
    expect((await download).suggestedFilename()).toMatch(/INV-.*\.html$/);
  });

  test("5. rejected ZATCA invoice: error shown → resend → result → attempts log grows", async ({ page }) => {
    await load(page, `${ADMIN}/invoices`);
    await waitApi(page);
    const inv = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const i = (await c.invoices.list()).find((x: any) => x.zatcaStatus === "rejected") ?? (await c.invoices.list()).find((x: any) => x.zatcaStatus === "pending");
      return { id: i.id, number: i.number, attempts: (await c.invoices.attempts(i.id)).length };
    });

    await load(page, `${ADMIN}/invoices/${inv.id}`);
    /* failure reason surfaced */
    await expect(page.getByText("سجل الإرسال")).toBeVisible({ timeout: T });
    await expect(page.getByText("محاكاة")).toBeVisible(); // honest "simulated" badge

    await page.getByRole("button", { name: "إعادة الإرسال إلى ZATCA" }).click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText(new RegExp(`إعادة إرسال الفاتورة ${inv.number}`))).toBeVisible();
    await dlg.getByRole("button", { name: "إعادة الإرسال إلى ZATCA" }).click();
    await expect(page.getByText(new RegExp(`تم إبلاغ ZATCA بالفاتورة|انرفضت الفاتورة`))).toBeVisible({ timeout: T });

    const after = await page.evaluate(async (id: string) => {
      const c = (window as any).__commerce;
      const i = await c.invoices.get(id);
      return { status: i.zatcaStatus, attempts: (await c.invoices.attempts(id)).length };
    }, inv.id);
    expect(["reported", "rejected"]).toContain(after.status);
    expect(after.attempts).toBe(inv.attempts + 1);

    /* cleared invoices are not resendable — the endpoint guards it */
    const denied = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const i = (await c.invoices.list()).find((x: any) => x.zatcaStatus === "reported" || x.zatcaStatus === "cleared");
      return c.invoices.resend(i.id).then(() => "resolved", (e: Error) => e.message);
    });
    expect(denied).toBe("not_resendable");
  });

  test("6. return → credit note → linked original invoice opens both ways", async ({ page }) => {
    await load(page, `${ADMIN}/invoices`);
    await waitApi(page);
    const cn = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const i = (await c.invoices.list()).find((x: any) => x.type === "credit_note" && x.relatedInvoiceId && x.returnId);
      return { id: i.id, number: i.number, original: i.relatedInvoiceId, returnId: i.returnId };
    });
    expect(cn).not.toBeNull();

    /* credit note detail → original invoice link + return link both real */
    await load(page, `${ADMIN}/invoices/${cn.id}`);
    await expect(page.getByText("إشعار دائن").first()).toBeVisible({ timeout: T });
    await page.getByRole("link", { name: /INV-/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/invoices/${cn.original}`), { timeout: T });
    await expect(page.getByText("الملخص المالي")).toBeVisible({ timeout: T });

    /* return detail links the credit note back */
    await load(page, `${ADMIN}/returns/${cn.returnId}`);
    const creditLink = page.getByRole("link", { name: new RegExp(cn.number) });
    await expect(creditLink).toBeVisible({ timeout: T });
    await creditLink.click();
    await expect(page).toHaveURL(new RegExp(`/invoices/${cn.id}`), { timeout: T });
  });

  test("7. full chain: order → invoice → shipment → back → return → return invoice", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    await waitApi(page);
    const ref = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const o = (await c.orders.list()).find((x: any) => x.invoiceId && x.shipmentIds.length && x.returnIds.length);
      return { orderId: o.id, invoiceId: o.invoiceId, shipmentId: o.shipmentIds[0], returnId: o.returnIds[0] };
    });
    expect(ref).not.toBeNull();

    await load(page, `${ADMIN}/orders/${ref.orderId}`);
    await page.getByRole("link", { name: /INV-/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/invoices/${ref.invoiceId}`), { timeout: T });
    await expect(page.getByText("بنود الفاتورة")).toBeVisible();

    /* invoice → its order's shipment */
    const shipLink = page.getByRole("link", { name: /TRK|shp_/ }).first();
    if (await shipLink.count()) {
      await shipLink.click();
      await expect(page).toHaveURL(/\/shipments\//, { timeout: T });
    } else {
      await load(page, `${ADMIN}/shipments/${ref.shipmentId}`);
    }
    await expect(page.getByText("الخط الزمني")).toBeVisible({ timeout: T });

    /* shipment → back to order via the links card */
    await page.getByRole("link", { name: /#\d+/ }).first().click();
    await expect(page).toHaveURL(new RegExp(`/orders/${ref.orderId}`), { timeout: T });
    await expect(page.getByText("المرتجعات").first()).toBeVisible({ timeout: T });
  });

  test("8. permissions: readonly role can't manage shipments or resend invoices", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    await page.evaluate(() => window.localStorage.setItem("admin-role-id", "role_readonly"));
    await load(page, `${ADMIN}/shipments`);
    await waitApi(page);

    /* wait for the permission context to reach the mock server */
    await expect
      .poll(async () => page.evaluate(async () => {
        const c = (window as any).__commerce;
        const s = (await c.shipments.list()).find((x: any) => x.status === "in_transit") ?? (await c.shipments.list())[0];
        return c.shipments.setStatus(s.id, { status: "cancelled" }).then(() => "resolved", (e: Error) => e.message);
      }), { timeout: T })
      .toBe("permission_denied:shipments.manage");

    const denied = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const s = (await c.shipments.list())[0];
      const tracking = await c.shipments.updateTracking(s.id, { trackingNumber: "X1" }).then(() => "resolved", (e: Error) => e.message);
      const notify = await c.shipments.notifyCustomer(s.id).then(() => "resolved", (e: Error) => e.message);
      const inv = (await c.invoices.list()).find((i: any) => ["pending", "rejected"].includes(i.zatcaStatus)) ?? (await c.invoices.list())[0];
      const resend = await c.invoices.resend(inv.id).then(() => "resolved", (e: Error) => e.message);
      return { tracking, notify, resend };
    });
    expect(denied.tracking).toBe("permission_denied:shipments.manage");
    expect(denied.notify).toBe("permission_denied:shipments.manage");
    /* resend gates on orders.manage — readonly lacks it */
    expect(denied.resend).toBe("permission_denied:orders.manage");
  });

  test("9. composed filters: status + carrier + delayed + COD + search → reset", async ({ page }) => {
    await load(page, `${ADMIN}/shipments`);
    await waitApi(page);
    const probe = await page.evaluate(async () => {
      const c = (window as any).__commerce;
      const s = (await c.shipments.list()).find((x: any) => x.status === "in_transit" && x.codAmount);
      return s ? { carrier: s.carrier, status: s.status, cod: Boolean(s.codAmount) } : null;
    });
    /* compose: status select + carrier select + delayed + COD + search */
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: T });
    await page.locator("[aria-label='الحالة']").first().click();
    await page.getByRole("option", { name: "في الطريق" }).click();
    await expect(page).toHaveURL(/status=in_transit/);
    if (probe?.carrier) {
      await page.locator("[aria-label='الناقل']").click();
      await page.getByRole("option", { name: probe.carrier }).click();
      await expect(page).toHaveURL(new RegExp(`carrier=${encodeURIComponent(probe.carrier)}`));
    }
    /* these checkboxes toggle via router.replace — click then assert the URL */
    await page.getByRole("checkbox", { name: "المتأخرة فقط" }).click();
    await expect(page).toHaveURL(/delayed=1/);
    await page.getByRole("checkbox", { name: "COD فقط" }).click();
    await expect(page).toHaveURL(/cod=1/);
    await page.getByPlaceholder("ابحث برقم التتبع أو الطلب أو العميل").fill(probe ? probe.carrier : "TRK");
    await expect(page).toHaveURL(/q=/);

    /* reset restores the unfiltered list and clears the URL */
    await page.getByRole("button", { name: "إعادة تعيين" }).click();
    await expect(page).toHaveURL(/\/shipments\??$/);
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: T });
  });
});
