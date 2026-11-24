import type { AuditLog, WebhookSubscription } from "@repo/contracts";
import type {
  AppSubmission, FeatureFlag, PartnerApp, PartnerSummary, Plan, PlanId, PlatformJob, PlatformPartner, PlatformStaff,
  PlatformSummary, ProviderIntegration, StoreSubscription, StoreUsage, SubscriptionStatus, Tenant, TenantOrder, TenantStaff,
  TenantStatus, TestStore,
} from "@repo/contracts";
import { createRandom, daysAgo, minutesAgo } from "../data/seed";

const rand = createRandom(7331);

const tenantSeeds: [string, string, string][] = [
  ["متجر نخلة", "nakhla.sa", "الرياض"],
  ["بيت العود", "baitaloud.com", "جدة"],
  ["قهوة الديرة", "aldeerah.coffee", "الرياض"],
  ["أزياء لمار", "lamar.style", "الدمام"],
  ["تمور المدينة", "madinahdates.sa", "المدينة المنورة"],
  ["عالم الجوال", "mobileworld.sa", "الرياض"],
  ["ورد وهدايا", "wardgifts.sa", "جدة"],
  ["عسل الجنوب", "southhoney.sa", "أبها"],
  ["مكتبة الرواد", "alrowad.books", "الخبر"],
  ["بشرة نقية", "pureskin.sa", "الرياض"],
  ["سفرة البيت", "sufra.home", "مكة المكرمة"],
  ["رياضة بلس", "sportplus.sa", "جدة"],
  ["ركن الأطفال", "kidscorner.sa", "الرياض"],
  ["عطور سما", "samaperfumes.com", "الدمام"],
  ["أثاث نجد", "najdfurniture.sa", "الرياض"],
  ["ساعات فخمة", "luxwatch.sa", "جدة"],
  ["مطبخ أمي", "ummikitchen.sa", "الطائف"],
  ["إلكترونيات تك", "techstore.sa", "الرياض"],
  ["حلويات سارة", "sarasweets.sa", "تبوك"],
  ["عبايات دانة", "dana.abaya", "الرياض"],
  ["نباتات خضراء", "greenplants.sa", "الخبر"],
  ["قرطاسية ألوان", "alwan.sa", "جدة"],
  ["زيوت الشفاء", "shifaoils.sa", "القصيم"],
  ["هوم ديكور", "homedecor.sa", "الرياض"],
];
const owners = ["خالد العتيبي", "نورة القحطاني", "فهد الدوسري", "ريم الشهري", "عبدالله الحربي", "منى الزهراني", "سلطان المطيري", "هيفاء الغامدي"];

export const tenants: Tenant[] = tenantSeeds.map(([name, domain, city], i) => {
  const plan = rand.weighted<PlanId>([["starter", 5], ["growth", 4], ["pro", 2]]);
  const status = i === 0 ? "active" : rand.weighted<TenantStatus>([["active", 8], ["trial", 2], ["suspended", 1]]);
  const scale = plan === "pro" ? 4 : plan === "growth" ? 2 : 1;
  const orders = status === "trial" ? rand.int(3, 40) : rand.int(60, 420) * scale;
  const owner = owners[i % owners.length] ?? "";
  return {
    id: `tnt_${String(i + 1).padStart(3, "0")}`,
    name,
    domain,
    ownerName: owner,
    ownerEmail: `owner@${domain}`,
    city,
    plan,
    status,
    orders,
    gmv: orders * rand.int(120, 420) * 100,
    aiConversations: Math.round(orders * (rand.int(15, 40) / 10)),
    createdAt: daysAgo(rand.int(2, 540)),
    hue: (i * 47) % 360,
  };
});

