import type { CopilotResponse, Scenario, TableRow } from "./types";
import { registerAction } from "./executor";
import { DAY_MS, dataNow, fmtSAR, normalizeArabic } from "./engine-helpers";

/* Platform (super-admin) scenarios — ctx.api.platform must be injected.
 * Stage-1 skeleton covers all five intents; new-stores and abnormal
 * usage are fully computed, the rest run through platform tools. */

const newStores: Scenario = {
  id: "new-stores-count",
  test: /(متاجر|متجر|مشترك|stores?).*(جديد|جدد|انضم)|عدد المتاجر|كم متجر|اشتراكات جديده/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const platform = ctx.api.platform;
    if (!platform) return { kind: "text", text: "سطح المنصة غير متصل في هذا السياق." };
    const tenants = await platform.tenants();
    const anchor = dataNow(tenants.map((t) => t.createdAt));
    const fresh = tenants.filter((t) => +new Date(t.createdAt) > anchor - 30 * DAY_MS);
    const rows: TableRow[] = fresh
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 8)
      .map((t) => ({ name: t.name, city: t.city, plan: t.plan, status: t.status, at: t.createdAt.slice(0, 10) }));
    return {
      kind: "text",
      text: `انضم ${fresh.length} متجر جديد خلال آخر 30 يوماً — من أصل ${tenants.length} متجر على المنصة.`,
      table: {
        title: "أحدث المتاجر",
        columns: [
          { key: "name", label: "المتجر" },
          { key: "city", label: "المدينة" },
          { key: "plan", label: "الباقة" },
          { key: "status", label: "الحالة" },
          { key: "at", label: "تاريخ الانضمام" },
        ],
        rows,
      },
      links: [{ label: "المتاجر", href: "/stores" }],
    };
  },
};

const abnormalUsage: Scenario = {
  id: "abnormal-ai-usage",
  test: /(استخدام|استهلاك).*(ai|ذكاء|مفرط|غير طبيعي|شاذ|عال)|abnormal|استهلاك ai/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const platform = ctx.api.platform;
    if (!platform) return { kind: "text", text: "سطح المنصة غير متصل في هذا السياق." };
    const [usage, tenants, plans] = await Promise.all([platform.usage(), platform.tenants(), platform.plans()]);
    const byTenant = new Map(tenants.map((t) => [t.id, t] as const));
    const byPlan = new Map(plans.map((p) => [p.id, p] as const));
    const rows = usage
      .map((u) => {
        const tenant = byTenant.get(u.tenantId);
        const limit = (tenant && byPlan.get(tenant.plan)?.aiConversations) || 0;
        return { u, tenant, limit, ratio: limit > 0 ? u.aiMessages / limit : 0 };
      })
      .filter((x) => x.tenant && (x.ratio > 1.1 || (x.limit === 0 && x.u.aiMessages > 0)))
      .sort((a, b) => b.ratio - a.ratio);
    return {
      kind: "text",
      text: rows.length
        ? `رصدت ${rows.length} متجر يتجاوز استهلاك الـ AI حد باقته — راجع القائمة وقرر الترقية أو التقييد.`
        : "استهلاك الـ AI ضمن حدود الباقات لكل المتاجر — ما فيه شذوذ.",
      table: {
        title: "متاجر فوق حد الاستهلاك",
        columns: [
          { key: "name", label: "المتجر" },
          { key: "plan", label: "الباقة" },
          { key: "msgs", label: "رسائل AI" },
          { key: "limit", label: "حد الباقة" },
          { key: "ratio", label: "النسبة" },
        ],
        rows: rows.slice(0, 8).map((x) => ({
          name: x.tenant?.name ?? x.u.tenantId, plan: x.tenant?.plan ?? "—",
          msgs: x.u.aiMessages, limit: x.limit || "—", ratio: x.ratio ? `${Math.round(x.ratio * 100)}%` : "∞",
        })),
      },
      links: [{ label: "الاستهلاك", href: "/usage" }],
    };
  },
};

