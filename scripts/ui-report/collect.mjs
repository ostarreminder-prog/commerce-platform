/* collect.mjs — gathers every fact the UI report needs, straight from the code. */
import { execFileSync, execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
export const APPS = ["admin", "storefront", "super-admin", "partners"];
export const PORTS = { admin: 3000, storefront: 3001, "super-admin": 3002, partners: 3003 };
export const BASES = Object.fromEntries(APPS.map((a) => [a, `http://localhost:${PORTS[a]}`]));
const rp = (...p) => path.join(ROOT, ...p);
const rd = (p) => readFileSync(p, "utf8");

const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== ".next") walk(f, out); }
    else out.push(f);
  }
  return out;
};
const lines = (f) => rd(f).split("\n").length;

const tryRun = (cmd, args, cwd = ROOT, timeout = 600_000) => {
  const t0 = Date.now();
  try {
    const out = execFileSync(cmd, args, { cwd, encoding: "utf8", timeout, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, CI: "1" } });
    return { ok: true, out, secs: Math.round((Date.now() - t0) / 1000) };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}`.trim(), secs: Math.round((Date.now() - t0) / 1000) };
  }
};

/* ---------------------------------------------------------------- routes */
const norm = (r) => r.replace(/\[[\w.]+\]/g, "{}").replace(/\/+$/, "") || "/";
const toRoute = (file, app) => {
  let r = path.relative(rp("apps", app, "src/app"), path.dirname(file));
  r = "/" + r.split(path.sep).filter((s) => s && !s.startsWith("(")).join("/");
  return r === "/" ? "/" : r.replace(/\/+$/, "");
};

/** segment-wise match: `[x]` = any one segment, `[...rest]` = any tail. */
const matchPattern = (pattern, url) => {
  const p = pattern.split("/").filter(Boolean), u = url.split("?")[0].split("/").filter(Boolean);
  let i = 0;
  for (const seg of p) {
    if (seg.startsWith("[...")) return true;
    if (i >= u.length) return false;
    if (!seg.startsWith("[") && seg !== u[i]) return false;
    i++;
  }
  return i === u.length;
};
const specificity = (pattern) => pattern.split("/").filter((s) => s && !s.startsWith("[")).length * 100 - (pattern.match(/\[/g) ?? []).length;

export function collectRoutes() {
  const smoke = rd(rp("e2e/tests/smoke.spec.ts"));
  const adminBlock = smoke.match(/ADMIN_ROUTES = \[([\s\S]*?)\];/)[1];
  const smokeTargets = [
    ...[...adminBlock.matchAll(/`([^`]+)`/g)].map((m) => ({ app: "admin", url: m[1].replaceAll("${S}", "/nakhla") })),
    ...[...smoke.matchAll(/name: "([^"]+)",\s*url: `\$\{BASES\.(\w+)\}([^`]*)`/g)]
      .map((m) => ({ app: { STOREFRONT: "storefront", SUPER_ADMIN: "super-admin", PARTNERS: "partners", ADMIN: "admin" }[m[2]], url: m[3] })),
  ];
  const routes = [];
  for (const app of APPS)
    for (const f of walk(rp("apps", app, "src/app")).filter((f) => f.endsWith("page.tsx"))) {
      const pattern = toRoute(f, app);
      routes.push({ app, pattern, file: path.relative(ROOT, f), lines: lines(f), real: null, inSmoke: false });
    }
  // assign each smoke url to the most specific matching route pattern
  const claimed = new Set();
  for (const t of smokeTargets) {
    const hit = routes.filter((r) => r.app === t.app && matchPattern(r.pattern, t.url)).sort((a, b) => specificity(b.pattern) - specificity(a.pattern))[0];
    if (hit) { hit.inSmoke = true; hit.real ??= t.url; claimed.add(t); }
  }
  const uncoveredSmoke = smokeTargets.filter((t) => !claimed.has(t))
    .map((t) => ({ app: t.app, pattern: "(catch-all / static)", file: "—", lines: 0, real: t.url, inSmoke: true }));
  return { routes: [...routes, ...uncoveredSmoke], smokeTargets: [...new Map(smokeTargets.map((t) => [`${t.app}:${t.url}`, t])).values()] };
}