export const plans: Plan[] = [
  {
    id: "starter",
    name: { ar: "الأساسية", en: "Starter" },
    monthlyPrice: 9900,
    aiConversations: 300,
    staffSeats: 2,
    transactionFee: 0.015,
    features: [
      { ar: "متجر كامل بدومين خاص", en: "Full store with custom domain" },
      { ar: "وكيل خدمة العملاء", en: "Support agent" },
      { ar: "فواتير متوافقة مع فاتورة", en: "ZATCA-compliant invoices" },
    ],
    tenants: 0,
  },
  {
    id: "growth",
    name: { ar: "النمو", en: "Growth" },
    monthlyPrice: 29900,
    aiConversations: 1000,
    staffSeats: 5,
    transactionFee: 0.01,
    features: [
      { ar: "كل مزايا الأساسية", en: "Everything in Starter" },
      { ar: "وكلاء المبيعات والتسويق", en: "Sales and marketing agents" },
      { ar: "استرداد السلات المتروكة", en: "Abandoned cart recovery" },
      { ar: "تقارير متقدمة", en: "Advanced reports" },
    ],
    tenants: 0,
  },
  {
    id: "pro",
    name: { ar: "الاحترافية", en: "Pro" },
    monthlyPrice: 79900,
    aiConversations: 5000,
    staffSeats: 20,
    transactionFee: 0.005,
    features: [
      { ar: "كل مزايا النمو", en: "Everything in Growth" },
      { ar: "وكيل المخزون", en: "Inventory agent" },
      { ar: "API كامل وWebhooks", en: "Full API and webhooks" },
      { ar: "مدير حساب مخصص", en: "Dedicated account manager" },
    ],
    tenants: 0,
  },
];
for (const p of plans) p.tenants = tenants.filter((t) => t.plan === p.id && t.status !== "trial").length;

export const platformSummary: PlatformSummary = {
  mrr: plans.reduce((s, p) => s + p.tenants * p.monthlyPrice, 0) * 37,
  mrrDelta: 0.084,
  tenants: tenants.length * 37,
  tenantsDelta: 0.052,
  gmv: tenants.reduce((s, t) => s + t.gmv, 0) * 37,
  gmvDelta: 0.121,
  aiConversations: tenants.reduce((s, t) => s + t.aiConversations, 0) * 37,
  aiDelta: 0.236,
  series: Array.from({ length: 12 }, (_, i) => ({
    date: daysAgo((11 - i) * 30),
    mrr: Math.round(380_000_00 * (1 + i * 0.07) * (0.96 + rand.next() * 0.08)),
    signups: rand.int(40, 90) + i * 6,
  })),
  aiByKind: { support: 41200, sales: 26800, marketing: 9400, inventory: 3100 },
  aiCost: 18_420_00,
  services: [
    { name: "Storefront", status: "operational", latencyMs: 82, uptime: 0.9998 },
    { name: "Checkout", status: "operational", latencyMs: 145, uptime: 0.9999 },
    { name: "AI agents", status: "degraded", latencyMs: 1240, uptime: 0.9971 },
    { name: "WhatsApp", status: "operational", latencyMs: 310, uptime: 0.9994 },
    { name: "ZATCA", status: "operational", latencyMs: 520, uptime: 0.9989 },
  ],
};

