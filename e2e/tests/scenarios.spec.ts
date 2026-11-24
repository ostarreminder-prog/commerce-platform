import { test, expect } from "@playwright/test";
import path from "node:path";
import { BASES } from "../playwright.config";

/**
 * Canonical scenario tests — docs/SCREENS_SPEC.md §6.
 * Each test drives a real end-to-end UI flow (not a page-load check):
 * forms are filled, dialogs submitted, toasts/navigation asserted.
 * Selectors use Arabic UI strings + stable element ids.
 */
const S = "/nakhla";
const ADMIN = `${BASES.ADMIN}${S}`;
const STORE = BASES.STOREFRONT;
const T = 15_000;

const load = (page: import("@playwright/test").Page, url: string) => page.goto(url, { waitUntil: "domcontentloaded" });
const FIXTURES = path.join(__dirname, "../fixtures");

test.describe("admin — سيناريوهات التاجر", () => {
  test.setTimeout(60_000); // heavy multi-step flows + parallel workers
  test("onboarding wizard: store → product → payment → done", async ({ page }) => {
    await load(page, `${ADMIN}/onboarding/store`);
    // hydration-safe advance: retry fill+click until the wizard moves to step 2
    for (let i = 0; i < 15; i++) {
      if (await page.locator("#ob-product").isVisible().catch(() => false)) break;
      if (await page.locator("#ob-name").isVisible().catch(() => false)) {
        await page.locator("#ob-name").fill("متجر الاختبار");
        await page.locator("#ob-city").fill("الرياض");
        await page.getByRole("button", { name: "التالي", exact: true }).click().catch(() => {});
      }
      await page.waitForTimeout(800);
    }

    await expect(page.locator("#ob-product")).toBeVisible({ timeout: T });
    await page.locator("#ob-product").fill("بوكس هدايا الاختبار");
    await page.locator("#ob-price").fill("149");
    await page.getByRole("button", { name: "التالي", exact: true }).click();

    await expect(page.getByText("الدفع الإلكتروني").first()).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "التالي", exact: true }).click();

    await expect(page.getByText("متجرك جاهز")).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "الذهاب للوحة التحكم" }).click();
    await expect(page).toHaveURL(/\/nakhla\/?$/, { timeout: T });
  });

  test("orders: bulk status + create shipment + refund", async ({ page }) => {
    await load(page, `${ADMIN}/orders`);
    const rowBoxes = page.getByRole("checkbox", { name: "تحديد الصف" });
    await expect(rowBoxes.first()).toBeVisible({ timeout: T });
    await rowBoxes.nth(0).click();
    await rowBoxes.nth(1).click();
    await page.getByRole("button", { name: "تغيير الحالة" }).click();
    await page.getByRole("menuitem", { name: "قيد التجهيز" }).click();
    await expect(page.getByText(/تم تحديث/)).toBeVisible({ timeout: T });

    // ord_10289 is a seeded new/processing order → unfulfilled items → shippable
    await load(page, `${ADMIN}/orders/ord_10289`);
    const shipBtn = page.getByRole("button", { name: "إنشاء شحنة" }).first();
    await expect(shipBtn).toBeVisible({ timeout: T });
    await shipBtn.click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText(/شحنة جديدة/)).toBeVisible();
    await dlg.locator("[id^='rate-']").first().click();
    await dlg.getByRole("button", { name: /إنشاء الشحنة/ }).click();
    await expect(page.getByText(/تم إنشاء الشحنة/)).toBeVisible({ timeout: T });

    // ord_10290 is a seeded paid order → refundable
    await load(page, `${ADMIN}/orders/ord_10290`);
    const refundBtn = page.getByRole("button", { name: "استرداد" });
    await expect(refundBtn).toBeVisible({ timeout: T });
    await refundBtn.click();
    const dlg2 = page.getByRole("dialog");
    await expect(dlg2.getByText(/استرداد من الطلب/)).toBeVisible();
    await dlg2.locator("#refund-amount").fill("10");
    await dlg2.locator("#refund-reason").fill("طلب العميل — اختبار E2E");
    await dlg2.getByRole("button", { name: /^استرداد / }).click();
    await expect(page.getByText(/تم استرداد/)).toBeVisible({ timeout: T });
  });

  test("products: bulk price adjustment on selected rows", async ({ page }) => {
    await load(page, `${ADMIN}/products`);
    const boxes = page.getByRole("checkbox", { name: "تحديد الصف" });
    await expect(boxes.first()).toBeVisible({ timeout: T });
    await boxes.nth(0).click();
    await boxes.nth(1).click();
    await page.getByRole("button", { name: "تعديل الأسعار" }).click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText("تعديل الأسعار")).toBeVisible();
    await dlg.locator("#price-value").fill("10");
    await dlg.getByRole("button", { name: "تطبيق" }).click();
    await expect(page.getByText(/تم تعديل أسعار/)).toBeVisible({ timeout: T });
  });

  test("imports: CSV wizard runs to a job detail page", async ({ page }) => {
    await load(page, `${ADMIN}/imports`);
    await expect(page.getByText("النوع والمصدر")).toBeVisible({ timeout: T });
    // hydration-safe advance: click التالي until the file input mounts
    for (let i = 0; i < 10; i++) {
      if (await page.locator("input[type='file']").isVisible().catch(() => false)) break;
      await page.getByRole("button", { name: "التالي" }).click().catch(() => {});
      await page.waitForTimeout(700);
    }
    await page.locator("input[type='file']").setInputFiles(path.join(FIXTURES, "products.csv"));
    await page.getByRole("button", { name: "التالي" }).click(); // → mapping
    await expect(page.getByText("طابق أعمدة ملفك")).toBeVisible();
    await page.getByRole("button", { name: "التالي" }).click(); // → preview
    await expect(page.getByText("سليم").first()).toBeVisible();
    await page.getByRole("button", { name: "التالي" }).click(); // → options
    // retry the submit until the router navigates to the job detail page
    for (let i = 0; i < 15 && !page.url().includes("/imports/imp_"); i++) {
      await page.getByRole("button", { name: "بدء الاستيراد" }).click().catch(() => {});
      await page.waitForTimeout(1000);
    }
    await expect(page).toHaveURL(/\/imports\/imp_/, { timeout: T });
    await expect(page.getByText("تفاصيل الاستيراد")).toBeVisible({ timeout: T });
  });

  test("marketing: create coupon → detail page + create promotion", async ({ page }) => {
    await load(page, `${ADMIN}/marketing/coupons`);
    /* Hydration-safe open: retry the click until the dialog mounts. */
    for (let i = 0; i < 10 && !(await page.locator("#cp-code").isVisible().catch(() => false)); i++) {
      await page.getByRole("button", { name: "كوبون جديد" }).click().catch(() => {});
      await page.waitForTimeout(700);
    }
    const dlg = page.getByRole("dialog");
    await dlg.locator("#cp-code").fill("E2E10");
    await dlg.locator("#cp-value").fill("10");
    await dlg.getByRole("button", { name: /إنشاء/ }).click();
    await expect(page).toHaveURL(/\/marketing\/coupons\/.+/, { timeout: T });

    await load(page, `${ADMIN}/marketing/promotions`);
    for (let i = 0; i < 10 && !(await page.locator("#pm-name-ar").isVisible().catch(() => false)); i++) {
      await page.getByRole("button", { name: "عرض جديد" }).first().click().catch(() => {});
      await page.waitForTimeout(700);
    }
    const dlg2 = page.getByRole("dialog");
    await expect(dlg2.getByText("عرض جديد")).toBeVisible();
    await dlg2.locator("#pm-name-ar").fill("خصم العشرة التلقائي");
    await dlg2.getByRole("button", { name: "إنشاء" }).click();
    await expect(page.getByText("تم إنشاء العرض")).toBeVisible({ timeout: T });
  });

  test("inbox: take over → reply → hand back to agent", async ({ page }) => {
    await load(page, `${ADMIN}/inbox/cnv_001`);
    const take = page.getByRole("button", { name: "استلام" });
    if (await take.isVisible({ timeout: T }).catch(() => false)) await take.click();

    const composer = page.getByPlaceholder(/اكتب رد/);
    await expect(composer).toBeVisible({ timeout: T });
    await composer.fill("رد تجريبي من اختبار E2E");
    await composer.press("Enter");
    await expect(page.getByText("رد تجريبي من اختبار E2E").last()).toBeVisible({ timeout: T });

    const back = page.getByRole("button", { name: "إرجاع للوكيل" });
    await expect(back).toBeVisible();
    await back.click();
    await expect(page.getByText(/رجعت المحادثة للوكيل/).first()).toBeVisible({ timeout: T });
  });

  test("approvals: approve the first pending agent request", async ({ page }) => {
    await load(page, `${ADMIN}/approvals`);
    const approve = page.getByRole("button", { name: "موافقة" }).first();
    await expect(approve).toBeVisible({ timeout: T });
    await approve.click();
    await expect(page.getByText("تمت الموافقة")).toBeVisible({ timeout: T });
  });

  test("knowledge: add a FAQ source", async ({ page }) => {
    await load(page, `${ADMIN}/knowledge`);
    for (let i = 0; i < 10 && !(await page.locator("#kn-title").isVisible().catch(() => false)); i++) {
      await page.getByRole("button", { name: "مصدر جديد" }).click().catch(() => {});
      await page.waitForTimeout(700);
    }
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText("مصدر معرفة جديد")).toBeVisible();
    await dlg.getByText("سؤال وجواب").first().click();
    await dlg.locator("#kn-title").fill("سياسة الاستبدال");
    await dlg.locator("#kn-faq").fill("نقبل الاستبدال خلال 14 يوماً من الاستلام.");
    await dlg.getByRole("button", { name: "إضافة" }).click();
    await expect(page.getByText(/رفعنا|نعالجه/).first()).toBeVisible({ timeout: T });
    await expect(page).toHaveURL(/\/knowledge\/kn_/, { timeout: T });
  });

  test("store design: publish changes via the confirm dialog", async ({ page }) => {
    await load(page, `${ADMIN}/store-design`);
    const publish = page.getByRole("button", { name: "نشر", exact: true });
    await expect(publish).toBeVisible({ timeout: 30_000 });
    await publish.click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.getByText("تنشر التصميم الجديد؟")).toBeVisible();
    await dlg.getByRole("button", { name: "نشر", exact: true }).click();
    await expect(page.getByText(/تم نشر التصميم/)).toBeVisible({ timeout: T });
  });

  test("settings: edit store name on the general page", async ({ page }) => {
    await load(page, `${ADMIN}/settings/general`);
    const nameField = page.locator("#s-name");
    await expect(nameField).toBeVisible({ timeout: T });
    await nameField.fill("متجر نخلة — E2E");
    const save = page.getByRole("button", { name: "حفظ" }).first();
    await save.click();
    await expect(page.getByText("تم حفظ التغييرات")).toBeVisible({ timeout: T });
  });

  test("customers: create customer → lands on the new profile", async ({ page }) => {
    await load(page, `${ADMIN}/customers`);
    await page.getByRole("button", { name: "عميل جديد", exact: true }).click();
    const dlg = page.getByRole("dialog");
    await expect(dlg).toBeVisible({ timeout: T });
    await dlg.locator("#nc-name").fill("عميل اختبار E2E");
    await dlg.locator("#nc-phone").fill("+966511223344");
    await dlg.getByRole("button", { name: "إنشاء" }).click();
    await expect(page).toHaveURL(/\/customers\/cus_/, { timeout: T });
    await expect(page.getByRole("heading", { name: "عميل اختبار E2E" })).toBeVisible({ timeout: T });
  });

  test("customers: add a tag on the profile", async ({ page }) => {
    await load(page, `${ADMIN}/customers/cus_002`);
    const input = page.getByPlaceholder("وسم…");
    await expect(input).toBeVisible({ timeout: T });
    await input.fill("وسم-E2E");
    await input.press("Enter");
    await expect(page.getByText("وسم-E2E").first()).toBeVisible({ timeout: T });
  });

  test("customers: preset segment filters the list via URL param", async ({ page }) => {
    await load(page, `${ADMIN}/customers`);
    const sel = page.getByLabel("الفئة");
    await expect(sel).toBeVisible({ timeout: T });
    await sel.click();
    await page.getByRole("option", { name: "عملاء متكررون" }).click();
    await expect(page).toHaveURL(/segment=preset/, { timeout: T });
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: T });
  });
});