const suspendStore: Scenario = {
  id: "suspend-store",
  test: /(ايقاف|اوقف|تعليق|علق|قفل|suspend).*(متجر|مشترك|store)/,
  run: async (input, ctx): Promise<CopilotResponse> => {
    const platform = ctx.api.platform;
    if (!platform) return { kind: "text", text: "سطح المنصة غير متصل في هذا السياق." };
    const tenants = await platform.tenants();
    const norm = normalizeArabic(input);
    const tenant = tenants.find((t) => norm.includes(normalizeArabic(t.name)));
    if (!tenant) {
      const active = tenants.filter((t) => t.status === "active").slice(0, 3);
      return {
        kind: "clarify",
        question: "أي متجر تقصد؟ اذكر اسمه — مثال: «أوقف متجر نخبة العود»",
        options: [...active.map((t) => ({ id: `suspend:${t.id}`, label: t.name })), { id: "cancel", label: "إلغاء" }],
      };
    }
    const actionId = registerAction({
      calls: [{ toolName: "platform.suspendStore", args: { tenantId: tenant.id } }],
      summary: `أوقفت متجر «${tenant.name}» — صاحبه يقدر يستأنف من لوحته أو بطلب مراجعة.`,
      undoable: true,
      links: [{ label: "ملف المتجر", href: `/stores/${tenant.id}` }],
    });
    return {
      kind: "action",
      actionId,
      title: `إيقاف متجر «${tenant.name}»`,
      description: `المتجر بينقفل فوراً عن الزوار والتاجر (الخطة: ${tenant.plan} — GMV ${fmtSAR(tenant.gmv)}).`,
      affected: { count: 1, items: [`${tenant.name} — ${tenant.domain}`] },
      dangerLevel: "dangerous",
      requiresTextConfirm: "إيقاف",
    };
  },
};

const retryJobs: Scenario = {
  id: "retry-failed-jobs",
  test: /(مهام|وظايف|jobs|جوبز).*(فاشل|معطل|متعثر)|اعاده.*(مهام|jobs)|فشل.*مهام/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const platform = ctx.api.platform;
    if (!platform) return { kind: "text", text: "سطح المنصة غير متصل في هذا السياق." };
    const failed = (await platform.jobs()).filter((j) => j.status === "failed");
    if (!failed.length) return { kind: "text", text: "كل المهام الخلفية شغالة — ما فيه مهام فاشلة.", links: [{ label: "المهام", href: "/jobs" }] };
    const actionId = registerAction({
      calls: [{ toolName: "platform.retryJobs", args: { ids: failed.map((j) => j.id) } }],
      summary: `أعدت جدولة ${failed.length} مهمة فاشلة.`,
      undoable: false,
      links: [{ label: "المهام", href: "/jobs" }],
    });
    return {
      kind: "action",
      actionId,
      title: `إعادة تشغيل ${failed.length} مهمة فاشلة`,
      description: `بيُعاد تشغيل: ${failed.map((j) => j.name).join("، ")}.`,
      affected: { count: failed.length, items: failed.map((j) => j.name) },
      dangerLevel: "normal",
    };
  },
};

const monthlyReport: Scenario = {
  id: "monthly-report",
  test: /(تقرير|ملخص|اداء).*(شهر|الشهر)|mrr|تقرير المنصه/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const platform = ctx.api.platform;
    if (!platform) return { kind: "text", text: "سطح المنصة غير متصل في هذا السياق." };
    const s = await platform.summary();
    return {
      kind: "text",
      text:
        `ملخص المنصة: MRR ${fmtSAR(s.mrr)} (${s.mrrDelta > 0 ? "+" : ""}${s.mrrDelta}%) · ` +
        `${s.tenants} متجر · GMV ${fmtSAR(s.gmv)} · ${s.aiConversations.toLocaleString("en-US")} محادثة AI ` +
        `بتكلفة ${fmtSAR(s.aiCost)}.`,
      links: [
        { label: "لوحة المنصة", href: "/" },
        { label: "الاشتراكات", href: "/subscriptions" },
      ],
    };
  },
};

export const PLATFORM_SCENARIOS: Scenario[] = [newStores, abnormalUsage, suspendStore, retryJobs, monthlyReport];