export const partnerApps: PartnerApp[] = [
  {
    id: "app_sync",
    name: { ar: "مزامنة المحاسبة", en: "Ledger Sync" },
    tagline: { ar: "ربط الطلبات والفواتير مع قيود ودفترة تلقائياً", en: "Sync orders and invoices to Qoyod and Daftra" },
    category: "accounting",
    status: "live",
    installs: 1284,
    rating: 4.7,
    revenue: 38_200_00,
    monthlyPrice: 4900,
    scopes: ["orders:read", "invoices:read", "customers:read"],
    webhookUrl: "https://api.ledgersync.sa/webhooks",
    redirectUrl: "https://ledgersync.sa/oauth/callback",
    clientId: "cl_7f3a92c1e4b8",
    updatedAt: daysAgo(3),
    hue: 210,
  },
  {
    id: "app_reviews",
    name: { ar: "تقييمات موثوقة", en: "Trusted Reviews" },
    tagline: { ar: "اجمع تقييمات العملاء بعد التوصيل عبر واتساب", en: "Collect reviews after delivery via WhatsApp" },
    category: "marketing",
    status: "live",
    installs: 846,
    rating: 4.5,
    revenue: 16_900_00,
    monthlyPrice: 2900,
    scopes: ["orders:read", "products:read", "customers:read"],
    webhookUrl: "https://reviews.example.sa/hooks",
    redirectUrl: "https://reviews.example.sa/callback",
    clientId: "cl_b21e0d77a903",
    updatedAt: daysAgo(12),
    hue: 35,
  },
  {
    id: "app_pricing",
    name: { ar: "التسعير الذكي", en: "Smart Pricing" },
    tagline: { ar: "اقتراحات أسعار بالذكاء الاصطناعي حسب المنافسين", en: "AI price suggestions based on competitors" },
    category: "ai",
    status: "inReview",
    installs: 0,
    rating: 0,
    revenue: 0,
    monthlyPrice: 7900,
    scopes: ["products:read", "products:write", "orders:read"],
    webhookUrl: "https://pricing.example.sa/webhooks",
    redirectUrl: "https://pricing.example.sa/callback",
    clientId: "cl_4c88f1a6d2e0",
    updatedAt: daysAgo(1),
    hue: 280,
  },
  {
    id: "app_labels",
    name: { ar: "ملصقات الشحن", en: "Label Printer" },
    tagline: { ar: "طباعة بوالص الشحن دفعة واحدة", en: "Bulk print shipping labels" },
    category: "shipping",
    status: "draft",
    installs: 0,
    rating: 0,
    revenue: 0,
    monthlyPrice: 0,
    scopes: ["orders:read", "shipments:write"],
    webhookUrl: "",
    redirectUrl: "",
    clientId: "cl_9e17b3c0f5a4",
    updatedAt: minutesAgo(90),
    hue: 150,
  },
];

const events = ["order.created", "order.paid", "app.installed", "invoice.issued", "order.shipped", "app.uninstalled"];
export const partnerSummary: PartnerSummary = {
  installs: 2130,
  installsDelta: 0.142,
  revenue: 55_100_00,
  revenueDelta: 0.093,
  apiCalls: 1_842_300,
  apiCallsDelta: 0.188,
  errorRate: 0.0042,
  series: Array.from({ length: 30 }, (_, i) => ({
    date: daysAgo(29 - i),
    installs: rand.int(30, 90) + Math.round(i * 1.5),
    apiCalls: rand.int(45_000, 70_000) + i * 600,
  })),
  recentEvents: Array.from({ length: 8 }, (_, i) => ({
    id: `evt_${i + 1}`,
    event: rand.pick(events),
    storeName: rand.pick(tenantSeeds)[0],
    at: minutesAgo(i * 17 + rand.int(1, 12)),
    status: i === 2 ? "failed" : "delivered",
  })),
};

/* ------------------------------------------------------------------ */
/* Platform console extras (super-admin §2 routes)                      */
/* ------------------------------------------------------------------ */

const planById = (id: PlanId): Plan => plans.find((p) => p.id === id) ?? (plans[0] as Plan);

const SUB_STATUS: Record<TenantStatus, SubscriptionStatus> = {
  active: "active",
  trial: "trialing",
  suspended: "past_due",
};

export const storeSubscriptions: StoreSubscription[] = tenants.map((t, i) => ({
  id: `sub_${String(i + 1).padStart(3, "0")}`,
  tenantId: t.id,
  plan: t.plan,
  status: SUB_STATUS[t.status],
  mrr: t.status === "trial" ? 0 : planById(t.plan).monthlyPrice,
  currentPeriodEnd: daysAgo(-rand.int(3, 28)),
  startedAt: t.createdAt,
}));

