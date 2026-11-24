import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Coverage for the features added in this batch:
 *  1. /notifications — mark-all-read hits the mock server
 *  2. /brands — create → list + server-side row
 *  3. maintenance mode — admin toggle → storefront notice page → toggle off
 *  4. social channels — simulated connect lands pending → connected
 */
const S = "/nakhla";
const ADMIN = `${BASES.ADMIN}${S}`;
const T = 15_000;

const load = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
};
const waitApi = (page: Page) => page.waitForFunction(() => (window as unknown as { __commerce?: unknown }).__commerce);

test.describe("new features — الميزات الجديدة", () => {
  test("notifications: mark all read clears unread server-side", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/notifications`);
    await expect(page.getByRole("heading", { name: "الإشعارات" }).first()).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "تحديد الكل كمقروء" }).click();
    await waitApi(page);
    const unread = await page.evaluate(async () => {
      const c = (window as unknown as { __commerce: { notifications: { list: () => Promise<{ read: boolean }[]> } } }).__commerce;
      return (await c.notifications.list()).filter((n) => !n.read).length;
    });
    expect(unread).toBe(0);
  });

  test("brands: create → row renders → server-side brand exists", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/brands`);
    await expect(page.getByRole("heading", { name: "العلامات التجارية" })).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "علامة جديدة" }).click();
    await page.locator("#brand-name").fill("علامة إي-تو-إي");
    await page.locator("#brand-name-en").fill("E2E Brand");
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await expect(page.getByText("علامة إي-تو-إي").first()).toBeVisible({ timeout: T });
    await waitApi(page);
    const exists = await page.evaluate(async () => {
      const c = (window as unknown as { __commerce: { brands: { list: () => Promise<{ name: { ar: string } }[]> } } }).__commerce;
      return (await c.brands.list()).some((b) => b.name.ar === "علامة إي-تو-إي");
    });
    expect(exists).toBe(true);
  });

  test("maintenance: toggle on → storefront notice → toggle off", async ({ page, context }) => {
    test.setTimeout(90_000);
    await load(page, `${ADMIN}/settings/maintenance`);
    await expect(page.getByText("تفعيل وضع الصيانة").first()).toBeVisible({ timeout: T });
    await page.getByRole("switch", { name: "تفعيل وضع الصيانة" }).click();
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await expect(page.getByText(/تم حفظ إعدادات وضع الصيانة/)).toBeVisible({ timeout: T });
    await page.waitForTimeout(800); // persist → cp_db_* cookies

    const store = await context.newPage();
    await load(store, BASES.STOREFRONT);
    await expect(store.getByText("المتجر تحت الصيانة")).toBeVisible({ timeout: T });
    await store.close();

    await page.getByRole("switch", { name: "تفعيل وضع الصيانة" }).click();
    await page.getByRole("button", { name: "حفظ", exact: true }).click();
    await expect(page.getByText(/تم حفظ إعدادات وضع الصيانة/).last()).toBeVisible({ timeout: T });
    await page.waitForTimeout(800);
    const store2 = await context.newPage();
    await load(store2, BASES.STOREFRONT);
    await expect(store2.getByText("المتجر تحت الصيانة")).toHaveCount(0, { timeout: T });
    await store2.close();
  });

  test("social channels: simulated connect flips pending → connected", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/agents/channels`);
    await expect(page.getByText("قنوات التواصل الاجتماعي")).toBeVisible({ timeout: T });
    /* Instagram is seeded connected — the first «ربط» button is a disconnected card. */
    await page.getByRole("button", { name: "ربط", exact: true }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.locator("#social-handle").fill("@nakhla_store");
    await dialog.getByRole("button", { name: "ربط", exact: true }).click();
    await expect(page.getByText("قيد التفعيل").first()).toBeVisible({ timeout: T });
    /* Simulated OAuth resolves after ~2.5s; the query polls while pending. */
    await expect(page.getByText("@nakhla_store", { exact: true })).toBeVisible({ timeout: T });
    await waitApi(page);
    /* Poll until the in-mock setTimeout flips the status. */
    await expect.poll(async () => page.evaluate(async () => {
      const c = (window as unknown as { __commerce: { settings: { channels: { get: () => Promise<{ social: { status: string; handle: string }[] }> } } } }).__commerce;
      return (await c.settings.channels.get()).social.some((s) => s.handle === "@nakhla_store" && s.status === "connected");
    }), { timeout: T }).toBe(true);
  });
});
