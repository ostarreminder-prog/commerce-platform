/* measure.mjs — real production metrics for report §ح.
 * Computes per-route first-load JS from .next/app-build-manifest.json and
 * measures LCP on the served production build via Playwright PerformanceObserver.
 * Usage: pnpm build && pnpm start (all apps) → node scripts/ui-report/measure.mjs
 * Writes reports/ui/metrics.json consumed by collect.mjs → render.mjs. */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync as rd, writeFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const req = createRequire(path.join(ROOT, "e2e/package.json"));
const { chromium } = req("@playwright/test");

const TARGETS = [
  { app: "storefront", url: "http://localhost:3001/", manifest: "/(site)/page", label: "المتجر — الرئيسية /" },
  { app: "storefront", url: "http://localhost:3001/p/saudi-cardamom-coffee-500g", manifest: "/(site)/p/[slug]/page", label: "المتجر — منتج /p/…" },
  { app: "storefront", url: "http://localhost:3001/c/coffee-dates", manifest: "/(site)/c/[slug]/page", label: "المتجر — تصنيف /c/…" },
  { app: "admin", url: "http://localhost:3000/nakhla", manifest: "/(dashboard)/[store]/page", label: "لوحة التاجر — الرئيسية" },
];

function firstLoadJsKb(app, key) {
  const mf = path.join(ROOT, "apps", app, ".next/app-build-manifest.json");
  if (!existsSync(mf)) return null;
  const files = JSON.parse(rd(mf, "utf8")).pages?.[key];
  if (!files) return null;
  let sum = 0;
  for (const f of files) {
    const p = path.join(ROOT, "apps", app, ".next", f);
    if (existsSync(p) && f.endsWith(".js")) sum += statSync(p).size;
  }
  return Math.round(sum / 1024);
}

async function measureLcp(browser, url) {
  const page = await browser.newPage();
  try {
    await page.addInitScript(() => {
      window.__lcp = 0;
      new PerformanceObserver((list) => {
        const e = list.getEntries();
        if (e.length) window.__lcp = e[e.length - 1].startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 45_000 });
    await page.waitForTimeout(2500); // let late LCP candidates (images) settle
    return Math.round(await page.evaluate(() => window.__lcp));
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch();
const routes = [];
for (const t of TARGETS) {
  const lcpMs = await measureLcp(browser, t.url).catch(() => null);
  routes.push({ app: t.app, label: t.label, url: t.url, manifest: t.manifest, firstLoadJsKb: firstLoadJsKb(t.app, t.manifest), lcpMs });
  console.log(t.label, "→", routes.at(-1));
}
await browser.close();

const out = { measuredAt: new Date().toISOString(), mode: "production (next build + next start)", routes };
mkdirSync(path.join(ROOT, "reports/ui"), { recursive: true });
writeFileSync(path.join(ROOT, "reports/ui/metrics.json"), JSON.stringify(out, null, 2), "utf8");
console.log("→ reports/ui/metrics.json");