export const storeUsage: StoreUsage[] = tenants.map((t) => ({
  tenantId: t.id,
  aiMessages: t.aiConversations * 3 + rand.int(40, 300),
  aiTokens: t.aiConversations * rand.int(1400, 2200),
  apiCalls: t.orders * rand.int(18, 42),
}));

const staffNames = ["سارة العمري", "محمد الأنصاري", "لطيفة السبيعي", "يوسف الرشيدي", "أمل الحربي", "تركي الشهري"];
const staffRoles: TenantStaff["role"][] = ["admin", "support", "support", "developer"];

/** Deterministic staff per tenant: owner + 2-4 members. */
export const staffByTenant: Record<string, TenantStaff[]> = Object.fromEntries(
  tenants.map((t, i) => [
    t.id,
    [
      { id: `${t.id}_owner`, name: t.ownerName, email: t.ownerEmail, role: "owner" as const, status: "active" as const },
      ...Array.from({ length: 2 + (i % 3) }, (_, j) => ({
        id: `${t.id}_stf_${j}`,
        name: staffNames[(i + j * 2) % staffNames.length] ?? "",
        email: `staff${j + 1}@${t.domain}`,
        role: staffRoles[(i + j) % staffRoles.length] ?? "support",
        status: j === 1 && i % 4 === 0 ? ("invited" as const) : ("active" as const),
      })),
    ],
  ]),
);

const ORDER_STUB_STATUS: TenantOrder["status"][] = ["paid", "paid", "pending", "paid", "refunded"];
export const ordersByTenant: Record<string, TenantOrder[]> = Object.fromEntries(
  tenants.map((t, i) => [
    t.id,
    Array.from({ length: 5 }, (_, j) => ({
      id: `${t.id}_ord_${j}`,
      number: 4200 + i * 37 + j,
      total: rand.int(8_000, 96_000),
      status: ORDER_STUB_STATUS[(i + j) % ORDER_STUB_STATUS.length] ?? "paid",
      at: daysAgo(j, 10 + ((i + j) % 8)),
    })),
  ]),
);

