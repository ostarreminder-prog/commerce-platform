/* render.mjs — emits docs/UI_REPORT.md (RTL markdown) + reports/ui/index.html. */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { APPS, ROOT } from "./collect.mjs";

const APP_AR = { admin: "لوحة التاجر", storefront: "المتجر", "super-admin": "الإدارة العليا", partners: "بوابة المطورين" };
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const ok = (b) => (b ? "✅" : "❌");

function shotFor(d, r) {
  const hit = (d.shots?.results ?? []).find((s) => s.app === r.app && s.route === r.real);
  const f = hit?.files.find((x) => x.includes("desktop_light_ar")) ?? hit?.files[0];
  return f ? { md: `../reports/ui/${f}`, html: f.replace(/^shots\//, "shots/") } : null;
}

export function render(d) {
  const ts = d.generatedAt;
  const routesByApp = Object.fromEntries(APPS.map((a) => [a, d.routes.routes.filter((r) => r.app === a)]));
  const coverageCounts = (a) => {
    const rs = routesByApp[a].filter((r) => r.coverage);
    return `${rs.filter((r) => r.coverage === "✅").length}✅ ${rs.filter((r) => r.coverage === "⚠️").length}⚠️ ${rs.filter((r) => r.coverage === "❌").length}❌`;
  };
  const check = d.checks ?? {};

  /* ============================ MARKDOWN ============================ */
  const M = [];
  M.push(`# تقرير واجهة المستخدم — كما بُنيت فعلياً`, ``,
    `> وُلّد آلياً بواسطة \`scripts/ui-report.mjs\` في **${ts}** — المصدر: الكود لا المواصفات.`, ``);
  M.push(`## أ. الملخص`, ``,
    `| التطبيق | المسارات (page.tsx) | مسارات الدخان | تغطية COVERAGE |`,
    `|---|---|---|---|`);
  for (const a of APPS) M.push(`| ${APP_AR[a]} \`apps/${a}\` | ${d.routes.routes.filter((r) => r.app === a && r.file !== "—").length} | ${d.routes.routes.filter((r) => r.app === a && r.inSmoke).length} | ${coverageCounts(a)} |`);
  M.push(``,
    `| بند | الرقم |`, `|---|---|`,
    `| مكوّنات \`@repo/ui\` | ${d.design.count} (stories: ${d.design.stories}) |`,
    `| أقسام المتجر | ${d.design.sections.length} قسماً · ${d.design.blockTypes.length} نوع بلوك · ${d.design.themes.length} ثيمات |`,
    `| أدوات Copilot | ${d.copilot.tools.length} (${d.copilot.tools.filter((t) => t.kind === "read").length} قراءة / ${d.copilot.tools.filter((t) => t.kind === "write").length} كتابة / ${d.copilot.tools.filter((t) => t.kind === "dangerous").length} خطرة) — تغطية ${d.copilot.coverage.coveredOps}/${d.copilot.coverage.totalApiOps} عملية api (${d.copilot.coverage.pct}%) |`,
    `| سيناريوهات Copilot | ${d.copilot.merchantScenarios.length} تاجر + ${d.copilot.platformScenarios.length} منصة |`,
    `| كيانات contracts | ${d.entities.length} واجهة |`,
    `| Hooks في api-client | ${d.hooks.reduce((n, h) => n + h.names.length, 0)} |`,
    `| ملفات > 250 سطراً | ${d.files.over250.length} من ${d.files.total} |`,
    `| TODO/FIXME | ${d.todos.length} |`, ``,
    `**نتائج الفحوص:** typecheck ${ok(check.typecheck?.ok)} · lint ${ok(check.lint?.ok)} · contracts ${ok(check.contracts?.ok)} · ` +
    (check.e2e?.ran ? `e2e: ${check.e2e.passed} ناجح / ${check.e2e.failed} فاشل` : `e2e: لم يُشغَّل${APPS.some((a) => !d.servers?.[a]) ? ` (خوادم غير متاحة: ${APPS.filter((a) => !d.servers[a]).join(", ")})` : " (--no-checks)"}`), ``);

  M.push(`## ب. الشاشات لكل تطبيق`, ``);
  for (const a of APPS) {
    M.push(`### ${APP_AR[a]} — \`apps/${a}\``, ``);
    const nav = d.nav[a];
    if (nav?.length) {
      const groups = [...new Set(nav.map((n) => n.group))];
      M.push(`**شجرة التنقل:**`, ``);
      for (const g of groups) {
        M.push(`- ${g === "—" ? "بدون مجموعة" : `مجموعة **${g}**`}`);
        for (const n of nav.filter((x) => x.group === g)) M.push(`  - \`${n.href}\` (${n.key})`);
      }
      M.push(``);
    }
    M.push(`| المسار | الملف | سطور | دخان | تغطية | HTTP | لقطة |`, `|---|---|---|---|---|---|---|`);
    for (const r of routesByApp[a]) {
      const shot = shotFor(d, r);
      M.push(`| \`${r.pattern}\` | ${r.file === "—" ? "—" : `\`${r.file.split("/").slice(-2).join("/")}\``} | ${r.lines || "—"} | ${r.inSmoke ? "✅" : "—"} | ${r.coverage ?? "—"} | ${r.status ?? "—"} | ${shot ? `[img](${shot.md})` : "—"} |`);
    }
    M.push(``);
  }

  M.push(`## ج. نظام التصميم`, ``,
    `- التوكنات المعرّفة في \`packages/ui/src/styles/globals.css\` (+ الوضع الداكن): **${d.design.tokens.length}** متغير — أبرزها: ${d.design.tokens.filter((t) => /primary|background|foreground|radius|wa-header|serp|paper|ink/.test(t.name)).slice(0, 14).map((t) => `\`${t.name}\``).join("، ")}.`,
    `- preset مشترك: \`packages/config/tailwind/preset.ts\` — القاعدة: توكنات فقط، ESLint يمنع الألوان الخام.`, ``,
    `| المكوّن | الملف | ملفات تستخدمه |`, `|---|---|---|`);
  for (const c of d.design.components) M.push(`| ${c.name} | \`${c.file}\` | ${c.usages} |`);
  M.push(``);

  M.push(`## د. أقسام المتجر ونظام الثيمات`, ``,
    `**الأقسام (${d.design.sections.length}):** ${d.design.sections.map((s) => `\`${s}\``).join("، ")}`, ``,
    `**أنواع البلوكات (${d.design.blockTypes.length}):** ${d.design.blockTypes.map((s) => `\`${s}\``).join("، ")}`, ``,
    `**الثيمات:** ${d.design.themes.map((s) => `\`${s}\``).join("، ")} (perfume هو الافتراضي).`,
    `**القوالب:** home · product · category · cart · page + قوالب هبوط مخصصة (\`ThemeCustomTemplate\`).`, ``,
    `**الـ presets لكل ثيم:**`);
  for (const p of d.design.presets) M.push(`- ${p.theme}: ${p.presets.join("، ") || "—"}`);
  M.push(``, `**مميزات المتجر (${d.design.features.length}):** ${d.design.features.map((s) => `\`${s}\``).join("، ")}`, ``,
    `**أدوات المحرر:** تراجع/إعادة، حفظ تلقائي، تحديد من المعاينة، نسخ/لصق، اختصارات، معاينة بأجهزة (mobile/tablet/desktop)، أنظمة ألوان لكل قسم، سجل نسخ، جدولة نشر، روابط معاينة، لوحة جودة، «صمم بالـ AI» (واجهة فقط — توليد محلي).`, ``);

  const cov = d.copilot.coverage;
  const KIND_AR = { read: "قراءة", write: "كتابة", dangerous: "خطرة" };
  M.push(`## هـ. الوكلاء و Copilot`, ``,
    `- شاشات الوكلاء في admin: \`/agents\` (قائمة، محرر، قنوات، مباشر، سجل، اختبار) — بياناتها من \`studioApi\` (mock).`,
    `- **تغطية الأدوات: ${cov.coveredOps}/${cov.totalApiOps} عملية api (${cov.pct}%)** — تولّدت ${cov.toolCount} أداة من جدول \`API_GEN_SPEC\` (\`packages/copilot/src/registry-data.ts\` + مولّد \`tool-gen.ts\`)؛ الأدوات اليدوية الغنية تُعفى من التوليد عند تعارض الاسم.`,
    `- سيناريوهات التاجر (${d.copilot.merchantScenarios.length}): ${d.copilot.merchantScenarios.map((s) => `\`${s}\``).join("، ")}`,
    `- سيناريوهات المنصة (${d.copilot.platformScenarios.length}): ${d.copilot.platformScenarios.map((s) => `\`${s}\``).join("، ")}`, ``,
    `**الأدوات / العمليات لكل نطاق:**`, ``,
    `| النطاق | الأدوات / العمليات | النسبة |`, `|---|---|---|`);
  for (const n of cov.byNamespace) {
    const coverable = n.ops - n.excluded;
    M.push(`| \`${n.ns}\` (${n.entityAr}) | ${n.tools}/${coverable} | ${coverable ? `${Math.round((n.tools / coverable) * 100)}%` : "مستبعد"} |`);
  }
  M.push(``, `**العمليات المستبعدة (${cov.excludedOps}):**`);
  for (const x of cov.excluded) M.push(`- \`${x.op}\` — ${x.reason}`);
  M.push(``);
  for (const kind of ["read", "write", "dangerous"]) {
    const list = d.copilot.tools.filter((t) => t.kind === kind);
    M.push(`### ${KIND_AR[kind]} (${list.length})`, ``,
      `| الأداة | الصلاحية | تراجع | الوصف |`, `|---|---|---|---|`);
    for (const t of list) M.push(`| \`${t.name}\` | \`${t.permission}\` | ${t.undoable ? "✅" : "—"} | ${t.descAr} |`);
    M.push(``);
  }

  M.push(`## و. مصفوفة الصلاحيات الفعلية`, ``,
    `المصدر: \`packages/contracts/src/permissions.ts\` (\`PERMISSION_GROUPS\` + \`DEFAULT_ROLES\` — ${d.perms.roles.length} أدوار نظام) و \`apps/admin/src/lib/route-permissions.ts\` (${d.perms.routeMap.length} مساراً محمياً). حراسات المسارات مركزية عبر \`<RouteGuard>\` → \`errors.403\`، والتحقق على مستوى العناصر (\`useCan\`/\`<Can>\`) في ${d.perms.guardFiles} ملفاً.`, ``,
    `**مصفوفة الأدوار × الشاشات** (الصلاحية المطلوبة لكل مسار — ✅ = الدور يفتح الشاشة):`, ``,
    `| الشاشة | الصلاحية | ${d.perms.roles.join(" | ")} |`, `|---|---|${d.perms.roles.map(() => "---").join("|")}|`);
  for (const r of d.perms.routeMap) M.push(`| \`${r.prefix}\` | \`${r.permission}\` | ${d.perms.roles.map((role) => (d.perms.grants[role]?.includes(r.permission) ? "✅" : "—")).join(" | ")} |`);
  M.push(``, `المسارات غير المدرجة مفتوحة لكل الأدوار: \`/\` (الرئيسية)، \`/copilot\`، \`/onboarding\`.`, ``,
    `**مصفوفة الأدوار × الصلاحيات:**`, ``,
    `| الصلاحية | ${d.perms.roles.join(" | ")} |`, `|---|${d.perms.roles.map(() => "---").join("|")}|`);
  const allPerms = Object.values(d.perms.groups).flat();
  for (const p of allPerms) M.push(`| \`${p}\` | ${d.perms.roles.map((r) => (d.perms.grants[r]?.includes(p) ? "✅" : "—")).join(" | ")} |`);
  M.push(``);

  M.push(`## ز. كيانات contracts ومهام الـ Backend`, ``,
    `| الكيان | الملف | الحقول |`, `|---|---|---|`);
  for (const e of d.entities) M.push(`| ${e.name} | \`${e.file}\` | ${e.fields.length} (${e.fields.slice(0, 8).join("، ")}${e.fields.length > 8 ? "…" : ""}) |`);
  M.push(``, `**Hooks المعروضة عبر \`@repo/api-client\` (mock — كل مجموعة = مهمة ربط Backend):**`, ``);
  for (const h of d.hooks) M.push(`- \`${h.file}\` (${h.names.length}): ${h.names.slice(0, 12).join("، ")}${h.names.length > 12 ? "…" : ""}`);
  M.push(``);

  M.push(`## ح. الجودة`, ``,
    `| الفحص | النتيجة | المدة |`, `|---|---|---|`,
    `| \`pnpm typecheck\` | ${ok(check.typecheck?.ok)} | ${check.typecheck?.secs ?? "—"}ث |`,
    `| \`pnpm lint\` | ${ok(check.lint?.ok)} | ${check.lint?.secs ?? "—"}ث |`,
    `| عقود (\`tsc --noEmit packages/contracts\`) | ${ok(check.contracts?.ok)} | ${check.contracts?.secs ?? "—"}ث |`,
    `| e2e smoke | ${check.e2e?.ran ? `${check.e2e.passed}✅ ${check.e2e.failed}❌` : "لم يُشغَّل — خوادم غير متاحة"} | ${check.e2e?.secs ? `${check.e2e.secs}ث` : "—"} |`, ``,
    `**مخالفات i18n (مفاتيح ar/en غير المتطابقة):**`);
  for (const i of d.i18n) M.push(`- ${i.label}: ar=${i.ar} · en=${i.en} · ناقص en: ${i.missingInEn.length} · ناقص ar: ${i.missingInAr.length}${i.missingInEn.length ? ` — مثل \`${i.missingInEn[0]}\`` : ""}${i.missingInAr.length ? ` — مثل \`${i.missingInAr[0]}\`` : ""}`);
  M.push(``, `**أكبر 10 ملفات:**`, ``);
  for (const f of d.files.top10) M.push(`- \`${f.file}\` — ${f.lines} سطراً`);
  M.push(``, `**ملفات > 250 سطراً (${d.files.over250.length}):**`, ``,
    d.files.over250.slice(0, 60).map((f) => `\`${f.file}\` (${f.lines})`).join("، "),
    d.files.over250.length > 60 ? `… و${d.files.over250.length - 60} أخرى` : "", ``,
    `**حجم JS التقريبي لكل تطبيق** (من \`.next/app-build-manifest.json\` — يشمل chunks مشتركة):`,
    APPS.map((a) => `- ${a}: ${d.jsSize?.[a] != null ? `~${d.jsSize[a]} KB` : "غير مقاس (لا manifest أو dev build)"}`).join("\n"), ``);
  if (d.metrics?.routes?.length) {
    M.push(
      `**مقاييس إنتاج مقاسة** (${d.metrics.mode} — first-load JS من manifest البناء، LCP عبر \`PerformanceObserver\` — ${new Date(d.metrics.measuredAt).toLocaleString("ar-SA-u-nu-latn")}):`,
      ``,
      `| المسار | first-load JS | LCP |`, `|---|---|---|`,
      d.metrics.routes.map((r) => `| ${r.label} | ${r.firstLoadJsKb != null ? `~${r.firstLoadJsKb} KB` : "—"} | ${r.lcpMs != null ? `${(r.lcpMs / 1000).toFixed(2)} ث` : "—"} |`).join("\n"),
      ``,
      `إعادة القياس: \`node scripts/ui-report/measure.mjs\` (يتطلب بناء إنتاج وخوادم \`next start\`).`, ``);
  }

  M.push(`## ط. النواقص والقرارات والديون`, ``,
    `### حرج`, ``);
  const crit = [];
  for (const a of APPS) for (const p of d.specDiff[a].specOnly.filter((x) => !d.specDiff[a].catchAllCovered.includes(x))) crit.push(`مسار موصوف غير منفذ في ${a}: \`${p}\``);
  for (const i of d.i18n.filter((x) => x.missingInEn.length + x.missingInAr.length > 0)) crit.push(`خلل تطابق مفاتيح ${i.label} (ناقص en: ${i.missingInEn.length}, ناقص ar: ${i.missingInAr.length})`);
  if (check.lint && !check.lint.ok) crit.push("`pnpm lint` يفشل حالياً");
  if (check.typecheck && !check.typecheck.ok) crit.push("`pnpm typecheck` يفشل حالياً");
  if (check.e2e?.ran && check.e2e.failed > 0) crit.push(`e2e: ${check.e2e.failed} مساراً فاشلاً`);
  M.push(crit.length ? crit.map((c) => `- ${c}`).join("\n") : "- لا شيء حرج مكتشف آلياً.");
  M.push(``, `### مهم`, ``);
  const imp = [
    `حراسات المسارات تغطي لوحة التاجر فقط — بقية التطبيقات بلا نموذج صلاحيات (super-admin/partners بأدوار منصة منفصلة).`,
    `المسارات الموصوفة المغطاة بـ catch-all في admin (${d.specDiff.admin.catchAllCovered.length}): ${d.specDiff.admin.catchAllCovered.slice(0, 12).map((x) => `\`${x}\``).join("، ")}${d.specDiff.admin.catchAllCovered.length > 12 ? "…" : ""}`,
    `مسارات موجودة غير موثقة بالمواصفات: ${APPS.flatMap((a) => d.specDiff[a].extra).slice(0, 15).map((x) => `\`${x}\``).join("، ")}`,
    `${d.files.over250.length} ملفاً يتجاوز حد الـ 250 سطراً (قاعدة المشروع).`,
  ];
  M.push(imp.map((c) => `- ${c}`).join("\n"), ``, `### تحسين`, ``,
    `- ${d.todos.length} إشارة TODO/FIXME${d.todos.length ? ` — أولها: \`${d.todos[0]?.slice(0, 140)}\`` : ""}.`,
    `- حالات ⚠️ في COVERAGE.md (محاكاة مقيّدة): التقسيط واجهة فقط، «صمم بالـ AI» توليد محلي، محرر القوائم بلا سحب وإفلات، تقدير التوصيل ثابت، روابط المعاينة بكوكي محلي.`,
    d.metrics?.routes?.length
      ? `- مقاييس §ح أعلاه مأخوذة من بناء إنتاج حقيقي (\`next build\` + \`next start\`) — لا dev manifests. أرقام dev تختلف (chunks غير مُحسّنة).`
      : `- حجم JS يُقاس من dev manifests — يُنصح ببناء إنتاج (\`pnpm build\`) ثم \`node scripts/ui-report/measure.mjs\` لأرقام دقيقة.`, ``,
    `### القرارات الموثقة (من AGENTS.md / COVERAGE.md)`, ``,
    `- المنصة **frontend فقط**: كل البيانات mock داخل المتصفح عبر \`@repo/api-client\` — أي «خادم» محاكى محلياً.`,
    `- سطح Copilot المشترك في \`packages/copilot/src/ui\` لتجنب دورة \`ui→copilot\`.`,
    `- مكوّنات تعتمد طبقة التطبيق (EntityLink، store-link، cart-context…) تبقى في \`apps/<app>/src/components\` — استثناء موثق.`,
    `- سجل/مهام/إعدادات مساعد المنصة ❌ — «نطاق التاجر فقط — لا جدوى لمهام متجر واحد على مستوى المنصة».`,
    `- perfume هو الثيم الافتراضي؛ بوابة كتابة التقييمات مبسطة (أي طلب مُوصّل).`, ``,
    `### خطوات مقترحة`, ``,
    `1. معالجة البنود الحرجة أعلاه (مسارات الـ spec الناقصة، تطابق المفاتيح).`,
    `2. تقسيم الملفات > 250 سطراً بدءاً بالأكبر.`,
    `3. توسيع نموذج الصلاحيات لبقية التطبيقات أو توثيق قرار «لوحة التاجر فقط».`,
    `4. تفعيل e2e في CI مع تشغيل الخوادم (هذا التقرير يتخطاه تلقائياً عند غيابها).`,
    (d.shots?.results ?? []).some((s) => (s.files ?? []).some((f) => f.includes("_en.png")))
      ? `5. اللقطات الإنجليزية: ${(d.shots.results.filter((s) => (s.files ?? []).some((f) => f.includes("_en.png")))).length} مساراً (desktop/فاتح فقط) — أكمل mobile+dark عند الحاجة.`
      : `5. تغطية اللقطات الإنجليزية لكل المسارات (حالياً عيّنة فقط — انظر reports/ui/shots).`, ``);

  mkdirSync(path.join(ROOT, "docs"), { recursive: true });
  writeFileSync(path.join(ROOT, "docs/UI_REPORT.md"), M.join("\n"), "utf8");

  /* ============================ HTML ============================ */
  const shotsIndex = (d.shots?.results ?? []).flatMap((s) => (s.files ?? []).map((f) => ({ ...s, file: f })));
  const H = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>تقرير واجهة المستخدم</title><style>
