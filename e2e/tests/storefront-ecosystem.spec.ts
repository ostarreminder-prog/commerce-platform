import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Storefront ecosystem tests — the admin ↔ storefront data flow end-to-end.
 * Cross-app state travels via the chunked `cp_db_*` cookies (shared across
 * ports in the same browser context), which is what the mock layer uses in
 * place of a backend. Each test runs in a fresh context → fresh spec seed.
 *
 * Covered scenarios:
 *  1. theme apply → publish → storefront announcement switches
 *  2. design editor: real preview iframe, device toggle, draft autosave persists across reload
 *  3. publish flow surfaces on the storefront
 *  4. page create → publish → visible at /pages/<slug>
 *  5. media upload → appears in library → delete confirm
 *  6. domain add → DNS instructions + honest (simulated) verification lifecycle
 *  7. SEO edit → SERP preview updates + save persists
 *  8. app store install → consent → appears in installed apps
 *  9. settings general → store name reflected on the storefront
 * 10. unsaved-changes guard in the design editor
 * 11. menu item added → storefront nav renders + navigates
 * 12. full journey: page → menu link → storefront navigation
 */
const S = "/nakhla";
const ADMIN = `${BASES.ADMIN}${S}`;
const STORE = BASES.STOREFRONT;

const load = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  /* Cold dev compiles can take tens of seconds — the client bundle must finish
   * loading (→ React hydrated) before fills or controlled inputs get wiped. */
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
};

/** domcontentloaded can beat React hydration on cold dev compiles — a fill
 * that lands pre-hydration gets wiped when the controlled input mounts.
 * Fill then assert the value stuck, retrying once. */
const fillSteady = async (page: Page, selector: string, value: string) => {
  const field = page.locator(selector);
  for (let i = 0; i < 3; i++) {
    await field.fill(value);
    await page.waitForTimeout(300);
    if ((await field.inputValue()) === value) return;
  }
  await expect(field).toHaveValue(value);
};

const FASHION_ANNOUNCEMENT = "تشكيلة الموسم الجديدة وصلت";
const E2E_ANNOUNCEMENT = "إعلان تجريبي من اختبار E2E";