export const appSubmissions: AppSubmission[] = [
  {
    id: "sub_pricing",
    name: { ar: "التسعير الذكي", en: "Smart Pricing" },
    tagline: { ar: "اقتراحات أسعار بالذكاء الاصطناعي حسب المنافسين", en: "AI price suggestions based on competitors" },
    description: {
      ar: "يحلل أسعار المنافسين ويقترح أسعاراً مثلى لمنتجاتك مع تحديث تلقائي اختياري.",
      en: "Analyzes competitor prices and suggests optimal pricing for your products with optional auto-updates.",
    },
    developer: "فريق داتا لاب",
    developerEmail: "dev@datalab.sa",
    category: "ai",
    scopes: ["products:read", "products:write", "orders:read"],
    monthlyPrice: 7900,
    installs: 0,
    status: "pending",
    submittedAt: daysAgo(1),
    rejectionReason: null,
    hue: 280,
  },
  {
    id: "sub_wallets",
    name: { ar: "محافظ العملاء", en: "Store Wallets" },
    tagline: { ar: "رصيد استرجاع يتحول لمحفظة داخل المتجر", en: "Turn refunds into in-store wallet credit" },
    description: {
      ar: "يضيف محفظة لكل عميل تُشحن من المرتجعات والعروض وتُخصم تلقائياً عند الدفع.",
      en: "Adds a per-customer wallet funded by refunds and promotions, applied automatically at checkout.",
    },
    developer: "بناء تقنية",
    developerEmail: "hello@binaa.tech",
    category: "payments",
    scopes: ["customers:read", "customers:write", "orders:read"],
    monthlyPrice: 5900,
    installs: 0,
    status: "pending",
    submittedAt: daysAgo(2),
    rejectionReason: null,
    hue: 160,
  },
  {
    id: "sub_fulfill",
    name: { ar: "تتبع الشحنات الموحد", en: "Unified Tracking" },
    tagline: { ar: "صفحة تتبع واحدة لكل شركات الشحن", en: "One tracking page for all carriers" },
    description: {
      ar: "يجمع حالات الشحنة من سمسا وأرامكس وغيرها في صفحة تتبع واحدة بعلامة المتجر.",
      en: "Aggregates shipment status from SMSA, Aramex and more into a single store-branded tracking page.",
    },
    developer: "شحنلي",
    developerEmail: "api@shahinli.sa",
    category: "shipping",
    scopes: ["orders:read", "shipments:read"],
    monthlyPrice: 0,
    installs: 0,
    status: "pending",
    submittedAt: daysAgo(4),
    rejectionReason: null,
    hue: 200,
  },
  {
    id: "sub_sync",
    name: { ar: "مزامنة المحاسبة", en: "Ledger Sync" },
    tagline: { ar: "ربط الطلبات والفواتير مع قيود ودفترة تلقائياً", en: "Sync orders and invoices to Qoyod and Daftra" },
    description: {
      ar: "يرسل الطلبات والفواتير إلى أنظمة المحاسبة السحابية فور صدورها.",
      en: "Pushes orders and invoices to cloud accounting systems as soon as they are issued.",
    },
    developer: "فريق ليدجر",
    developerEmail: "dev@ledgersync.sa",
    category: "accounting",
    scopes: ["orders:read", "invoices:read", "customers:read"],
    monthlyPrice: 4900,
    installs: 1284,
    status: "approved",
    submittedAt: daysAgo(120),
    rejectionReason: null,
    hue: 210,
  },
  {
    id: "sub_spam",
    name: { ar: "خصومات وهمية", en: "Fake Discounts" },
    tagline: { ar: "كوبونات تلقائية لكل زائر", en: "Auto coupons for every visitor" },
    description: {
      ar: "يعرض نافذة خصم لكل زائر — رُفض لأنه يعدّل سلة العميل بدون موافقته.",
      en: "Shows a discount popup to every visitor — rejected for mutating carts without consent.",
    },
    developer: "مطور مستقل",
    developerEmail: "solo@dev.sa",
    category: "marketing",
    scopes: ["orders:write", "customers:read", "products:read", "invoices:read"],
    monthlyPrice: 0,
    installs: 0,
    status: "rejected",
    submittedAt: daysAgo(30),
    rejectionReason: "scope_abuse",
    hue: 0,
  },
];

const partnerSeeds: [string, string, PlatformPartner["status"]][] = [
  ["فهد العتيبي", "فريق ليدجر", "active"],
  ["نورة القحطاني", "داتا لاب", "active"],
  ["عبدالله المطيري", "شحنلي", "active"],
  ["ريم الدوسري", "بناء تقنية", "active"],
  ["سلطان الحربي", "تطبيقات الخليج", "pending"],
  ["ماجد الزهراني", "مطور مستقل", "suspended"],
];
export const platformPartners: PlatformPartner[] = partnerSeeds.map(([name, company, status], i) => ({
  id: `ptr_${String(i + 1).padStart(2, "0")}`,
  name,
  company,
  email: `dev${i + 1}@${company === "فريق ليدجر" ? "ledgersync.sa" : "partners.dev"}`,
  appsCount: [1, 2, 1, 3, 1, 1][i] ?? 1,
  status,
  joinedAt: daysAgo(rand.int(14, 400)),
}));