:root{--bg:#f7f6f3;--card:#fff;--ink:#1c1a17;--mut:#6b665e;--line:#e4e0d8;--acc:#0f766e;--bad:#b3261e}
*{box-sizing:border-box}body{margin:0;font-family:"Segoe UI",Tahoma,Arial,sans-serif;background:var(--bg);color:var(--ink);line-height:1.7}
.wrap{display:grid;grid-template-columns:240px 1fr;min-height:100vh}
nav{position:sticky;top:0;height:100vh;overflow:auto;padding:24px 16px;border-inline-end:1px solid var(--line);background:var(--card)}
nav a{display:block;padding:6px 10px;border-radius:8px;color:var(--mut);text-decoration:none;font-size:14px}
nav a:hover{background:var(--bg);color:var(--acc)}
main{padding:32px 48px;max-width:1100px}h1{font-size:26px}h2{margin-top:48px;font-size:20px;border-bottom:2px solid var(--acc);padding-bottom:8px;display:inline-block}
h3{font-size:16px;color:var(--mut);margin-top:28px}
table{border-collapse:collapse;width:100%;background:var(--card);font-size:13px;margin:12px 0}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:start}th{background:var(--bg);font-weight:600}
code,kbd{background:var(--bg);border:1px solid var(--line);border-radius:5px;padding:1px 6px;font-size:12px;direction:ltr;unicode-bidi:embed}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin:16px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:14px}
.card b{display:block;font-size:24px;color:var(--acc)}.card span{font-size:12px;color:var(--mut)}
.pill{display:inline-block;border-radius:20px;padding:1px 10px;font-size:12px;background:var(--bg);border:1px solid var(--line)}
.bad{color:var(--bad)}.mut{color:var(--mut)}
details{margin:8px 0}summary{cursor:pointer;color:var(--acc)}
.shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.shots a{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:var(--card);text-decoration:none;color:var(--mut);font-size:11px}
.shots img{width:100%;display:block;aspect-ratio:16/10;object-fit:cover;object-position:top}
.shots span{display:block;padding:6px 8px;direction:ltr;text-align:left}
.ts{color:var(--mut);font-size:13px}
ul{ padding-inline-start:20px }
@media(max-width:900px){.wrap{grid-template-columns:1fr}nav{position:static;height:auto}}
</style></head><body><div class="wrap"><nav>
<b style="padding:0 10px">تقرير الواجهة</b><br>
${["أ:الملخص:summary", "ب:الشاشات:screens", "ج:نظام التصميم:design", "د:الأقسام والثيمات:sections", "هـ:الوكلاء وCopilot:copilot", "و:الصلاحيات:perms", "ز:الكيانات:entities", "ح:الجودة:quality", "ط:النواقص:gaps", "اللقطات:shots"]
  .map((x) => { const [n, t, id] = x.split(":"); return `<a href="#${id}">${n}. ${t}</a>`; }).join("")}
