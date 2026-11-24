/* index.mjs — orchestrates collection → screenshots → render.
 * Flags: --fast (skip screenshots+checks? no: skips screenshots only) · --shots-only (screenshots, no report) */
import {
  APPS, collectCopilot, collectCoverage, collectDesign, collectEntities, collectFiles,
  collectHooks, collectI18n, collectJsSize, collectMetrics, collectNav, collectPermissions,
  collectRoutes, collectSpecDiff, collectTodos, pingServers, runChecks,
} from "./collect.mjs";
import { takeShots } from "./shots.mjs";
import { render } from "./render.mjs";

const args = process.argv.slice(2);
const FAST = args.includes("--fast");
const SHOTS_ONLY = args.includes("--shots-only");
const SKIP_CHECKS = args.includes("--no-checks");

const log = (...m) => console.log("[ui-report]", ...m);

log("جمع البيانات من الكود…");
const routes = collectRoutes();
const servers = await pingServers();
log("الخوادم:", APPS.map((a) => `${a}:${servers[a] ? "up" : "DOWN"}`).join(" "));

const canonical = routes.smokeTargets.map((t) => ({ app: t.app, real: t.url }));
if (SHOTS_ONLY) {
  const shots = await takeShots(canonical, servers);
  log(`انتهى — ${shots.results.length} مساراً.`, shots.error ?? "");
  process.exit(0);
}

const [design, copilot, i18n, entities, hooks, perms, todos, jsSize] = await Promise.all([
  Promise.resolve(collectDesign()), collectCopilot(), Promise.resolve(collectI18n()),
  Promise.resolve(collectEntities()), Promise.resolve(collectHooks()),
  Promise.resolve(collectPermissions()), Promise.resolve(collectTodos()), Promise.resolve(collectJsSize()),
]);
const nav = collectNav();
collectCoverage(routes.routes);
const specDiff = collectSpecDiff(routes.routes);

let checks = { e2e: { ran: false } };
if (SKIP_CHECKS) log("تخطّي الفحوص (--no-checks)");
else { log("تشغيل الفحوص (typecheck/lint/contracts/e2e)…"); checks = runChecks(APPS.map((a) => servers[a])); }

let shots = { results: [] };
if (FAST) log("--fast: تخطّي اللقطات");
else { log("التقاط الصفحات…"); shots = await takeShots(canonical, servers); }

// merge HTTP status seen during shots back into routes
for (const s of shots.results) {
  const r = routes.routes.find((x) => x.app === s.app && x.real === s.route);
  if (r && s.status) r.status = s.status;
}

render({ generatedAt: new Date().toLocaleString("ar-SA-u-nu-latn", { timeZone: "Asia/Riyadh" }), routes, servers, nav, design, copilot, i18n, entities, hooks, perms, specDiff, checks, files: collectFiles(), todos, jsSize, metrics: collectMetrics(), shots });
log("تم ✓ docs/UI_REPORT.md + reports/ui/index.html" + (FAST ? "" : " + reports/ui/shots/"));
