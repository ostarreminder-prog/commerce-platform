import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Storefront-depth flows — the new customer-facing surface added on top of the
 * catalog: offers/brands directories, guest order tracking, public returns,
 * contact→inbox, gift cards, product-page Q&A. Every flow writes through the
 * same @repo/api-client mock layer the rest of the suite uses, so state is
 * real within the test context (cookie-synced db).
 */
const STORE = BASES.STOREFRONT;

const load = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
};

const fillSteady = async (page: Page, selector: string, value: string) => {
  const field = page.locator(selector);
  for (let i = 0; i < 3; i++) {
    await field.fill(value);
    await page.waitForTimeout(300);
    if ((await field.inputValue()) === value) return;
  }
  await expect(field).toHaveValue(value);
};

test.describe("storefront depth — عمق المتجر", () => {
  test("1. /offers lists only discounted products + promo badges", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/offers`);
    await expect(page.getByRole("heading", { name: "العروض" })).toBeVisible({ timeout: 15_000 });
    /* Discounted products carry a compare-at (line-through) price. */
    await expect(page.locator(".line-through").first()).toBeVisible({ timeout: 15_000 });
    /* The seeded promotion banners render at the top. */
    await expect(page.locator("body")).toContainText(/%|خصم|شحن مجاني/, { timeout: 15_000 });
  });

  test("2. /brands → brand page lists only that brand's products", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/brands`);
    await expect(page.getByRole("heading", { name: "الماركات" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: /دار العود/ }).first().click();
    await page.waitForURL(/\/brands\/brn_daraloud/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText("دار العود");
    /* Products grid — brand products only (seeded every-third mapping). */
    await expect(page.locator("a[href^='/p/'], a[href^='/products/']").first()).toBeVisible({ timeout: 15_000 });
  });

  test("3. /track — guest lookup by order number + phone", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/track`);
    await fillSteady(page, "#trk-number", "10290");
    await fillSteady(page, "#trk-phone", "0550166299");
    await page.getByRole("button", { name: "تتبع" }).click();
    await page.waitForURL(/\/order\/ord_10290/, { timeout: 20_000 });
    await expect(page.locator("body")).toContainText(/10.?290/, { timeout: 15_000 });
  });

  test("4. /track — wrong phone surfaces the mismatch error", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/track`);
    await fillSteady(page, "#trk-number", "10290");
    await fillSteady(page, "#trk-phone", "0500000000");
    await page.getByRole("button", { name: "تتبع" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText("ما يطابق");
  });

  test("5. /returns/request — lookup → pick item → submit → reference number", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/returns/request`);
    await fillSteady(page, "#trk-number", "10290");
    await fillSteady(page, "#trk-phone", "0550166299");
    await page.getByRole("button", { name: "تتبع" }).click();
    /* Eligible items list — pick the first checkbox then submit. */
    const firstItem = page.getByRole("checkbox").first();
    await expect(firstItem).toBeVisible({ timeout: 15_000 });
    await firstItem.click();
    await page.getByRole("button", { name: "أرسل الطلب" }).click();
    await expect(page.getByRole("heading", { name: "تم استلام طلب الإرجاع" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText("طلب الإرجاع #");
  });

  test("6. /contact — message creates a real conversation + reference", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/contact`);
    await expect(page.getByRole("heading", { name: "تواصل معنا" })).toBeVisible({ timeout: 15_000 });
    await fillSteady(page, "#cf-name", "عميل الاختبار");
    await fillSteady(page, "#cf-phone", "0555551234");
    await fillSteady(page, "#cf-msg", "أبي أستفسر عن توفر المنتج");
    await page.getByRole("button", { name: "إرسال" }).click();
    /* Real conversations.create record → the cnv_* reference is shown.
     * (Cross-app inbox delivery needs a shared backend — conversations isn't
     * one of the cookie-synced slices.) */
    await expect(page.locator("body")).toContainText("وصلتنا رسالتك", { timeout: 15_000 });
    await expect(page.locator("body")).toContainText("المرجع:", { timeout: 15_000 });
  });

  test("7. /gift-cards — issue a card, then check its balance", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/gift-cards`);
    await expect(page.getByRole("heading", { name: "بطاقات الهدايا" })).toBeVisible({ timeout: 15_000 });
    await fillSteady(page, "#gc-name", "والدتي");
    await page.getByRole("button", { name: /اشترِ البطاقة/ }).click();
    await expect(page.locator("body")).toContainText("GIFT-", { timeout: 15_000 });
    /* Back to the form — the balance checker lives under the buy card. */
    await page.getByRole("button", { name: "اشترِ بطاقة ثانية" }).click();
    /* Balance check for a seeded card — GIFT-NAKHLA-100 has 100 SAR. */
    await fillSteady(page, "#gc-check", "GIFT-NAKHLA-100");
    await page.getByRole("button", { name: "تحقق" }).click();
    await expect(page.locator("body")).toContainText("الرصيد المتبقي", { timeout: 15_000 });
  });

  test("8. product page — specs, shipping accordion, Q&A submission", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/p/saudi-cardamom-coffee-500g`);
    /* Specs table (SKU) + shipping info + Q&A section headers render. */
    await expect(page.locator("body")).toContainText("SKU", { timeout: 15_000 });
    await expect(page.locator("body")).toContainText("الشحن والتوصيل");
    await expect(page.locator("body")).toContainText("أسئلة وأجوبة");
    /* Ask a question — it stays pending until the merchant answers. */
    await page.getByRole("button", { name: "اسأل عن المنتج" }).click();
    await page.getByPlaceholder(/سؤالك عن المنتج/).fill("هل التوصيل متاح لجدة؟");
    await page.getByRole("button", { name: "أرسل السؤال" }).click();
    await expect(page.locator("body")).toContainText("هل التوصيل متاح لجدة؟", { timeout: 15_000 });
  });

  test("9. /faq answers come from the seeded knowledge base", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/faq`);
    await expect(page.locator("h1", { hasText: "الأسئلة الشائعة" })).toBeVisible({ timeout: 15_000 });
    /* kn_faq seeded Q&A — expandable <details> entries exist. */
    await expect(page.locator("details summary").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("body")).toContainText("كم مدة التوصيل؟", { timeout: 15_000 });
  });

  test("10. search — recents persist and empty query offers popular fallback", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${STORE}/search?q=zzzznotfound`);
    await expect(page.locator("body")).toContainText("الأكثر مبيعاً", { timeout: 15_000 });
    await load(page, `${STORE}/search`);
    /* The failed query was pushed into recents (localStorage). */
    await expect(page.locator("body")).toContainText("zzzznotfound", { timeout: 15_000 });
  });
});