</nav><main>
<h1>تقرير واجهة المستخدم — كما بُنيت فعلياً</h1>
<p class="ts">وُلّد آلياً في ${ts} · المصدر: الكود لا المواصفات · <a href="../../docs/UI_REPORT.md">نسخة Markdown</a></p>
<h2 id="summary">أ. الملخص</h2>
<div class="cards">
${APPS.map((a) => `<div class="card"><b>${routesByApp[a].filter((r) => r.file !== "—").length}</b><span>مسار — ${APP_AR[a]} (دخان: ${routesByApp[a].filter((r) => r.inSmoke).length} · ${coverageCounts(a)})</span></div>`).join("")}
<div class="card"><b>${d.design.count}</b><span>مكوّن ui · ${d.design.stories} ملفات stories</span></div>
<div class="card"><b>${d.design.sections.length}+${d.design.blockTypes.length}</b><span>قسم + نوع بلوك · ${d.design.themes.length} ثيمات</span></div>
<div class="card"><b>${d.copilot.tools.length}</b><span>أداة copilot · تغطية ${d.copilot.coverage.coveredOps}/${d.copilot.coverage.totalApiOps} عملية (${d.copilot.coverage.pct}%)</span></div>
<div class="card"><b>${d.hooks.reduce((n, h) => n + h.names.length, 0)}</b><span>hook في api-client (مهام Backend)</span></div>
<div class="card"><b class="${d.files.over250.length ? "bad" : ""}">${d.files.over250.length}</b><span>ملفاً > 250 سطراً · ${d.todos.length} TODO</span></div>
</div>
<p>الفحوص: typecheck ${ok(check.typecheck?.ok)} · lint ${ok(check.lint?.ok)} · contracts ${ok(check.contracts?.ok)} · ${check.e2e?.ran ? `e2e: ${check.e2e.passed}✅/${check.e2e.failed}❌` : "e2e لم يُشغَّل"}</p>
<h2 id="screens">ب. الشاشات لكل تطبيق</h2>
${APPS.map((a) => `<h3>${APP_AR[a]} — <code>apps/${a}</code></h3>
<details><summary>شجرة التنقل (${(d.nav[a] ?? []).length} عنصراً)</summary><ul>${(d.nav[a] ?? []).map((n) => `<li><code>${esc(n.href)}</code> — ${esc(n.key)} <span class="mut">(${esc(n.group)})</span></li>`).join("")}</ul></details>
<table><tr><th>المسار</th><th>الملف</th><th>سطور</th><th>دخان</th><th>تغطية</th><th>HTTP</th><th>لقطة</th></tr>
${routesByApp[a].map((r) => { const s = shotFor(d, r); return `<tr><td><code>${esc(r.pattern)}</code></td><td><code>${esc(r.file.split("/").slice(-2).join("/"))}</code></td><td>${r.lines || "—"}</td><td>${r.inSmoke ? "✅" : "—"}</td><td>${r.coverage ?? "—"}</td><td>${r.status ?? "—"}</td><td>${s ? `<a href="${s.html}">img</a>` : "—"}</td></tr>`; }).join("")}</table>`).join("")}
<h2 id="design">ج. نظام التصميم</h2>
<p>${d.design.tokens.length} متغير CSS في <code>packages/ui/src/styles/globals.css</code> (فاتح + داكن) · preset مشترك <code>packages/config/tailwind/preset.ts</code> · ESLint يفرض التوكنات ويمنع الألوان الخام والأصناف الفيزيائية.</p>
<table><tr><th>المكوّن</th><th>ملفات تستخدمه</th></tr>${d.design.components.map((c) => `<tr><td>${esc(c.name)} <span class="mut"><code>${esc(c.file)}</code></span></td><td>${c.usages}</td></tr>`).join("")}</table>
<h2 id="sections">د. أقسام المتجر ونظام الثيمات</h2>
<p><b>الأقسام (${d.design.sections.length}):</b> ${d.design.sections.map((s) => `<span class="pill">${s}</span>`).join(" ")}</p>
<p><b>البلوكات (${d.design.blockTypes.length}):</b> ${d.design.blockTypes.map((s) => `<span class="pill">${s}</span>`).join(" ")}</p>
<p><b>الثيمات:</b> ${d.design.themes.join("، ")} (perfume افتراضي) · <b>مميزات المتجر (${d.design.features.length}):</b> ${d.design.features.map((s) => `<span class="pill">${s}</span>`).join(" ")}</p>
<ul>${d.design.presets.map((p) => `<li><b>${esc(p.theme)}:</b> ${esc(p.presets.join("، "))}</li>`).join("")}</ul>
<h2 id="copilot">هـ. الوكلاء و Copilot</h2>
<p><b>تغطية الأدوات: ${d.copilot.coverage.coveredOps}/${d.copilot.coverage.totalApiOps} عملية api (${d.copilot.coverage.pct}%)</b> — مولّدة من <code>API_GEN_SPEC</code> + <code>tool-gen.ts</code>؛ اليدوية تُعفى عند تعارض الاسم.<br>
سيناريوهات التاجر (${d.copilot.merchantScenarios.length}): ${d.copilot.merchantScenarios.map((s) => `<span class="pill">${esc(s)}</span>`).join(" ")}<br>
سيناريوهات المنصة (${d.copilot.platformScenarios.length}): ${d.copilot.platformScenarios.map((s) => `<span class="pill">${esc(s)}</span>`).join(" ")}</p>
<details><summary>الأدوات / العمليات لكل نطاق (${d.copilot.coverage.byNamespace.length})</summary><table><tr><th>النطاق</th><th>الأدوات / العمليات</th><th>النسبة</th></tr>
${d.copilot.coverage.byNamespace.map((n) => { const c = n.ops - n.excluded; return `<tr><td><code>${esc(n.ns)}</code> <span class="mut">${esc(n.entityAr)}</span></td><td>${n.tools}/${c}</td><td>${c ? `${Math.round((n.tools / c) * 100)}%` : "مستبعد"}</td></tr>`; }).join("")}</table></details>
<p class="mut">مستبعد (${d.copilot.coverage.excludedOps} عملية): ${d.copilot.coverage.excluded.map((x) => `<code>${esc(x.op)}</code>`).join("، ")}</p>
${["read", "write", "dangerous"].map((kind) => `<details><summary>${{ read: "قراءة", write: "كتابة", dangerous: "خطرة" }[kind]} (${d.copilot.tools.filter((t) => t.kind === kind).length})</summary><table><tr><th>الأداة</th><th>الصلاحية</th><th>تراجع</th><th>الوصف</th></tr>
${d.copilot.tools.filter((t) => t.kind === kind).map((t) => `<tr><td><code>${esc(t.name)}</code></td><td><code>${esc(t.permission)}</code></td><td>${t.undoable ? "✅" : "—"}</td><td>${esc(t.descAr)}</td></tr>`).join("")}</table></details>`).join("\n")}
<h2 id="perms">و. مصفوفة الصلاحيات الفعلية</h2>
<p>المصدر <code>packages/contracts/src/permissions.ts</code> (${d.perms.roles.length} أدوار نظام) + <code>apps/admin/src/lib/route-permissions.ts</code> — حراسات مسارات مركزية (<code>RouteGuard</code> → <code>errors.403</code>) على ${d.perms.routeMap.length} مساراً + تحقق على العناصر (<code>useCan</code>/<code>&lt;Can&gt;</code>) في ${d.perms.guardFiles} ملفاً.</p>
<h3>الأدوار × الشاشات</h3>
<table><tr><th>الشاشة</th><th>الصلاحية</th>${d.perms.roles.map((r) => `<th>${esc(r)}</th>`).join("")}</tr>
${d.perms.routeMap.map((r) => `<tr><td><code>${esc(r.prefix)}</code></td><td><code>${esc(r.permission)}</code></td>${d.perms.roles.map((role) => `<td>${d.perms.grants[role]?.includes(r.permission) ? "✅" : "—"}</td>`).join("")}</tr>`).join("")}</table>
<h3>الأدوار × الصلاحيات</h3>
<table><tr><th>الصلاحية</th>${d.perms.roles.map((r) => `<th>${esc(r)}</th>`).join("")}</tr>
${allPerms.map((p) => `<tr><td><code>${p}</code></td>${d.perms.roles.map((r) => `<td>${d.perms.grants[r]?.includes(p) ? "✅" : "—"}</td>`).join("")}</tr>`).join("")}</table>
<h2 id="entities">ز. كيانات contracts ومهام الـ Backend</h2>
<details><summary>${d.entities.length} كياناً</summary><table><tr><th>الكيان</th><th>الملف</th><th>الحقول</th></tr>
${d.entities.map((e) => `<tr><td>${e.name}</td><td><code>${e.file}</code></td><td>${e.fields.length} — ${esc(e.fields.slice(0, 8).join("، "))}${e.fields.length > 8 ? "…" : ""}</td></tr>`).join("")}</table></details>
<ul>${d.hooks.map((h) => `<li><code>${h.file}</code> (${h.names.length} hooks) — <span class="mut">${esc(h.names.slice(0, 10).join("، "))}${h.names.length > 10 ? "…" : ""}</span></li>`).join("")}</ul>
<h2 id="quality">ح. الجودة</h2>
<table><tr><th>الفحص</th><th>النتيجة</th><th>المدة</th></tr>
<tr><td>typecheck</td><td>${ok(check.typecheck?.ok)}</td><td>${check.typecheck?.secs ?? "—"}ث</td></tr>
<tr><td>lint</td><td>${ok(check.lint?.ok)}</td><td>${check.lint?.secs ?? "—"}ث</td></tr>
<tr><td>contracts (tsc)</td><td>${ok(check.contracts?.ok)}</td><td>${check.contracts?.secs ?? "—"}ث</td></tr>
<tr><td>e2e smoke</td><td>${check.e2e?.ran ? `${check.e2e.passed}✅ ${check.e2e.failed}❌` : "لم يُشغَّل"}</td><td>${check.e2e?.secs ? `${check.e2e.secs}ث` : "—"}</td></tr></table>
<ul>${d.i18n.map((i) => `<li>${i.label}: ar=${i.ar} · en=${i.en} · ${i.missingInEn.length + i.missingInAr.length ? `<b class="bad">خلل: ناقص en ${i.missingInEn.length} / ناقص ar ${i.missingInAr.length}</b>` : "متطابقة ✅"}</li>`).join("")}</ul>
<details><summary>أكبر 10 ملفات وملفات > 250 سطراً (${d.files.over250.length})</summary>
<ol>${d.files.top10.map((f) => `<li><code>${esc(f.file)}</code> — ${f.lines}</li>`).join("")}</ol>
<p class="mut">${d.files.over250.map((f) => `<code>${esc(f.file)}</code>(${f.lines})`).join(" ")}</p></details>
<p>حجم JS التقريبي: ${APPS.map((a) => `${a}: ${d.jsSize?.[a] != null ? `~${d.jsSize[a]}KB` : "غير مقاس"}`).join(" · ")}</p>
<h2 id="gaps">ط. النواقص والقرارات والديون</h2>
<h3>حرج</h3><ul>${crit.length ? crit.map((c) => `<li>${c}</li>`).join("") : "<li>لا شيء حرج مكتشف آلياً.</li>"}</ul>
<h3>مهم</h3><ul>${imp.map((c) => `<li>${c}</li>`).join("")}</ul>
<h3>تحسين</h3><ul>
<li>${d.todos.length} إشارة TODO/FIXME${d.todos[0] ? ` — أولها <code>${esc(d.todos[0].slice(0, 140))}</code>` : ""}</li>
<li>حالات ⚠️ في COVERAGE.md: التقسيط واجهة فقط · «صمم بالـ AI» توليد محلي · محرر القوائم بلا سحب وإفلات · تقدير التوصيل ثابت · روابط المعاينة بكوكي.</li>
<li>حجم JS من dev manifests — يُنصح بـ <code>pnpm build</code> لأرقام إنتاج دقيقة.</li></ul>
<h3>القرارات الموثقة</h3><ul>
<li>المنصة frontend فقط — كل البيانات mock عبر <code>@repo/api-client</code>.</li>
<li>سطح Copilot المشترك في <code>packages/copilot/src/ui</code> لتجنب دورة ui→copilot.</li>
<li>مكوّنات مرتبطة بطبقة التطبيق تبقى في <code>apps/&lt;app&gt;/src/components</code> — استثناء موثق.</li>
<li>سجل/مهام مساعد المنصة غير منفذ — «نطاق التاجر فقط».</li>
<li>perfume هو الثيم الافتراضي · بوابة التقييمات مبسطة (أي طلب مُوصّل).</li></ul>
<h3>خطوات مقترحة</h3><ol>
<li>معالجة البنود الحرجة (مسارات الـ spec الناقصة، تطابق المفاتيح).</li>
<li>تقسيم الملفات > 250 سطراً بدءاً بالأكبر.</li>
<li>route guards فعلية أو توثيق قرار «صلاحيات على الإجراءات فقط».</li>
<li>تفعيل e2e في CI مع تشغيل الخوادم.</li>
<li>لقطات en الحالية: desktop/فاتح فقط لكل المسارات — أكمل mobile+dark عند الحاجة.</li></ol>
<h2 id="shots">اللقطات (${shotsIndex.length})</h2>
${d.shots?.error ? `<p class="bad">${esc(d.shots.error)}</p>` : ""}
${(d.shots?.results ?? []).find((s) => s.note) ? `<p class="mut">${esc(d.shots.results.find((s) => s.note).note)}</p>` : ""}
<div class="shots">${shotsIndex.map((s) => `<a href="${s.file.replace(/^shots\//, "shots/")}" target="_blank"><img loading="lazy" src="${s.file.replace(/^shots\//, "shots/")}"><span>${esc(s.app)} ${esc(s.route)} — ${esc(s.file.split("/").pop())}</span></a>`).join("")}</div>
<p class="mut">تنسيق الاسم: &lt;مسار&gt;_&lt;viewport&gt;_&lt;mode&gt;_&lt;lang&gt;.png — اللغة عبر كوكي NEXT_LOCALE · الداكن عبر prefers-color-scheme.</p>
</main></div></body></html>`;
  mkdirSync(path.join(ROOT, "reports/ui"), { recursive: true });
  writeFileSync(path.join(ROOT, "reports/ui/index.html"), H, "utf8");
}