export const providerIntegrations: ProviderIntegration[] = [
  { id: "prv_moyasar", kind: "payment", name: { ar: "ميسر", en: "Moyasar" }, description: { ar: "مدى وApple Pay والبطاقات الائتمانية", en: "Mada, Apple Pay, and credit cards" }, enabled: true, storesCount: 812 },
  { id: "prv_tap", kind: "payment", name: { ar: "تاب", en: "Tap" }, description: { ar: "بوابة دفع بديلة بعملات متعددة", en: "Alternative multi-currency gateway" }, enabled: true, storesCount: 96 },
  { id: "prv_stc", kind: "payment", name: { ar: "STC Pay", en: "STC Pay" }, description: { ar: "الدفع بالمحفظة الرقمية", en: "Digital wallet payments" }, enabled: false, storesCount: 0 },
  { id: "prv_smsa", kind: "shipping", name: { ar: "سمسا", en: "SMSA" }, description: { ar: "شحن واسترجاع مع تتبع مباشر", en: "Shipping and returns with live tracking" }, enabled: true, storesCount: 634 },
  { id: "prv_aramex", kind: "shipping", name: { ar: "أرامكس", en: "Aramex" }, description: { ar: "شحن محلي ودولي", en: "Domestic and international shipping" }, enabled: true, storesCount: 221 },
  { id: "prv_spl", kind: "shipping", name: { ar: "سبل", en: "SPL" }, description: { ar: "البريد السعودي للشحنات الخفيفة", en: "Saudi Post for light shipments" }, enabled: false, storesCount: 0 },
  { id: "prv_wa", kind: "communication", name: { ar: "واتساب للأعمال", en: "WhatsApp Business" }, description: { ar: "قناة المحادثات ورسائل الوكلاء", en: "Conversations and agent messaging channel" }, enabled: true, storesCount: 745 },
];

const jobSeeds: [string, PlatformJob["status"], number][] = [
  ["invoices.zatca_sync", "success", 42],
  ["orders.abandoned_dispatch", "success", 18],
  ["ai.usage_rollup", "running", 0],
  ["billing.mrr_recompute", "success", 8],
  ["webhooks.retry_failed", "failed", 3],
  ["tenants.trial_expiry", "queued", 0],
  ["search.reindex", "success", 210],
  ["backups.nightly", "success", 640],
];
export const platformJobs: PlatformJob[] = jobSeeds.map(([name, status, fail], i) => ({
  id: `job_${i + 1}`,
  name,
  status,
  lastRunAt: status === "queued" ? daysAgo(1) : minutesAgo(i * 23 + rand.int(2, 15)),
  durationMs: rand.int(400, 92_000),
  failures: fail,
}));

const auditActors = ["خالد العتيبي", "نورة القحطاني", "نظام المنصة", "فهد الدوسري"];
const auditActions: [string, string][] = [
  ["tenant.suspended", "متجر نخلة"],
  ["plan.price_updated", "الباقة الاحترافية"],
  ["app.approved", "مزامنة المحاسبة"],
  ["app.rejected", "خصومات وهمية"],
  ["provider.disabled", "سبل"],
  ["flag.enabled", "checkout.v2"],
  ["staff.invited", "team@tajer.sa"],
  ["tenant.impersonated", "قهوة الديرة"],
  ["job.retried", "webhooks.retry_failed"],
  ["subscription.cancelled", "مطبخ أمي"],
];
export const platformAuditLogs: AuditLog[] = auditActions.map(([action, label], i) => ({
  id: `log_${i + 1}`,
  actor: { type: i === 2 ? "system" : "staff", id: `stf_${i}`, name: auditActors[i % auditActors.length] ?? "" },
  action,
  target: { type: action.startsWith("tenant") || action.startsWith("subscription") ? "staff" : "app", id: `tgt_${i}`, label },
  changes: i % 3 === 0 ? [{ field: "status", from: "active", to: "suspended" }] : [],
  ip: i === 2 ? null : `185.12.${40 + i}.${10 + i}`,
  at: minutesAgo(i * 47 + rand.int(5, 30)),
}));

