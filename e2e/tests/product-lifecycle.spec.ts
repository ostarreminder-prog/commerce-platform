import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Product lifecycle regression tests — covers gaps fixed in the lifecycle audit:
 * 1. barcode search across /products and /inventory
 * 2. publish/save guard on the product editor (name + valid price required)
 * 3. product → /reviews?product=<id> deep link actually filters the reviews screen
 *
 * Seeded fixture: prd_001 «قهوة سعودية بالهيل 500 جم» (single variant, SKU NK-COF-1001,
 * barcode 6281000000000 — generated in packages/mocks/src/spec/index.ts).
 */
const S = "/nakhla";
const ADMIN = `${BASES.ADMIN}${S}`;
const BARCODE = "6281000000000";

const load = (page: Page, url: string) => page.goto(url, { waitUntil: "domcontentloaded" });

test.describe("product lifecycle — دورة حياة المنتج", () => {
  test("barcode search narrows products and inventory lists to the matching variant", async ({ page }) => {
    await load(page, `${ADMIN}/products`);
    const search = page.getByLabel("اسم المنتج أو SKU أو الباركود");
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.fill(BARCODE);
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.locator("tbody").getByText("قهوة سعودية بالهيل 500 جم")).toBeVisible();

    await load(page, `${ADMIN}/inventory`);
    const invSearch = page.getByLabel("منتج أو SKU أو باركود");
    await expect(invSearch).toBeVisible({ timeout: 15_000 });
    await invSearch.fill(BARCODE);
    await expect(page.locator("tbody").getByText("قهوة سعودية بالهيل 500 جم")).toBeVisible();
    await expect(page.locator("tbody").getByText("NK-COF-1001")).toBeVisible();
  });

  test("new product cannot be saved/published without a name and a valid price", async ({ page }) => {
    test.setTimeout(60_000);
    await load(page, `${ADMIN}/products/new`);
    const save = page.getByRole("button", { name: "حفظ" });
    await expect(save).toBeVisible({ timeout: 15_000 });
    /* The save button sits in a fixed bottom bar that the Next.js dev-tools
     * overlay covers in dev mode — dispatch the click straight to the element. */
    const clickSave = () => save.dispatchEvent("click");

    /* No name → name error, stays on the form. */
    await clickSave();
    await expect(page.getByText("الاسم بالعربي مطلوب").first()).toBeVisible();
    expect(page.url()).toContain("/products/new");

    /* Name but no/invalid price → price error. */
    await page.locator("#p-name").fill("منتج اختبار النشر");
    await clickSave();
    await expect(page.getByText("السعر مطلوب").first()).toBeVisible();
    expect(page.url()).toContain("/products/new");

    /* Complete the required fields → product is created and we land on its editor. */
    await page.getByLabel("السعر", { exact: true }).fill("45");
    await clickSave();
    await page.waitForURL(/\/products\/prd_/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "منتج اختبار النشر" })).toBeVisible();
  });

  test("editor related links: reviews screen filters by ?product=<id>", async ({ page }) => {
    await load(page, `${ADMIN}/products/prd_001`);
    const link = page.getByRole("link", { name: "تقييمات المنتج" });
    await expect(link).toBeVisible({ timeout: 15_000 });
    await link.click();
    await page.waitForURL(/\/reviews\?product=prd_001/, { timeout: 10_000 });
    /* The filter chip shows the product name and can be cleared. */
    await expect(page.getByRole("button", { name: /قهوة سعودية بالهيل 500 جم/ })).toBeVisible();
  });
});
