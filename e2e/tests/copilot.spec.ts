import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Copilot scenario tests — packages/copilot scenario registry.
 * Merchant scenarios run on /nakhla/copilot (admin), platform scenarios on
 * /copilot (super-admin). Safe actions are executed; dangerous actions are
 * asserted but never executed.
 */
const ADMIN = `${BASES.ADMIN}/nakhla`;
const PLATFORM = BASES.SUPER_ADMIN;
const T = 15_000;

const load = (page: Page, url: string) => page.goto(url, { waitUntil: "domcontentloaded" });

/** Type a prompt in the copilot composer and send it. */
async function ask(page: Page, text: string) {
  const input = page.getByPlaceholder(/اسأل أو اطلب/);
  const send = page.getByRole("button", { name: "إرسال" });
  await expect(input).toBeVisible({ timeout: T });
  // hydration race: fill() before React attaches sets the DOM value but React
  // state stays empty (send stays disabled). Probe with a throwaway char until
  // the controlled input actually enables the button, then type for real.
  for (let i = 0; i < 20; i++) {
    await input.fill("x");
    if (await send.isEnabled().catch(() => false)) break;
    await page.waitForTimeout(500);
  }
  await input.fill(text);
  await expect(send).toBeEnabled({ timeout: T });
  await send.click();
}

/** Execute the safe action card currently shown, assert the done strip. */
async function executeSafe(page: Page) {
  const run = page.getByRole("button", { name: "نفّذ" }).first();
  await expect(run).toBeVisible({ timeout: T });
  await run.click();
  // the text appears in both the done strip and the success toast — take the first
  await expect(page.getByText("تم تنفيذ الإجراء").first()).toBeVisible({ timeout: T });
}

