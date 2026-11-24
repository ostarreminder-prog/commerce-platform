import { test, expect, type Page } from "@playwright/test";
import { BASES } from "../playwright.config";

const S = "/nakhla"; // store slug
const ADMIN_ROUTES = [
  `${S}`,
  `${S}/copilot`,
  `${S}/copilot/tasks`,
  `${S}/copilot/history`,
  `${S}/orders`,
  `${S}/orders/new`,
  `${S}/orders/ord_10290`,
  `${S}/products`,
  `${S}/brands`,
  `${S}/notifications`,
  `${S}/reviews`,
  `${S}/products/new`,
  `${S}/products/prd_001`,
  `${S}/categories`,
  `${S}/collections`,
  `${S}/collections/new`,
  `${S}/collections/col_gifts`,
  `${S}/inventory`,
  `${S}/inventory/var_001`,
  `${S}/imports`,
  `${S}/imports/imp_1`,
  `${S}/customers`,
  `${S}/customers/cus_002`,
  `${S}/marketing`,
  `${S}/marketing/coupons`,
  `${S}/marketing/promotions`,
  `${S}/marketing/loyalty`,
  `${S}/marketing/gift-cards`,
  `${S}/marketing/affiliates`,
  `${S}/products/price-lists`,
  `${S}/inventory/locations`,
  `${S}/inbox`,
  `${S}/inbox/cnv_001`,
  `${S}/conversations`,
  `${S}/approvals`,
  `${S}/knowledge`,
  `${S}/knowledge/kn_faq`,
  `${S}/agents`,
  `${S}/agents/agt_sales`,
  `${S}/agents/channels`,
  `${S}/agents/live`,
  `${S}/agents/history`,
  `${S}/agents/test`,
  `${S}/abandoned-carts`,
  `${S}/abandoned-carts/cart_101`,
  `${S}/returns`,
  `${S}/returns/new`,
  `${S}/returns/ret_5001`,
  `${S}/shipments`,
  `${S}/shipments/shp_10290`,
  `${S}/shipments/shp_10280`,
  `${S}/invoices`,
  `${S}/invoices/inv_10289`,
  `${S}/invoices/inv_10287`,
  `${S}/reports`,
  `${S}/reports/sales`,
  `${S}/reports/products`,
  `${S}/reports/customers`,
  `${S}/reports/agents`,
  `${S}/reports/tax`,
  `${S}/apps`,
  `${S}/apps/store`,
  `${S}/apps/store/app_tabby`,
  `${S}/apps/ins_smsa`,
  `${S}/shipping`,
  `${S}/store-design`,
  `${S}/storefront/themes`,
  `${S}/storefront/pages`,
  `${S}/storefront/pages/page_about`,
  `${S}/storefront/pages/new`,
  `${S}/storefront/menus`,
  `${S}/storefront/domains`,
  `${S}/storefront/seo`,
  `${S}/media`,
  `${S}/onboarding`,
  `${S}/onboarding/store`,
  `${S}/onboarding/product`,
  `${S}/onboarding/payment`,
  `${S}/onboarding/done`,
  `${S}/settings`,
  `${S}/settings/general`,
  `${S}/settings/payments`,
  `${S}/settings/shipping`,
  `${S}/settings/taxes`,
  `${S}/settings/notifications`,
  `${S}/settings/maintenance`,
  `${S}/settings/channels`,
  `${S}/settings/staff`,
  `${S}/settings/roles`,
  `${S}/settings/audit`,
  `${S}/settings/billing`,
  `${S}/settings/developers`,
  `${S}/settings/danger`,
  `${S}/settings/verification`,
  `${S}/settings/copilot`,
  `${S}/settings/profile`,
  `${S}/settings/regional`,
  "/login",
  "/signup",
  "/signup/verify",
  "/signup/store",
  "/forgot",
  "/mfa",
  "/invite/inv_demo",
  "/dev/messages",
  "/design-system",
];

