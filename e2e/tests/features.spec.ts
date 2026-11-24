import { test, expect } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Feature interaction tests — theme-system stages C–E (بند 7/8).
 * Storefront selectors use the Arabic UI strings (default ar-SA locale);
 * admin selectors target roles/landmarks so they survive copy tweaks.
 */
const S = "/nakhla"; // store slug
const STORE = BASES.STOREFRONT;
const ADMIN = `${BASES.ADMIN}${S}`;

const load = (page: import("@playwright/test").Page, url: string) => page.goto(url, { waitUntil: "domcontentloaded" });

test.describe("storefront — مميزات المتجر", () => {
  test("wishlist: heart on product card → /wishlist shows the product", async ({ page }) => {
    await load(page, `${STORE}/c/coffee-dates`);
    const nameLink = page.locator("a[href^='/products/'].line-clamp-2").first();
    await expect(nameLink).toBeVisible({ timeout: 15_000 });
    const name = (await nameLink.innerText()).trim();
    await page.getByRole("button", { name: "المفضلة" }).first().click();
    await load(page, `${STORE}/wishlist`);
    await expect(page.getByRole("heading", { name: "المفضلة" })).toBeVisible();
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("quick view: card eye button opens the product dialog", async ({ page }) => {
    await load(page, `${STORE}/c/coffee-dates`);
    const eye = page.getByRole("button", { name: "عرض سريع" }).first();
    await expect(eye).toBeVisible({ timeout: 15_000 });
    await eye.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "عرض المنتج" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: /أضف للسلة|نفذ/ })).toBeVisible();
  });

  test("compare: two products → /compare renders the spec table", async ({ page }) => {
    await load(page, `${STORE}/c/coffee-dates`);
    const compareBtns = page.getByRole("button", { name: "قارن" });
    await expect(compareBtns.first()).toBeVisible({ timeout: 15_000 });
    const names = await page.locator("a[href^='/products/'].line-clamp-2").allInnerTexts();
    await compareBtns.nth(0).click();
    await compareBtns.nth(1).click();
    await load(page, `${STORE}/compare`);
    await expect(page.getByRole("heading", { name: "مقارنة المنتجات" })).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("table").getByText(names[0].trim()).first()).toBeVisible();
    await expect(page.locator("table").getByText(names[1].trim()).first()).toBeVisible();
    // spec rows: price / rating / stock / category / description
    await expect(page.locator("table")).toContainText("السعر");
    await expect(page.locator("table")).toContainText("التصنيف");
  });

  test("PDP reviews: approved reviews + summary visible on prd_008", async ({ page }) => {
    await load(page, `${STORE}/products/prd_008`);
    await expect(page.getByRole("heading", { name: "التقييمات" })).toBeVisible({ timeout: 15_000 });
    // rev_05 + rev_06 are the two approved mock reviews for prd_008
    await expect(page.getByText("بخور يريح البيت").first()).toBeVisible();
    await expect(page.getByText("مشتري موثّق").first()).toBeVisible();
  });

  test("back-to-top appears after scrolling past the fold", async ({ page }) => {
    await load(page, `${STORE}/c/coffee-dates`);
    // wait for real content — while skeletons show, the page may be too short to scroll past 600px
    await expect(page.locator("a[href^='/products/'].line-clamp-2").first()).toBeVisible({ timeout: 15_000 });
    const btn = page.getByRole("button", { name: "العودة للأعلى" });
    await expect(btn).toHaveClass(/opacity-0/);
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight }));
    await expect(btn).toHaveClass(/opacity-100/);
  });
});

test.describe("admin — أدوات المحرر والمراجعة", () => {
  test("/media loads the media library", async ({ page }) => {
    await load(page, `${ADMIN}/media`);
    await expect(page.getByRole("heading", { name: "مكتبة الوسائط" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByPlaceholder(/ابحث/).or(page.getByRole("searchbox"))).toBeVisible();
  });

  test("/reviews loads the moderation table", async ({ page }) => {
    await load(page, `${ADMIN}/reviews`);
    await expect(page.getByRole("heading", { name: "التقييمات" }).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.locator("table")).toBeVisible();
    // rev_05 mock review text (prd_008)
    await expect(page.getByText("بخور يريح البيت")).toBeVisible();
  });

  test("/store-design renders the live preview iframe", async ({ page }) => {
    await load(page, `${ADMIN}/store-design`);
    await expect(page.locator("iframe").first()).toBeVisible({ timeout: 20_000 });
  });
});
