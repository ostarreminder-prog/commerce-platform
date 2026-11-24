/* shots.mjs — Playwright screenshots for every canonical route. */
import { createRequire } from "node:module";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { APPS, BASES, ROOT } from "./collect.mjs";

const SHOTS = path.join(ROOT, "reports/ui/shots");
const EN_SAMPLE = ["/nakhla", "/nakhla/orders", "/nakhla/products", "/nakhla/settings", "/", "/cart", "/p/", "/search", "/apps", "/tenants", "/plans", "/docs"];
const slug = (r) => (r === "/" ? "index" : r.replace(/^\//, "").replaceAll("/", "_").replaceAll("?", "_").replaceAll("=", "-"));

async function loadPlaywright() {
  const req = createRequire(path.join(ROOT, "e2e/package.json"));
  for (const pkg of ["@playwright/test", "playwright", "playwright-core"]) {
    try {
      const mod = await import(`file://${req.resolve(pkg)}`);
      const pw = mod.chromium ? mod : mod.default; // CJS interop
      if (pw?.chromium) return pw;
    } catch { /* try next */ }
  }
  throw new Error("no playwright package resolvable from e2e/");
}

/** combos: ar full matrix (desktop/mobile × light/dark) + en desktop-light sample */
const COMBOS = [
  { vp: { width: 1440, height: 900 }, mode: "light", lang: "ar", tag: "desktop_light_ar" },
  { vp: { width: 1440, height: 900 }, mode: "dark", lang: "ar", tag: "desktop_dark_ar" },
  { vp: { width: 390, height: 844 }, mode: "light", lang: "ar", tag: "mobile_light_ar" },
  { vp: { width: 390, height: 844 }, mode: "dark", lang: "ar", tag: "mobile_dark_ar" },
  { vp: { width: 1440, height: 900 }, mode: "light", lang: "en", tag: "desktop_light_en", sample: true },
];

export async function takeShots(canonical, servers) {
  const results = [];
  const down = APPS.filter((a) => !servers[a]);
  if (down.length) results.push({ note: `خوادم غير متاحة (تخطّيت تطبيقاتها): ${down.join(", ")}` });
  let chromium;
  try { chromium = (await loadPlaywright()).chromium; }
  catch (e) { return { results, error: `playwright غير متوفر: ${e.message}` }; }
  let browser;
  try { browser = await chromium.launch(); }
  catch (e) { return { results, error: `تعذر تشغيل المتصفح: ${e.message}` }; }

  const queue = canonical.filter((r) => servers[r.app]);
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const r = queue.shift();
      const url = `${BASES[r.app]}${r.real}`;
      const entry = { app: r.app, route: r.real, files: [], errors: [] };
      const dir = path.join(SHOTS, r.app); mkdirSync(dir, { recursive: true });
      const combos = COMBOS.filter((c) => !c.sample || EN_SAMPLE.some((s) => r.real === s || r.real.startsWith(s)));
      const missing = combos.filter((c) => !existsSync(path.join(dir, `${slug(r.real)}_${c.tag}.png`)));
      for (const c of combos) entry.files.push(`shots/${r.app}/${slug(r.real)}_${c.tag}.png`);
      if (!missing.length) {
        try { entry.status = (await fetch(url, { signal: AbortSignal.timeout(15000) })).status; } catch { /* status unknown */ }
        results.push(entry); process.stdout.write(`\r  shots: ${results.length}/${canonical.length} (cached)`); continue;
      }
      for (const c of missing) {
        let ctx;
        try {
          ctx = await browser.newContext({ viewport: c.vp, colorScheme: c.mode, locale: c.lang === "ar" ? "ar-SA" : "en-US" });
          await ctx.addCookies([{ name: "NEXT_LOCALE", value: c.lang, url: BASES[r.app] }]);
          const page = await ctx.newPage();
          const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await page.waitForTimeout(1200);
          entry.status = res?.status() ?? entry.status;
          await page.screenshot({ path: path.join(dir, `${slug(r.real)}_${c.tag}.png`) });
        } catch (e) { entry.errors.push(`${c.tag}: ${String(e.message ?? e).slice(0, 120)}`); entry.files = entry.files.filter((f) => !f.endsWith(`_${c.tag}.png`)); }
        finally { await ctx?.close().catch(() => {}); }
      }
      results.push(entry);
      process.stdout.write(`\r  shots: ${results.length}/${canonical.length}`);
    }
  });
  await Promise.all(workers);
  // section library: storefront /preview full page
  if (servers.storefront) {
    try {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${BASES.storefront}/preview`, { waitUntil: "networkidle", timeout: 60_000 });
      mkdirSync(path.join(SHOTS, "storefront"), { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, "storefront", "preview_full.png"), fullPage: true });
      results.push({ app: "storefront", route: "/preview (full-page)", files: ["shots/storefront/preview_full.png"], errors: [] });
      await ctx.close();
    } catch (e) { results.push({ app: "storefront", route: "/preview (full-page)", files: [], errors: [String(e.message ?? e).slice(0, 120)] }); }
  }
  await browser.close();
  console.log();
  return { results };
}