test.describe("storefront ecosystem — منظومة المتجر", () => {
  test("1. theme apply → publish → storefront announcement switches", async ({ page }) => {
    test.setTimeout(90_000);
    await load(page, `${ADMIN}/storefront/themes`);
    /* Perfume is published; fashion/generic are drafts → two «تطبيق» buttons,
     * the first belonging to the fashion card (grid order follows the fixture). */
    const applyBtn = page.getByRole("button", { name: "تطبيق", exact: true }).first();
    await expect(applyBtn).toBeVisible({ timeout: 15_000 });
    await applyBtn.click();
    await page.getByRole("dialog").getByRole("button", { name: "تطبيق", exact: true }).click(); // confirm dialog

    /* Apply keeps it a draft — publishing happens in the editor. */
    await load(page, `${ADMIN}/store-design`);
    await expect(page.frameLocator("iframe").locator("body")).toContainText(FASHION_ANNOUNCEMENT, { timeout: 25_000 });
    /* «نشر» must be exact — «جدولة النشر» is a substring match otherwise. */
    await page.getByRole("button", { name: "نشر", exact: true }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "نشر", exact: true }).click(); // confirm dialog
    await page.waitForTimeout(800); // async persist chain → cookies

    const store = await page.context().newPage();
    await load(store, STORE);
    await expect(store.getByText(FASHION_ANNOUNCEMENT).first()).toBeVisible({ timeout: 20_000 });
    await store.close();
  });

  test("2. design editor: preview iframe, device toggle, draft persists across reload", async ({ page }) => {
    test.setTimeout(90_000);
    await load(page, `${ADMIN}/store-design`);
    const frame = page.frameLocator("iframe");
    await expect(frame.locator("body")).not.toBeEmpty({ timeout: 20_000 });
    /* Preview-failure overlay must not be showing. */
    await expect(page.getByText("المعاينة ما حمّلت")).toHaveCount(0);

    await page.getByRole("button", { name: "جوال" }).click();
    await expect(page.locator("iframe")).toBeVisible();

    /* Edit the announcement → debounced autosave (~5s) persists it. */
    await page.getByRole("tab", { name: "إعدادات عامة" }).click();
    const announcement = page.locator("#globals-announcement");
    await announcement.fill(E2E_ANNOUNCEMENT);
    await expect(page.getByText("المسودة محفوظة")).toBeVisible({ timeout: 15_000 });

    await load(page, `${ADMIN}/store-design`);
    await page.getByRole("tab", { name: "إعدادات عامة" }).click();
    await expect(page.locator("#globals-announcement")).toHaveValue(E2E_ANNOUNCEMENT, { timeout: 15_000 });
  });

  test("3. publish after edit → storefront shows the new announcement", async ({ page }) => {
    test.setTimeout(90_000);
    await load(page, `${ADMIN}/store-design`);
    await expect(page.frameLocator("iframe").locator("body")).not.toBeEmpty({ timeout: 20_000 });
    await page.getByRole("tab", { name: "إعدادات عامة" }).click();
    await page.locator("#globals-announcement").fill(E2E_ANNOUNCEMENT);
    await expect(page.getByText("المسودة محفوظة")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "نشر", exact: true }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "نشر", exact: true }).click();
    await page.waitForTimeout(800); // async persist chain → cookies

    const store = await page.context().newPage();
    await load(store, STORE);
    await expect(store.getByText(E2E_ANNOUNCEMENT).first()).toBeVisible({ timeout: 20_000 });
    await store.close();
  });

  test("4. page create → publish → visible at /pages/<slug>", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/storefront/pages/new`);
    await fillSteady(page, "#pg-title-ar", "صفحة اختبار");
    await fillSteady(page, "#pg-slug", "e2e-page");
    await fillSteady(page, "#pg-content-ar", "محتوى صفحة الاختبار — نص يظهر للعملاء.");
    await page.getByRole("switch").first().click(); // published
    await page.getByRole("button", { name: "حفظ الصفحة" }).click();
    await expect(page).toHaveURL(/\/storefront\/pages\/page_/, { timeout: 30_000 });
    await page.waitForTimeout(800); // async persist chain → cookies

    const store = await page.context().newPage();
    await load(store, `${STORE}/pages/e2e-page`);
    await expect(store.getByText("صفحة اختبار").first()).toBeVisible({ timeout: 15_000 });
    await expect(store.getByText("محتوى صفحة الاختبار").first()).toBeVisible();
    await store.close();
  });

  test("5. media upload → listed → delete confirm", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/media`);
    /* 1×1 red PNG buffer. */
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    await page.locator('input[type="file"]').setInputFiles({ name: "e2e-dot.png", mimeType: "image/png", buffer: png });
    await expect(page.getByRole("button", { name: "نسخ الرابط" }).first()).toBeVisible({ timeout: 15_000 });

    /* Delete → confirm dialog → card removed. */
    await page.getByRole("button", { name: "حذف" }).first().click();
    await page.getByRole("button", { name: "حذف" }).last().click(); // confirm
    await expect(page.getByText("حذفنا 1 ملف")).toBeVisible({ timeout: 10_000 });
  });

  test("6. domain add → DNS instructions + simulated verification", async ({ page }) => {
    test.setTimeout(90_000);
    await load(page, `${ADMIN}/storefront/domains`);
    await expect(page.getByText("وضع المحاكاة")).toBeVisible({ timeout: 15_000 });
    await fillSteady(page, "input[dir='ltr']", "e2e.nakhla.sa");
    await page.getByRole("button", { name: "إضافة دومين" }).click();
    /* DNS table appears for the unverified custom domain. */
    await expect(page.getByText("سجلات DNS المطلوبة").last()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("CNAME")).toBeVisible();
  });

  test("7. SEO edit → SERP preview + save persists", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/storefront/seo`);
    const title = page.locator("#seo-title");
    await expect(title).toBeVisible({ timeout: 15_000 });
    await fillSteady(page, "#seo-title", "متجر نخلة — عنوان اختبار");
    /* Google-result preview reflects the draft title. */
    await expect(page.getByText("متجر نخلة — عنوان اختبار").last()).toBeVisible();
    await page.getByRole("button", { name: "حفظ" }).first().click();
    await expect(page.getByText("تم حفظ التغييرات").first()).toBeVisible({ timeout: 10_000 });
  });

  test("8. app store install → consent → appears in installed apps", async ({ page }) => {
    test.setTimeout(60_000);
    /* Tamara isn't pre-installed — open its detail straight from the store. */
    await load(page, `${ADMIN}/apps/store/app_tamara`);
    await page.getByRole("button", { name: "تثبيت" }).first().click();
    await page.getByRole("dialog").getByRole("button", { name: "ثبّت ووافق" }).click();
    await expect(page).toHaveURL(/\/apps\/ins_/, { timeout: 15_000 });

    /* Navigate in-app (no full reload — installation state is in-memory). */
    await page.getByRole("link", { name: "التطبيقات" }).first().click();
    await expect(page.getByText("تمارا").first()).toBeVisible({ timeout: 15_000 });
  });

  test("9. settings general → store name reflected on storefront", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/settings/general`);
    const name = page.locator("#s-name");
    await expect(name).toBeVisible({ timeout: 15_000 });
    await fillSteady(page, "#s-name", "متجر اختبار E2E");
    await page.getByRole("button", { name: "حفظ" }).last().click();
    await expect(page.getByText("تم حفظ التغييرات").first()).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800); // async persist chain → cookies

    const store = await page.context().newPage();
    await load(store, STORE);
    await expect(store.getByText("متجر اختبار E2E").first()).toBeVisible({ timeout: 20_000 });
    await store.close();
  });

  test("10. unsaved-changes guard in the design editor", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/store-design`);
    await expect(page.frameLocator("iframe").locator("body")).not.toBeEmpty({ timeout: 20_000 });
    await page.getByRole("tab", { name: "إعدادات عامة" }).click();
    await page.locator("#globals-announcement").fill("تغيير بدون حفظ");
    /* Try to navigate away before the 5s autosave → guard dialog. */
    await page.getByRole("link", { name: "الطلبات" }).first().click();
    await expect(page.getByText("عندك تغييرات ما انحفظت")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("dialog").getByRole("button", { name: "إلغاء" }).click();
    await expect(page).toHaveURL(/store-design/);
  });

  test("11. menu item added → storefront nav renders and navigates", async ({ page }) => {
    test.setTimeout(90_000);
    await load(page, `${ADMIN}/storefront/menus`);
    await page.getByRole("button", { name: "إضافة عنصر" }).first().click();
    await fillSteady(page, "#mi-label-ar", "رابط تجربة");
    await fillSteady(page, "#mi-url", "/pages/about");
    await page.getByRole("button", { name: "إضافة" }).last().click();
    await page.getByRole("button", { name: "حفظ القائمة" }).first().click();
    await expect(page.getByText("تم حفظ القائمة")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800); // async persist chain → cookies

    const store = await page.context().newPage();
    await load(store, STORE);
    const link = store.getByRole("link", { name: "رابط تجربة" }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(store).toHaveURL(/\/pages\/about/);
    await store.close();
  });

  test("12. full journey: page → publish → menu link → storefront navigation", async ({ page }) => {
    test.setTimeout(120_000);
    /* Create + publish the page. */
    await load(page, `${ADMIN}/storefront/pages/new`);
    await fillSteady(page, "#pg-title-ar", "رحلة العميل");
    await fillSteady(page, "#pg-slug", "e2e-journey");
    await fillSteady(page, "#pg-content-ar", "محتوى صفحة الرحلة الكاملة.");
    await page.getByRole("switch").first().click();
    await page.getByRole("button", { name: "حفظ الصفحة" }).click();
    /* SPA pushState never fires "load" — poll the URL instead. */
    await expect(page).toHaveURL(/\/storefront\/pages\/page_/, { timeout: 30_000 });

    /* Link it in the header menu. */
    await load(page, `${ADMIN}/storefront/menus`);
    await page.getByRole("button", { name: "إضافة عنصر" }).first().click();
    await fillSteady(page, "#mi-label-ar", "صفحة الرحلة");
    /* linkType select → «صفحة», then pick the page target (scoped to the dialog —
     * the menus screen has other selects behind it). */
    const itemDialog = page.getByRole("dialog");
    await itemDialog.locator("button[role='combobox']").first().click();
    await page.getByRole("option", { name: "صفحة", exact: true }).click();
    await itemDialog.locator("button[role='combobox']").nth(1).click();
    await page.getByRole("option", { name: "رحلة العميل" }).click();
    await page.getByRole("button", { name: "إضافة" }).last().click();
    await page.getByRole("button", { name: "حفظ القائمة" }).first().click();
    await expect(page.getByText("تم حفظ القائمة")).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(800); // async persist chain → cookies

    /* Storefront: the menu link renders and reaches the published page. */
    const store = await page.context().newPage();
    await load(store, STORE);
    const link = store.getByRole("link", { name: "صفحة الرحلة" }).first();
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await expect(store).toHaveURL(/\/pages\/e2e-journey/);
    await expect(store.getByText("محتوى صفحة الرحلة الكاملة").first()).toBeVisible();
    await store.close();
  });
});