const OTHER_PAGES = [
  { name: "storefront /", url: `${BASES.STOREFRONT}/` },
  { name: "storefront /cart", url: `${BASES.STOREFRONT}/cart` },
  { name: "storefront /wishlist", url: `${BASES.STOREFRONT}/wishlist` },
  { name: "storefront /compare", url: `${BASES.STOREFRONT}/compare` },
  { name: "storefront /checkout", url: `${BASES.STOREFRONT}/checkout` },
  { name: "storefront /products/prd_dates", url: `${BASES.STOREFRONT}/products/prd_001` },
  { name: "storefront /p/[slug]", url: `${BASES.STOREFRONT}/p/saudi-cardamom-coffee-500g` },
  { name: "storefront /c/[slug]", url: `${BASES.STOREFRONT}/c/coffee-dates` },
  { name: "storefront /search", url: `${BASES.STOREFRONT}/search?q=coffee` },
  { name: "storefront /order/[token]", url: `${BASES.STOREFRONT}/order/ord_10290` },
  { name: "storefront /pages/[slug]", url: `${BASES.STOREFRONT}/pages/about` },
  { name: "storefront /account/login", url: `${BASES.STOREFRONT}/account/login` },
  { name: "storefront /account/orders", url: `${BASES.STOREFRONT}/account/orders` },
  { name: "storefront /account/orders/[id]", url: `${BASES.STOREFRONT}/account/orders/ord_10290` },
  { name: "storefront /account/addresses", url: `${BASES.STOREFRONT}/account/addresses` },
  { name: "storefront /account/profile", url: `${BASES.STOREFRONT}/account/profile` },
  { name: "storefront /account/rewards", url: `${BASES.STOREFRONT}/account/rewards` },
  { name: "storefront /offers", url: `${BASES.STOREFRONT}/offers` },
  { name: "storefront /brands", url: `${BASES.STOREFRONT}/brands` },
  { name: "storefront /brands/[id]", url: `${BASES.STOREFRONT}/brands/brn_daraloud` },
  { name: "storefront /faq", url: `${BASES.STOREFRONT}/faq` },
  { name: "storefront /contact", url: `${BASES.STOREFRONT}/contact` },
  { name: "storefront /track", url: `${BASES.STOREFRONT}/track` },
  { name: "storefront /returns/request", url: `${BASES.STOREFRONT}/returns/request` },
  { name: "storefront /gift-cards", url: `${BASES.STOREFRONT}/gift-cards` },
  { name: "storefront /preview", url: `${BASES.STOREFRONT}/preview` },
  { name: "super-admin /", url: `${BASES.SUPER_ADMIN}/` },
  { name: "super-admin /copilot", url: `${BASES.SUPER_ADMIN}/copilot` },
  { name: "super-admin /stores", url: `${BASES.SUPER_ADMIN}/stores` },
  { name: "super-admin /tenants", url: `${BASES.SUPER_ADMIN}/tenants` },
  { name: "super-admin /stores/tnt_001", url: `${BASES.SUPER_ADMIN}/stores/tnt_001` },
  { name: "super-admin /plans", url: `${BASES.SUPER_ADMIN}/plans` },
  { name: "super-admin /plans/starter", url: `${BASES.SUPER_ADMIN}/plans/starter` },
  { name: "super-admin /subscriptions", url: `${BASES.SUPER_ADMIN}/subscriptions` },
  { name: "super-admin /usage", url: `${BASES.SUPER_ADMIN}/usage` },
  { name: "super-admin /ai-usage", url: `${BASES.SUPER_ADMIN}/ai-usage` },
  { name: "super-admin /apps-review", url: `${BASES.SUPER_ADMIN}/apps-review` },
  { name: "super-admin /apps-review/sub_pricing", url: `${BASES.SUPER_ADMIN}/apps-review/sub_pricing` },
  { name: "super-admin /partners", url: `${BASES.SUPER_ADMIN}/partners` },
  { name: "super-admin /providers", url: `${BASES.SUPER_ADMIN}/providers` },
  { name: "super-admin /jobs", url: `${BASES.SUPER_ADMIN}/jobs` },
  { name: "super-admin /logs", url: `${BASES.SUPER_ADMIN}/logs` },
  { name: "super-admin /flags", url: `${BASES.SUPER_ADMIN}/flags` },
  { name: "super-admin /themes", url: `${BASES.SUPER_ADMIN}/themes` },
  { name: "super-admin /team", url: `${BASES.SUPER_ADMIN}/team` },
  { name: "partners /", url: `${BASES.PARTNERS}/` },
  { name: "partners /signup", url: `${BASES.PARTNERS}/signup` },
  { name: "partners /apps", url: `${BASES.PARTNERS}/apps` },
  { name: "partners /apps/new", url: `${BASES.PARTNERS}/apps/new` },
  { name: "partners /apps/app_sync", url: `${BASES.PARTNERS}/apps/app_sync` },
  { name: "partners /apps/app_sync/settings", url: `${BASES.PARTNERS}/apps/app_sync/settings` },
  { name: "partners /apps/app_sync/scopes", url: `${BASES.PARTNERS}/apps/app_sync/scopes` },
  { name: "partners /apps/app_sync/webhooks", url: `${BASES.PARTNERS}/apps/app_sync/webhooks` },
  { name: "partners /apps/app_sync/listing", url: `${BASES.PARTNERS}/apps/app_sync/listing` },
  { name: "partners /apps/app_sync/review", url: `${BASES.PARTNERS}/apps/app_sync/review` },
  { name: "partners /apps/app_sync/analytics", url: `${BASES.PARTNERS}/apps/app_sync/analytics` },
  { name: "partners /test-stores", url: `${BASES.PARTNERS}/test-stores` },
  { name: "partners /docs", url: `${BASES.PARTNERS}/docs` },
];

// Error overlays that indicate a broken screen
const BROKEN_PATTERNS = [
  "Application error",
  "Internal Server Error",
  "This page could not be found",
  "Unhandled Runtime Error",
];

// Routes that intentionally 404 outside `next dev` (page calls notFound() in production)
const DEV_ONLY_ROUTES = new Set(["/dev/messages"]);

async function checkPage(page: Page, url: string, { devOnly = false } = {}) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(String(err)));
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  const res = await page.goto(url, { waitUntil: "domcontentloaded" });
  expect(res, `no response for ${url}`).not.toBeNull();
  if (devOnly && res!.status() === 404) return; // dev-only screen: production notFound() is expected
  expect(res!.status(), `HTTP ${res!.status()} for ${url}`).toBeLessThan(400);
  // wait for content to render
  await expect(page.locator("body")).not.toBeEmpty();
  const bodyText = await page.locator("body").innerText();
  for (const pattern of BROKEN_PATTERNS) {
    expect(bodyText, `"${pattern}" found on ${url}`).not.toContain(pattern);
  }
  const fatal = consoleErrors.filter((e) => /Minified React error|Hydration failed|Missing message|Could not find/i.test(e));
  expect(fatal, `console errors on ${url}`).toEqual([]);
  expect(pageErrors, `uncaught errors on ${url}`).toEqual([]);
}

for (const route of new Set(ADMIN_ROUTES)) {
  test(`admin ${route}`, async ({ page }) => {
    test.setTimeout(60_000);
    await checkPage(page, `${BASES.ADMIN}${route}`, { devOnly: DEV_ONLY_ROUTES.has(route) });
  });
}

for (const p of OTHER_PAGES) {
  test(p.name, async ({ page }) => {
    test.setTimeout(60_000);
    await checkPage(page, p.url);
  });
}
