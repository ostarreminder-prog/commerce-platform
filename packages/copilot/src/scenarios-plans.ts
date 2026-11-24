import type { CopilotResponse, Scenario } from "./types";
import { couponInput } from "./registry-extra";
import { DAY_MS, dataNow, step } from "./engine-helpers";

/* Merchant multi-step plans — each step runs via executeStep() through
 * TOOL_REGISTRY when the UI advances the plan. */

const dormantCoupon: Scenario = {
  id: "dormant-customers-coupon",
  test: /(عملاء|زباين|زبائن).*(خامل|غير نشط|منقطع|ما اشترو|رجع)|خاملين|استرجاع عملاء|كوبون.*خامل|win ?back/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const customers = await ctx.api.customers.list();
    const anchor = dataNow(customers.map((c) => c.stats.lastOrderAt));
    const dormant = customers.filter(
      (c) => c.segment === "at_risk" || !c.stats.lastOrderAt || +new Date(c.stats.lastOrderAt) < anchor - 60 * DAY_MS,
    );
    if (!dormant.length) return { kind: "text", text: "كل عملائك نشطون — ما فيه شريحة خاملة تحتاج استرجاع." };
    const ids = dormant.map((c) => c.id);
    return {
      kind: "plan",
      title: `خطة استرجاع ${ids.length} عميل خامل`,
      steps: [
        step(`تحديد ${ids.length} عميل ما اشتروا من +60 يوم`, "customers.list", { limit: 200 }),
        step("إنشاء كوبون COMEBACK10 بخصم 10% مخصص لهم", "coupons.create", {
          input: couponInput("COMEBACK10", 10, { type: "specific", customerIds: ids }),
        }),
        step("حملة واتساب «اشتقنا لك» مع الكوبون", "marketing.whatsappCampaign", {
          segment: "dormant",
          message: "اشتقنا لك! خصم 10% على طلبك الجاي بكود COMEBACK10",
          recipients: ids.length,
        }),
      ],
    };
  },
};

const ramadanPrep: Scenario = {
  id: "ramadan-prep",
  test: /رمضان/,
  run: async (_input, ctx): Promise<CopilotResponse> => {
    const customers = await ctx.api.customers.list();
    return {
      kind: "plan",
      title: "تجهيز المتجر لرمضان (5 خطوات)",
      steps: [
        step("تطبيق ثيم «رمضان» على الثيم المنشور ونشره", "themes.applyPreset", { query: "رمضان" }),
        step("إنشاء صفحة هبوط «عروض رمضان»", "pages.create", {
          input: {
            title: { ar: "عروض رمضان", en: "Ramadan Deals" },
            slug: "ramadan",
            content: { ar: "اكتشف تشكيلة العروض الرمضانية — هدايا وتغليف مجاني.", en: "Discover our Ramadan deals." },
            seo: { title: "عروض رمضان", description: "خصومات وهدايا رمضانية على كامل المتجر." },
            status: "draft",
            showInMenu: true,
          },
        }),
        step("إنشاء كوبون RAMADAN15 بخصم 15%", "coupons.create", {
          input: couponInput("RAMADAN15", 15, { type: "all", customerIds: [] }),
        }),
        step("حملة واتساب «رمضان كريم» لكل العملاء", "marketing.whatsappCampaign", {
          segment: "all",
          message: "رمضان كريم! عروضنا الرمضانية بدأت — خصم 15% بكود RAMADAN15",
          recipients: customers.length,
        }),
        step("تحديث ترحيب الوكيل الرئيسي بتحية رمضان", "agents.updateGreeting", {
          greeting: "رمضان كريم! كيف أقدر أخدمك اليوم؟",
        }),
      ],
    };
  },
};

export const MERCHANT_PLAN_SCENARIOS: Scenario[] = [dormantCoupon, ramadanPrep];