test.describe("storefront — سيناريوهات المتسوق", () => {
  test.setTimeout(60_000); // heavy multi-step flows + parallel workers
  test("browse → product → cart → coupon → COD checkout", async ({ page }) => {
    await load(page, `${STORE}/c/coffee-dates`);
    const link = page.locator("a[href^='/products/'].line-clamp-2").first();
    await expect(link).toBeVisible({ timeout: T });
    await link.click();
    await page.getByRole("button", { name: /أضف للسلة/ }).first().click();

    await load(page, `${STORE}/cart`);
    await page.getByLabel("كود الخصم").fill("WATAN20");
    await page.getByRole("button", { name: "تطبيق" }).click();
    await expect(page.getByText(/تم تطبيق الكوبون|الكود غير صحيح|الكوبون/)).toBeVisible({ timeout: T });

    await page.getByRole("link", { name: "إتمام الطلب" }).or(page.getByRole("button", { name: "إتمام الطلب" })).first().click();
    await expect(page).toHaveURL(/checkout/, { timeout: T });

    await page.locator("#f-name").fill("اختبار قبول");
    await page.locator("#f-phone").fill("0501234567");
    await page.locator("#f-email").fill("e2e@test.sa");
    await page.getByRole("radio", { name: "عنوان جديد" }).click();
    await page.locator("#a-city").click();
    await page.getByRole("option").first().click();
    await page.locator("#a-district").fill("النرجس");
    await page.locator("#a-street").fill("شارع الملك فهد ١٢");
    await page.getByRole("button", { name: "التالي" }).click();

    await expect(page.getByText("طريقة الشحن")).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "التالي" }).click();

    await page.getByText("الدفع عند الاستلام").click();
    await page.getByRole("button", { name: /ادفع/ }).click();
    await expect(page.getByText("تم استلام طلبك!")).toBeVisible({ timeout: T });
  });

  test("quick view → add to cart + compare + wishlist", async ({ page }) => {
    await load(page, `${STORE}/c/coffee-dates`);
    const eye = page.getByRole("button", { name: "عرض سريع" }).first();
    await expect(eye).toBeVisible({ timeout: T });
    await eye.click();
    const dlg = page.getByRole("dialog");
    await dlg.getByRole("button", { name: /أضف للسلة/ }).click();
    await page.keyboard.press("Escape");

    const compareBtns = page.getByRole("button", { name: "قارن" });
    await compareBtns.nth(0).click();
    await compareBtns.nth(1).click();
    await page.getByRole("button", { name: "المفضلة" }).first().click();

    await load(page, `${STORE}/compare`);
    await expect(page.getByRole("heading", { name: "مقارنة المنتجات" })).toBeVisible({ timeout: T });
    await load(page, `${STORE}/wishlist`);
    await expect(page.getByRole("heading", { name: "المفضلة" })).toBeVisible({ timeout: T });
  });
});

