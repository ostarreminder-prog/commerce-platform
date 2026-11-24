import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

/**
 * Cross-unit flows — the seams between copilot, knowledge and Agent Studio.
 * 1) Copilot creates a sub-agent that must appear on /agents.
 * 2) The seeded FAQ knowledge source linked to the main agent answers a free
 *    question in the studio test lab (no scripted route matches it).
 */
const ADMIN = `${BASES.ADMIN}/nakhla`;
const T = 15_000;

const load = (page: Page, url: string) => page.goto(url, { waitUntil: "domcontentloaded" });

/** Type a prompt in the copilot composer and send it (hydration-safe). */
async function ask(page: Page, text: string) {
  const input = page.getByPlaceholder(/اسأل أو اطلب/);
  const send = page.getByRole("button", { name: "إرسال" });
  await expect(input).toBeVisible({ timeout: T });
  for (let i = 0; i < 20; i++) {
    await input.fill("x");
    if (await send.isEnabled().catch(() => false)) break;
    await page.waitForTimeout(500);
  }
  await input.fill(text);
  await expect(send).toBeEnabled({ timeout: T });
  await send.click();
}

test.describe("cross-unit — copilot × studio × knowledge", () => {
  test.setTimeout(60_000);

  test("copilot creates the returns agent → visible in Agent Studio", async ({ page }) => {
    await load(page, `${ADMIN}/copilot`);
    await ask(page, "أنشئ وكيل للمرتجعات والاستبدال");
    const card = page.getByText("إنشاء وكيل فرعي للمرتجعات").or(page.getByText(/موجود مسبقاً/));
    await expect(card.first()).toBeVisible({ timeout: T });
    if (await page.getByText("إنشاء وكيل فرعي للمرتجعات").isVisible()) {
      await page.getByRole("button", { name: "نفّذ" }).first().click();
      await expect(page.getByText("تم تنفيذ الإجراء").first()).toBeVisible({ timeout: T });
    }
    /* The mock store lives in browser memory — a hard goto() would reseed it
     * and drop the new agent. Follow the card link (SPA navigation) instead. */
    await page.getByRole("link", { name: "استوديو الوكلاء" }).first().click();
    await expect(page).toHaveURL(/\/agents/, { timeout: T });
    await expect(page.getByText("وكيل المرتجعات والاستبدال").first()).toBeVisible({ timeout: T });
  });

  test("price raise → execute → undo restores the snapshot", async ({ page }) => {
    await load(page, `${ADMIN}/copilot`);
    await ask(page, "ارفع أسعار العطور 10%");
    await expect(page.getByText(/رفع الأسعار 10%/)).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "نفّذ" }).first().click();
    await expect(page.getByText("تم تنفيذ الإجراء").first()).toBeVisible({ timeout: T });
    await page.getByRole("button", { name: "تراجع" }).first().click();
    await expect(page.getByText("تم التراجع عن الإجراء").first()).toBeVisible({ timeout: T });
  });

  test("linked knowledge answers a free question in the test lab", async ({ page }) => {
    await load(page, `${ADMIN}/agents/test`);
    const input = page.getByPlaceholder(/اكتب رسالة|اكتب سؤالك/);
    const send = page.getByRole("button", { name: "إرسال" });
    await expect(input).toBeVisible({ timeout: T });
    for (let i = 0; i < 20; i++) {
      await input.fill("x");
      if (await send.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(500);
    }
    // «التوصيل» matches no scripted route — the reply must come from the linked FAQ source
    await input.fill("كم مدة التوصيل؟");
    await expect(send).toBeEnabled({ timeout: T });
    await send.click();
    await expect(page.getByText(/من 1 إلى 3 أيام عمل/).first()).toBeVisible({ timeout: T });
  });
});