test.describe("copilot — سيناريوهات التاجر", () => {
  test.setTimeout(60_000); // copilot mock latency + parallel workers can exceed 30s
  test.beforeEach(async ({ page }) => {
    await load(page, `${ADMIN}/copilot`);
  });

  test("price raise: «ارفع أسعار العطور 10%» → action card → execute", async ({ page }) => {
    await ask(page, "ارفع أسعار العطور 10%");
    await expect(page.getByText(/رفع الأسعار 10%/)).toBeVisible({ timeout: T });
    await executeSafe(page);
  });

  test("dormant customers: coupon plan card → run all steps", async ({ page }) => {
    await ask(page, "اعمل خطة لاسترجاع العملاء الخاملين");
    await expect(page.getByText(/خطة استرجاع .*عميل خامل/)).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "تنفيذ الكل" }).click();
    await expect(page.getByText(/اكتملت \d+ من \d+ خطوات/)).toBeVisible({ timeout: T });
  });

  test("ramadan: «جهّز المتجر لرمضان» → 5-step plan card", async ({ page }) => {
    await ask(page, "جهّز المتجر لرمضان");
    await expect(page.getByText(/تجهيز المتجر لرمضان/)).toBeVisible({ timeout: T });
    await expect(page.getByRole("button", { name: "تنفيذ الكل" })).toBeVisible();
  });

  test("dangerous delete: archived products → confirm word gate (never executed)", async ({ page }) => {
    await ask(page, "احذف المنتجات المؤرشفة");
    await expect(page.getByText("إجراء خطر — لا يمكن التراجع")).toBeVisible({ timeout: T });
    await expect(page.getByText("حذف المنتجات المؤرشفة نهائياً")).toBeVisible();
    const confirm = page.locator("input[id^='danger-']");
    await expect(confirm).toBeVisible();
    const run = page.getByRole("button", { name: "نفّذ" });
    await expect(run).toBeDisabled();
    await confirm.fill("حذف");
    await expect(run).toBeEnabled();
    // Dangerous — intentionally NOT executed. Cancel instead.
    await page.getByRole("button", { name: "إلغاء" }).last().click();
  });

  test("analysis: «حلل انخفاض المبيعات» → text + weekly table", async ({ page }) => {
    await ask(page, "حلل انخفاض المبيعات");
    await expect(page.getByText("مقارنة أسبوعية")).toBeVisible({ timeout: T });
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("navigation: «افتح الطلبات المعلقة» → filtered orders page", async ({ page }) => {
    await ask(page, "افتح الطلبات المعلقة");
    await expect(page).toHaveURL(/orders/, { timeout: T });
    await expect(page.getByText(/الطلبات/).first()).toBeVisible({ timeout: T });
  });

  test("top products: «وش أفضل المنتجات مبيعاً؟» → table card", async ({ page }) => {
    await ask(page, "وش أفضل المنتجات مبيعاً؟");
    await expect(page.getByText(/أفضل 5 منتجات مبيعاً \(/)).toBeVisible({ timeout: T });
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("add staff: invite with email → action card → execute", async ({ page }) => {
    await ask(page, "أضف موظف سارة على sara@store.sa");
    await expect(page.getByText("دعوة موظف جديد")).toBeVisible({ timeout: T });
    await executeSafe(page);
  });

  test("sub-agent: «أنشئ وكيل للمرتجعات» → action card → execute", async ({ page }) => {
    await ask(page, "أنشئ وكيل للمرتجعات والاستبدال");
    const card = page.getByText("إنشاء وكيل فرعي للمرتجعات").or(page.getByText(/وكيل المرتجعات/));
    await expect(card.first()).toBeVisible({ timeout: T });
    if (await page.getByText("إنشاء وكيل فرعي للمرتجعات").isVisible()) await executeSafe(page);
  });

  test("scheduled task: «ملخص المبيعات كل يوم» → action card → execute", async ({ page }) => {
    await ask(page, "أرسل لي ملخص المبيعات كل يوم الساعة 8 الصبح");
    await expect(page.getByText(/جدولة مهمة يومية/)).toBeVisible({ timeout: T });
    await executeSafe(page);
  });

  test("low stock alert: «نبهني إذا نزل المخزون تحت 3» → action card → execute", async ({ page }) => {
    await ask(page, "نبهني إذا نزل مخزون العطور تحت 3");
    await expect(page.getByText(/تنبيه مخزون — أقل من 3/)).toBeVisible({ timeout: T });
    await executeSafe(page);
  });
});

test.describe("copilot — سيناريوهات المنصة", () => {
  test.setTimeout(60_000); // copilot mock latency + parallel workers can exceed 30s
  test.beforeEach(async ({ page }) => {
    await load(page, `${PLATFORM}/copilot`);
  });

  test("weekly stats: «كم متجر جديد انضم هذا الشهر؟» → latest stores table", async ({ page }) => {
    await ask(page, "كم متجر جديد انضم هذا الشهر؟");
    await expect(page.getByText("أحدث المتاجر")).toBeVisible({ timeout: T });
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("abnormal AI usage → table of stores over the limit", async ({ page }) => {
    await ask(page, "وريني استهلاك AI الشاذ");
    await expect(page.getByText("متاجر فوق حد الاستهلاك")).toBeVisible({ timeout: T });
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("suspend store: clarify → named tenant → danger card (never executed)", async ({ page }) => {
    await ask(page, "أوقف متجر");
    await expect(page.getByText("أحتاج توضيحاً")).toBeVisible({ timeout: T });
    await expect(page.getByText(/أي متجر تقصد/)).toBeVisible();
    // clarify options render as clickable buttons (re-send the picked label)
    const card = page.locator("div.bg-card", { hasText: "أحتاج توضيحاً" }).first();
    await expect(card.getByRole("button").first()).toBeVisible();
    // clarify by naming the tenant explicitly — the engine then resolves it
    await ask(page, "أوقف متجر عطور سما");
    await expect(page.getByText(/إيقاف متجر «/)).toBeVisible({ timeout: T });
    await expect(page.getByText("إجراء خطر — لا يمكن التراجع")).toBeVisible();
    const confirm = page.locator("input[id^='danger-']");
    const run = page.getByRole("button", { name: "نفّذ" });
    await expect(run).toBeDisabled();
    await confirm.fill("إيقاف");
    await expect(run).toBeEnabled();
    // Dangerous — intentionally NOT executed.
  });

  test("retry failed jobs → action card → execute", async ({ page }) => {
    await ask(page, "أعد تشغيل المهام الفاشلة");
    const card = page.getByText(/إعادة تشغيل .*مهمة فاشلة|كل المهام الخلفية شغالة/);
    await expect(card.first()).toBeVisible({ timeout: T });
    if (await page.getByText(/إعادة تشغيل .*مهمة فاشلة/).isVisible()) await executeSafe(page);
  });

  test("monthly report → platform revenue summary", async ({ page }) => {
    await ask(page, "أعطني تقرير المنصة الشهري");
    await expect(page.getByText(/ملخص المنصة|MRR|الاشتراكات/).first()).toBeVisible({ timeout: T });
  });
});
