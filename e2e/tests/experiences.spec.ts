import { test, expect, type Page, type Locator } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Adaptive Commerce Experience Engine — the `view` setting on featured-products
 * sections flows through the editor → publish → storefront `data-experience`
 * wrapper. Admin on :3000/nakhla, storefront on :3001.
 *
 * Covered scenarios:
 *  1. view = editorial-showcase → publish → storefront renders the editorial experience
 *  2. view = contextual-shopping + hotspot block → publish → scene dot opens the product card
 *  3. suggestion chip: a section with one product suggests immersive-product; applying sets the view
 *  4. page experience: product template picker → publish → real PDP renders the immersive variant
 */
const S = "/nakhla";
const ADMIN = `${BASES.ADMIN}${S}`;
const STORE = BASES.STOREFRONT;

const load = async (page: Page, url: string) => {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  /* Cold dev compiles take tens of seconds — let hydration settle. */
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
};

/**
 * The «نمط العرض» (view) select — located by its FieldRow label, not by combobox
 * order (the preview panel's persona select would otherwise steal `.first()`).
 */
const viewSelect = (page: Page): Locator =>
  page.getByText("نمط العرض", { exact: true }).locator("..").getByRole("combobox");

/** Open the editor and select the home template's featured-products section. */
const openEditor = async (page: Page) => {
  await load(page, `${ADMIN}/store-design`);
  await expect(page.frameLocator("iframe").locator("body")).not.toBeEmpty({ timeout: 25_000 });
  await page.getByRole("button", { name: "منتجات مميزة" }).click();
  await expect(viewSelect(page)).toBeVisible({ timeout: 10_000 });
};

/** Pick an experience from the «نمط العرض» select, wait for autosave, publish. */
const publish = async (page: Page) => {
  await expect(page.getByText("المسودة محفوظة")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "نشر", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "نشر", exact: true }).click();
  await page.waitForTimeout(800); // async persist chain → cookies
};

test.describe("commerce experiences — تجارب التجارة", () => {
  test("1. view → editorial-showcase publishes to the storefront", async ({ page }) => {
    test.setTimeout(120_000);
    await openEditor(page);
    await viewSelect(page).click();
    await page.getByRole("option", { name: "عرض تحريري" }).click();
    await publish(page);

    const store = await page.context().newPage();
    await load(store, STORE);
    await expect(store.locator('[data-experience="editorial-showcase"]')).toBeVisible({ timeout: 20_000 });
    await store.close();
  });

  test("2. contextual-shopping: hotspot block → scene dot opens the mini card", async ({ page }) => {
    test.setTimeout(120_000);
    await openEditor(page);
    await viewSelect(page).click();
    await page.getByRole("option", { name: "تسوّق سياقي" }).click();

    /* Experience fields render below the section fields — the «نقاط المنتجات»
     * blocks editor gets a single «إضافة» button (one allowed block type). */
    await page.getByRole("button", { name: "إضافة", exact: true }).click();
    /* The hotspot's productId entity-ref renders as a combobox labeled «المنتج». */
    await page.getByText("المنتج", { exact: true }).locator("..").getByRole("combobox").click();
    await page.getByRole("option").first().click();
    await publish(page);

    const store = await page.context().newPage();
    await load(store, STORE);
    const section = store.locator('[data-experience="contextual-shopping"]');
    await expect(section).toBeVisible({ timeout: 20_000 });
    await expect(section.locator("[data-scene]")).toBeVisible();
    const dot = section.locator("[data-hotspot]").first();
    await expect(dot).toBeVisible();
    await dot.click();
    await expect(section.locator("[data-hotspot-card]")).toBeVisible();
    await store.close();
  });

  test("3. suggestion chip: one-product section → apply sets the view", async ({ page }) => {
    test.setTimeout(120_000);
    await openEditor(page);

    /* Uncheck picked products until exactly one remains — the engine then
     * suggests «منتج غامر» (single-product reason). */
    for (let i = 0; i < 20; i++) {
      const checked = page.getByRole("checkbox", { checked: true });
      if ((await checked.count()) <= 1) break;
      await checked.first().click();
      await page.waitForTimeout(150);
    }
    await expect(page.getByRole("checkbox", { checked: true })).toHaveCount(1);

    await expect(page.getByText("تجربة مقترحة")).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "تطبيق" }).first().click();
    /* Applied — the view select now shows the immersive experience. */
    await expect(viewSelect(page)).toContainText("منتج غامر", { timeout: 10_000 });
  });

  test("4. page experience: product template → immersive variant on the real PDP", async ({ page }) => {
    test.setTimeout(180_000);
    await load(page, `${ADMIN}/store-design`);
    await expect(page.frameLocator("iframe").locator("body")).not.toBeEmpty({ timeout: 25_000 });

    /* Switch to the product template — the «نمط تجربة الصفحة» picker appears
     * under the template switcher (writes theme.pageExperiences.product). */
    await page.getByRole("button", { name: "صفحة المنتج" }).click();
    const expSelect = page.getByText("نمط تجربة الصفحة", { exact: true }).locator("..").getByRole("combobox");
    await expect(expSelect).toBeVisible({ timeout: 10_000 });
    await expSelect.click();
    await page.getByRole("option", { name: "منتج غامر" }).click();
    await publish(page);

    const store = await page.context().newPage();
    await load(store, STORE);
    await store.locator('a[href^="/products/"]').first().click();
    await expect(store.locator('[data-experience="immersive-product"]')).toBeVisible({ timeout: 20_000 });
    await store.close();

    /* Restore the classic PDP so follow-up specs aren't affected. */
    await expSelect.click();
    await page.getByRole("option", { name: "كلاسيكي" }).click();
    await publish(page);
  });
});