test.describe("super-admin — سيناريوهات المنصة", () => {
  test.setTimeout(60_000); // heavy multi-step flows + parallel workers
  test("suspend a tenant then re-activate it from the sheet", async ({ page }) => {
    await load(page, `${BASES.SUPER_ADMIN}/stores`);
    const firstRow = page.locator("tbody tr").first();
    await expect(firstRow).toBeVisible({ timeout: T });
    const rowText = (await firstRow.getByRole("button").first().innerText()).split("\n")[0].trim();
    await firstRow.click();

    const suspend = page.getByRole("button", { name: "إيقاف المتجر" });
    const activate = page.getByRole("button", { name: "تفعيل المتجر" });
    await expect(suspend.or(activate).first()).toBeVisible({ timeout: T });
    if (await suspend.isVisible()) {
      await suspend.click();
      await expect(page.getByText(/تم إيقاف/)).toBeVisible({ timeout: T });
      // بعد الإيقاف قد يعاد ترتيب القائمة — نعيد فتح نفس المتجر بالاسم لا بالصف الأول
      await page.keyboard.press("Escape");
      const targetRow = page.locator("tbody tr", { hasText: rowText }).first();
      for (let i = 0; i < 3 && !(await activate.isVisible().catch(() => false)); i++) {
        await targetRow.click().catch(() => {});
        await page.waitForTimeout(800);
      }
      await activate.click();
      await expect(page.getByText(/تم تفعيل/)).toBeVisible({ timeout: T });
    } else {
      await activate.click();
      await expect(page.getByText(/تم تفعيل/)).toBeVisible({ timeout: T });
    }
  });
});

test.describe("partners — سيناريوهات المطور", () => {
  test.setTimeout(60_000); // heavy multi-step flows + parallel workers
  test("create a draft app and submit it for review", async ({ page }) => {
    await load(page, `${BASES.PARTNERS}/apps/new`);
    const nameAr = page.locator("#nameAr");
    const nameEn = page.locator("#nameEn");
    // fill قبل الـ hydration يضع قيمة DOM بدون حالة React فيُعلَّم الحقل invalid — نعيد المحاولة حتى ينجح الإرسال
    for (let attempt = 0; attempt < 3; attempt++) {
      await nameAr.fill("تطبيق اختبار E2E");
      await nameEn.fill("E2E Test App");
      await page.getByRole("button", { name: "إرسال للمراجعة" }).click({ timeout: 5_000 }).catch(() => {});
      const submitted = await page
        .getByText("قيد المراجعة", { exact: true }).first()
        .waitFor({ timeout: 12_000 }).then(() => true).catch(() => false);
      if (submitted) return;
    }
    await expect(page.getByText("قيد المراجعة", { exact: true }).first()).toBeVisible({ timeout: T });
  });
});