export const featureFlags: FeatureFlag[] = [
  { id: "flg_checkout2", key: "checkout.v2", name: { ar: "الدفع الجديد", en: "Checkout v2" }, description: { ar: "صفحة دفع بخطوة واحدة", en: "One-step checkout page" }, enabled: true, scope: "plan", audience: "pro" },
  { id: "flg_ai_voices", key: "agents.voice", name: { ar: "الوكيل الصوتي", en: "Voice agent" }, description: { ar: "مكالمات صوتية بالذكاء الاصطناعي", en: "AI voice calls" }, enabled: true, scope: "plan", audience: "growth_pro" },
  { id: "flg_multi", key: "stores.multi", name: { ar: "متاجر متعددة", en: "Multi-store" }, description: { ar: "إدارة أكثر من متجر من حساب واحد", en: "Manage several stores from one account" }, enabled: false, scope: "all", audience: "all" },
  { id: "flg_marketplace", key: "apps.marketplace_v2", name: { ar: "متجر التطبيقات الجديد", en: "Marketplace v2" }, description: { ar: "واجهة متجر التطبيقات المعاد تصميمها", en: "Redesigned app marketplace" }, enabled: true, scope: "stores", audience: "stores_120" },
  { id: "flg_cod", key: "payments.cod_fees", name: { ar: "رسوم الدفع عند الاستلام", en: "COD fees" }, description: { ar: "إضافة رسوم تلقائية على الدفع عند الاستلام", en: "Automatic fee on cash-on-delivery orders" }, enabled: false, scope: "stores", audience: "stores_beta" },
];

export const platformTeam: PlatformStaff[] = [
  { id: "pst_1", name: "خالد العتيبي", email: "khalid@tajer.sa", role: "owner", status: "active", lastActiveAt: minutesAgo(4) },
  { id: "pst_2", name: "نورة القحطاني", email: "noura@tajer.sa", role: "admin", status: "active", lastActiveAt: minutesAgo(31) },
  { id: "pst_3", name: "فهد الدوسري", email: "fahad@tajer.sa", role: "support", status: "active", lastActiveAt: daysAgo(1, 11) },
  { id: "pst_4", name: "ريم الشهري", email: "reem@tajer.sa", role: "developer", status: "active", lastActiveAt: daysAgo(2, 15) },
  { id: "pst_5", name: "لانا المطيري", email: "lana@tajer.sa", role: "support", status: "invited", lastActiveAt: null },
];

/* ------------------------------------------------------------------ */
/* Developer portal extras                                              */
/* ------------------------------------------------------------------ */

const deliveryEvents = ["order.created", "order.paid", "order.shipped", "app.uninstalled"];

/** Webhook subscription + recent deliveries per partner app (§4.21). */
export const appWebhooks: Record<string, WebhookSubscription> = Object.fromEntries(
  partnerApps.map((a, i) => [
    a.id,
    {
      id: `wh_${a.id}`,
      url: a.webhookUrl,
      events: deliveryEvents.slice(0, 2 + (i % 3)),
      secret: null,
      status: i === 2 ? "disabled_failing" : "active",
      deliveries: Array.from({ length: 8 }, (_, j) => ({
        id: `${a.id}_dlv_${j}`,
        event: deliveryEvents[(i + j) % deliveryEvents.length] ?? "order.created",
        status: j === 3 && i % 2 === 0 ? ("failed" as const) : ("succeeded" as const),
        httpCode: j === 3 && i % 2 === 0 ? 500 : 200,
        attempt: j === 3 && i % 2 === 0 ? 2 : 1,
        at: minutesAgo(j * 53 + rand.int(3, 20)),
        durationMs: rand.int(60, 900),
      })),
    },
  ]),
);

export const testStores: TestStore[] = [
  { id: "tst_1", name: "متجر تجريبي ١", url: "https://sandbox-1.dev.tajer.sa", createdAt: daysAgo(60) },
  { id: "tst_2", name: "متجر العطور التجريبي", url: "https://sandbox-perfumes.dev.tajer.sa", createdAt: daysAgo(21) },
];
