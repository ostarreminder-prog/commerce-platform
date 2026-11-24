import { chromium } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../design-concepts");
const out = path.join(root, "shots");
const pages = [
  ["direction-a", "index"], ["direction-a", "product"],
  ["direction-b", "index"], ["direction-b", "product"],
  ["direction-b", "collection"], ["direction-b", "search"],
  ["direction-b", "cart"], ["direction-b", "drawer"],
  ["direction-b", "checkout"], ["direction-b", "confirm"], ["direction-b", "states"],
  ["direction-b/fashion", "index"], ["direction-b/fashion", "product"],
  ["direction-c", "index"], ["direction-c", "product"],
];
const sizes = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const browser = await chromium.launch();
for (const [dir, page] of pages) {
  for (const s of sizes) {
    const ctx = await browser.newContext({
      viewport: { width: s.width, height: s.height },
      deviceScaleFactor: s.name === "mobile" ? 2 : 2,
      isMobile: s.name === "mobile",
    });
    const pg = await ctx.newPage();
    await pg.goto(`file://${path.join(root, dir, page + ".html")}`, { waitUntil: "networkidle" });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(600);
    await pg.screenshot({ path: `${out}/${dir}-${page}-${s.name}.png`, fullPage: true });
    await ctx.close();
    console.log(`✓ ${dir}/${page} ${s.name}`);
  }
}
await browser.close();