/* ------------------------------------------------------------------- nav */
export function collectNav() {
  const nav = { admin: [], "super-admin": [], partners: [], storefront: [] };
  const src = rd(rp("apps/admin/src/components/shell/nav.ts"));
  let group = "—";
  for (const l of src.split("\n")) {
    const g = l.match(/key: (null|"(\w+)"),?\s*$/); // group header line has no href
    if (g && !l.includes("href")) { group = g[2] ?? "—"; continue; }
    const it = l.match(/\{ key: "(\w+)", href: "([^"]+)"/);
    if (it) nav.admin.push({ group, key: it[1], href: it[2] });
  }
  for (const app of ["super-admin", "partners"]) {
    const s = rd(rp("apps", app, "src/components/console-shell.tsx"));
    for (const m of s.matchAll(/\{ href: "([^"]+)", key: "(\w+)"/g)) nav[app].push({ group: "—", key: m[2], href: m[1] });
  }
  const sh = rd(rp("apps/storefront/src/components/store-header.tsx"));
  nav.storefront = [...new Set([...sh.matchAll(/href="([^"`]+)"|href=\{`([^`]+)`\}/g)].map((m) => m[1] ?? m[2]))]
    .map((href) => ({ group: "—", key: href, href }));
  return nav;
}

/* ------------------------------------------------------- design system */
export function collectDesign() {
  const dir = rp("packages/ui/src/components");
  const components = readdirSync(dir).filter((f) => f.endsWith(".tsx"));
  const stories = readdirSync(rp("packages/ui/src/stories")).filter((f) => f.endsWith(".tsx"));
  const appFiles = APPS.flatMap((a) => walk(rp("apps", a, "src")).filter((f) => /\.tsx?$/.test(f)));
  const corpus = appFiles.map((f) => rd(f));
  const list = components.map((f) => {
    const src = rd(path.join(dir, f));
    const name = src.match(/export (?:function|const) ([A-Z]\w+)/)?.[1] ?? f.replace(".tsx", "");
    const usages = corpus.reduce((n, c) => n + (c.includes(name) ? 1 : 0), 0);
    return { name, file: f, usages };
  }).sort((a, b) => b.usages - a.usages);
  const css = rd(rp("packages/ui/src/styles/globals.css"));
  const tokens = [...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => ({ name: m[1], value: m[2].trim() }));
  const reg = rd(rp("packages/storefront-sections/src/registry.ts"));
  const sections = [...reg.matchAll(/^\s*("[\w-]+"|\w+): entry\(/gm)].map((m) => m[1].replaceAll('"', ""));
  const blocks = rd(rp("packages/storefront-sections/src/blocks.ts"));
  const blockTypes = [...(blocks.match(/BLOCK_TYPES = \[([\s\S]*?)\]/)[1].matchAll(/"([\w-]+)"/g))].map((m) => m[1]);
  const themeFiles = readdirSync(rp("packages/storefront-sections/src/themes")).filter((f) => /^(perfume|fashion|generic)/.test(f));
  const presets = themeFiles.map((f) => ({ theme: f.replace(".ts", ""), presets: [...rd(rp("packages/storefront-sections/src/themes", f)).matchAll(/name:\s*"([^"]+)"|labelAr:\s*"([^"]+)"/g)].map((m) => m[1] ?? m[2]).slice(0, 12) }));
  const features = [...(rd(rp("packages/contracts/src/commerce/entities-theme.ts")).match(/THEME_FEATURES = \[([\s\S]*?)\]/)?.[1].matchAll(/"([\w-]+)"/g) ?? [])].map((m) => m[1]);
  return { components: list, count: components.length, stories: stories.length, tokens, sections, blockTypes, themes: themeFiles.map((f) => f.replace(".ts", "")), presets, features };
}

/* ---------------------------------------------------------------- copilot */
export function collectCopilot() {
  const esbuild = ["node_modules/.pnpm/node_modules/.bin/esbuild"]
    .map((p) => rp(p)).find(existsSync)
    ?? execSync(`ls -d ${rp("node_modules/.pnpm")}/esbuild@*/node_modules/esbuild/bin/esbuild | head -1`, { encoding: "utf8" }).trim();
  const out = path.join(tmpdir(), `copilot-bundle-${Date.now()}.mjs`);
  execFileSync(esbuild, [rp("packages/copilot/src/index.ts"), "--bundle", "--format=esm", "--platform=node", `--outfile=${out}`, "--log-level=error"]);
  return import(`file://${out}`).then((m) => ({
    tools: m.TOOL_REGISTRY.map((t) => ({ name: t.name, kind: t.kind, permission: t.permission ?? "—", undoable: !!t.undoable, descAr: t.descriptionAr ?? "" })),
    coverage: m.toolCoverage(),
    merchantScenarios: m.MERCHANT_SCENARIOS.map((s) => s.id),
    platformScenarios: m.PLATFORM_SCENARIOS.map((s) => s.id),
  }));
}

/* ------------------------------------------------------------------- i18n */
const leaves = (o, pre = "", acc = []) => {
  for (const [k, v] of Object.entries(o)) typeof v === "object" && v ? leaves(v, `${pre}${k}.`, acc) : acc.push(pre + k);
  return acc;
};
export function collectI18n() {
  const pairs = [{ label: "@repo/ui", dir: rp("packages/ui/src/messages") },
    ...APPS.map((a) => ({ label: `apps/${a}`, dir: rp("apps", a, "messages") }))];
  return pairs.map(({ label, dir }) => {
    const ar = leaves(JSON.parse(rd(path.join(dir, "ar.json")))), en = leaves(JSON.parse(rd(path.join(dir, "en.json"))));
    const enSet = new Set(en), arSet = new Set(ar);
    return { label, ar: ar.length, en: en.length, missingInEn: ar.filter((k) => !enSet.has(k)), missingInAr: en.filter((k) => !arSet.has(k)) };
  });
}

/* -------------------------------------------------------------- contracts */
export function collectEntities() {
  const out = [];
  const roots = readdirSync(rp("packages/contracts/src"), { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? readdirSync(rp("packages/contracts/src", e.name)).filter((f) => f.endsWith(".ts")).map((f) => `${e.name}/${f}`) : e.name.endsWith(".ts") ? [e.name] : []);
  for (const f of roots) {
    const src = rd(rp("packages/contracts/src", f));
    for (const m of src.matchAll(/export interface (\w+) \{([\s\S]*?)\n\}/g))
      out.push({ file: f, name: m[1], fields: [...m[2].matchAll(/^\s*(\w+)[?:]/gm)].map((x) => x[1]) });
  }
  return out;
}

export function collectHooks() {
  const out = [];
  for (const f of readdirSync(rp("packages/api-client/src")).filter((f) => f.endsWith(".ts"))) {
    const names = [...rd(rp("packages/api-client/src", f)).matchAll(/export const (use\w+)/g)].map((m) => m[1]);
    if (names.length) out.push({ file: f, names });
  }
  return out;
}

/* ------------------------------------------------------------ permissions */
export function collectPermissions() {
  const src = rd(rp("packages/contracts/src/permissions.ts"));
  const groupsSrc = src.match(/PERMISSION_GROUPS = \{([\s\S]*?)\} as const/)[1];
  const groups = Object.fromEntries([...groupsSrc.matchAll(/(\w+): \[([^\]]*)\]/g)].map((m) => [m[1], [...m[2].matchAll(/"([\w.]+)"/g)].map((x) => x[1])]));
  const all = Object.values(groups).flat();
  /* DEFAULT_ROLES entries are either literal arrays or ALL_PERMISSIONS
   * expressions — resolve each to a concrete permission list. */
  const grants = {};
  const rolesSrc = src.match(/DEFAULT_ROLES[^=]*= \{([\s\S]*?)\n\};/)?.[1] ?? "";
  for (const line of rolesSrc.split("\n")) {
    const m = line.match(/^\s*(\w+): (.*),?\s*$/);
    if (!m) continue;
    const [, key, expr] = m;
    if (expr.includes(".endsWith(")) grants[key] = all.filter((p) => p.endsWith(".read"));
    else if (expr.includes("ALL_PERMISSIONS.filter")) {
      const excl = [...expr.matchAll(/"([\w.]+)"/g)].map((x) => x[1]);
      grants[key] = all.filter((p) => !excl.includes(p));
    } else if (expr.startsWith("[...ALL_PERMISSIONS]") || expr.startsWith("ALL_PERMISSIONS")) grants[key] = all;
    else grants[key] = [...expr.matchAll(/"([\w.]+)"/g)].map((x) => x[1]);
  }
  /* Route guards — the real pathname→permission map used by <RouteGuard>. */
  const routeSrc = rd(rp("apps/admin/src/lib/route-permissions.ts"));
  const routeMap = [...routeSrc.matchAll(/\{ prefix: "([^"]+)", permission: "([^"]+)" \}/g)].map((m) => ({ prefix: m[1], permission: m[2] }));
  const guardFiles = execSync(`grep -rln "useCan(\\|<Can " ${rp("apps/admin/src")} || true`, { encoding: "utf8" }).trim().split("\n").filter(Boolean).length;
  return { roles: Object.keys(grants), grants, groups, routeMap, guardFiles };
}

/* ------------------------------------------------------------ spec & docs */
export function collectSpecDiff(routes) {
  const md = rd(rp("docs/SCREENS_SPEC.md"));
  const sec = md.match(/## 2\. خريطة المسارات[\s\S]*?(?=\n## 3\.)/)[0];
  const appFor = (h) => (h.includes("admin`") && !h.includes("super") ? "admin" : h.includes("storefront") ? "storefront" : h.includes("super-admin") ? "super-admin" : "partners");
  const spec = { admin: new Set(), storefront: new Set(), "super-admin": new Set(), partners: new Set() };
  let app = null;
  for (const line of sec.split("\n")) {
    const h = line.match(/^### (.+)/); if (h) { app = appFor(h[1]); continue; }
    if (!app || !line.includes("/")) continue;
    for (const tok of line.match(/\/[\w\-\/[\]{}.,·]+/g) ?? []) {
      for (const piece of tok.split("·")) {
        const p = piece.trim(); if (!p.startsWith("/")) continue;
        const br = p.match(/\{([^}]+)\}/);
        if (br) for (const opt of br[1].split(",")) spec[app].add(p.replace(br[0], opt.trim()));
        else spec[app].add(p);
      }
    }
  }
  const actual = {};
  for (const a of APPS) actual[a] = new Set(routes.filter((r) => r.app === a && r.file !== "—").map((r) => r.pattern));
  const diff = {};
  for (const a of APPS) {
    const specN = [...spec[a]].map(norm), actN = [...actual[a]].map(norm);
    const catchAll = actN.some((p) => p.includes("{}") && p.split("/").filter(Boolean).length === 2); // /{store}/{...rest}
    diff[a] = {
      specOnly: [...spec[a]].filter((p) => !actN.includes(norm(p))),
      extra: [...actual[a]].filter((p) => !specN.includes(norm(p))),
      catchAllCovered: catchAll ? [...spec[a]].filter((p) => !actN.includes(norm(p)) && norm(p).split("/").length >= 3) : [],
    };
  }
  return diff;
}

export function collectCoverage(routes) {
  const md = rd(rp("docs/COVERAGE.md"));
  const map = new Map(); // normPattern -> status
  for (const line of md.split("\n")) {
    if (!line.startsWith("|")) continue;
    const status = line.includes("✅") ? "✅" : line.includes("❌") ? "❌" : line.includes("⚠️") ? "⚠️" : null;
    if (!status) continue;
    for (const m of line.matchAll(/`((?:apps|features|packages)\/[^`]+|\/[\w\-\/[\]{}?=&]*)`/g)) {
      const p = m[1]; if (!p.startsWith("/")) continue;
      map.set(norm(p.replaceAll("{general,payments,shipping,taxes,notifications,channels,staff,roles,audit,billing,developers,danger}", "{}")), status);
    }
  }
  const statusFor = (r) => {
    const rel = r.app === "admin" ? r.pattern.replace(/^\/\[store\]/, "") : r.pattern;
    for (const cand of [rel, r.pattern, rel === "" ? "/" : rel]) {
      const k = norm(cand); if (map.has(k)) return map.get(k);
      for (const [mk, st] of map) if (mk === k || mk.replace(/\/$/, "") === k) return st;
    }
    // prefix match for dynamic segments + `/*` wildcards in COVERAGE paths
    const k = norm(rel === "" ? "/" : rel);
    for (const [mk, st] of map) if (k === mk || k.startsWith(mk + "/") || (mk.endsWith("/*") && k.startsWith(mk.slice(0, -2)))) return st;
    return null;
  };
  for (const r of routes) r.coverage = statusFor(r);
  return map.size;
}

/* ------------------------------------------------------------ file sizes */
export function collectFiles() {
  const files = [...walk(rp("apps")), ...walk(rp("packages"))]
    .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes(".next"))
    .map((f) => ({ file: path.relative(ROOT, f), lines: lines(f) }))
    .sort((a, b) => b.lines - a.lines);
  return { top10: files.slice(0, 10), over250: files.filter((f) => f.lines > 250), total: files.length };
}

export function collectTodos() {
  const out = execSync(`grep -rn "TODO\\|FIXME" ${rp("apps")} ${rp("packages")} --include="*.ts" --include="*.tsx" | grep -v node_modules || true`, { encoding: "utf8" });
  return out.trim().split("\n").filter(Boolean).map((l) => l.replace(ROOT + "/", ""));
}

export function collectJsSize() {
  const out = {};
  for (const app of APPS) {
    const mf = rp("apps", app, ".next/app-build-manifest.json");
    if (!existsSync(mf)) { out[app] = null; continue; }
    const pages = JSON.parse(rd(mf)).pages ?? {};
    const all = [...new Set(Object.values(pages).flat())];
    // turbopack dev manifests list per-module `*._.js` chunks — numbers meaningless; require a prod build
    const devChunks = all.filter((f) => f.includes("_.js") || f.includes("development")).length;
    if (!existsSync(rp("apps", app, ".next/BUILD_ID")) || devChunks > all.length * 0.3) { out[app] = null; continue; }
    let sum = 0, found = false;
    for (const files of Object.values(pages)) for (const f of files) {
      const p = rp("apps", app, ".next", f);
      if (existsSync(p) && f.includes("static/")) { sum += statSync(p).size; found = true; }
    }
    out[app] = found ? Math.round(sum / 1024) : null;
  }
  return out;
}

/** Real production metrics written by scripts/ui-report/measure.mjs (null if absent). */
export function collectMetrics() {
  const f = rp("reports/ui/metrics.json");
  if (!existsSync(f)) return null;
  try { return JSON.parse(rd(f)); } catch { return null; }
}

export async function pingServers() {
  const res = {};
  for (const [app, port] of Object.entries(PORTS)) {
    try { const r = await fetch(`http://localhost:${port}/`, { signal: AbortSignal.timeout(4000) }); res[app] = r.status < 500; }
    catch { res[app] = false; }
  }
  return res;
}

export function runChecks(serversUp) {
  const checks = {};
  checks.typecheck = tryRun("pnpm", ["typecheck"]);
  checks.lint = tryRun("pnpm", ["lint"]);
  checks.contracts = tryRun(rp("node_modules/.pnpm/node_modules/.bin/tsc"), ["--noEmit", "-p", rp("packages/contracts/tsconfig.json")]);
  checks.e2e = { ran: false };
  if (serversUp.every(Boolean)) {
    const r = tryRun("pnpm", ["test"], rp("e2e"), 900_000);
    const passed = (r.out.match(/(\d+) passed/) ?? [])[1], failed = (r.out.match(/(\d+) failed/) ?? [])[1];
    checks.e2e = { ran: true, ok: r.ok, passed: +(passed ?? 0), failed: +(failed ?? 0), secs: r.secs, tail: r.out.split("\n").slice(-15).join("\n") };
  }
  for (const k of ["typecheck", "lint", "contracts"]) checks[k] = { ok: checks[k].ok, secs: checks[k].secs, tail: checks[k].out.split("\n").slice(-12).join("\n") };
  return checks;
}
