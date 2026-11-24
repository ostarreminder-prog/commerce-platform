import type {
  ApiKey, ChannelSettings, MaintenanceSettings, MerchantBilling, NotificationPrefChannel, NotificationPreferences,
  NotificationTemplate, PaymentSettings, ShippingSettings, StoreVerification, TaxSettings, WebhookSubscription,
} from "@repo/contracts";
import { money } from "@repo/contracts";
import { daysAgo, minutesAgo } from "../data/seed";

/* Spec §4.20–4.22 settings fixtures — power the `/settings/*` screens. */

export const paymentSettings: PaymentSettings = {
  providerAccountStatus: "pending_kyc",
  methods: [
    { method: "mada", enabled: true },
    { method: "card", enabled: true },
    { method: "apple_pay", enabled: true },
    { method: "stc_pay", enabled: true },
    { method: "bank_transfer", enabled: false },
    { method: "payment_link", enabled: true },
    { method: "cod", enabled: true },
  ],
  cod: { enabled: true, fee: money(1500), maxOrder: money(150000), cities: ["الرياض", "جدة", "الدمام"] },
  bankTransfer: { enabled: false, iban: "SA44 8000 0000 6080 1016 7519", bankName: "مصرف الراجحي", instructions: "حوّل المبلغ ثم أرسل الإيصال على واتساب المتجر." },
  settlement: { nextPayoutAt: daysAgo(-2, 10), pending: money(842_300), lastPayout: money(1_204_500) },
};

export const shippingSettings: ShippingSettings = {
  pickupAddress: {
    id: "addr_store", label: null, recipientName: "متجر نخلة", phone: "+966114567890", city: "الرياض", district: "العليا",
    street: "طريق الملك فهد", buildingNumber: "7421", additionalNumber: "3318", postalCode: "12271", shortAddress: "RRRD7421",
    location: { lat: 24.7136, lng: 46.6753 }, notes: null, isDefault: true,
  },
  zones: [
    {
      id: "zone_main",
      name: "المدن الرئيسية",
      cities: ["الرياض", "جدة", "الدمام", "مكة المكرمة"],
      rates: [
        { type: "flat", conditions: "كل الطلبات", price: money(2500) },
        { type: "price", conditions: "طلبات فوق 300 ر.س", price: money(0) },
      ],
    },
    {
      id: "zone_regions",
      name: "باقي المناطق",
      cities: ["أبها", "تبوك", "حائل", "جازان"],
      rates: [
        { type: "flat", conditions: "كل الطلبات", price: money(3500) },
        { type: "weight", conditions: "أكثر من 10 كجم", price: money(5000) },
      ],
    },
  ],
  carriers: [
    { carrierId: "smsa", enabled: true },
    { carrierId: "aramex", enabled: true },
    { carrierId: "spl", enabled: true },
    { carrierId: "redbox", enabled: false },
  ],
  freeShippingThreshold: money(30000),
  fallbackRate: money(4000),
  handlingDays: 2,
};

export const taxSettings: TaxSettings = {
  vatEnabled: true,
  vatRate: 15,
  pricesIncludeTax: true,
  zatcaStatus: "connected",
  egsSerial: "EGS-1-ABC123-456789",
};

const template = (event: NotificationTemplate["event"], channel: NotificationTemplate["channel"], ar: string, en: string, enabled = true): NotificationTemplate => ({
  event,
  channel,
  enabled,
  content: { ar, en },
  whatsappTemplateStatus: channel === "whatsapp" ? "approved" : null,
});

export const notificationTemplates: NotificationTemplate[] = [
  template("order_confirmed", "whatsapp", "شكراً {customer_name}! استلمنا طلبك #{order_number} وبنجهزه الحين.", "Thanks {customer_name}! We received your order #{order_number}."),
  template("order_confirmed", "email", "تأكيد الطلب #{order_number} — شكراً لتسوقك معنا.", "Order #{order_number} confirmed — thanks for shopping with us."),
  template("payment_failed", "whatsapp", "ما اكتمل دفع طلبك #{order_number}. جرّب مرة ثانية من الرابط: {tracking_url}", "Payment for order #{order_number} failed. Retry here: {tracking_url}"),
  template("shipped", "whatsapp", "طلبك #{order_number} انشحن! تتبعه هنا: {tracking_url}", "Order #{order_number} shipped! Track it: {tracking_url}"),
  template("shipped", "sms", "طلبك #{order_number} انشحن. التتبع: {tracking_url}", "Order #{order_number} shipped. Track: {tracking_url}"),
  template("out_for_delivery", "whatsapp", "طلبك #{order_number} مع مندوب التوصيل — بيوصلك اليوم.", "Order #{order_number} is out for delivery today."),
  template("delivered", "whatsapp", "وصل طلبك #{order_number} ✓ نتمنى يعجبك!", "Order #{order_number} delivered ✓ enjoy!"),
  template("cart_abandoned", "whatsapp", "{customer_name}، نسيت شي في سلتك 👀 كمل طلبك: {tracking_url}", "{customer_name}, you left something in your cart 👀 {tracking_url}", false),
  template("return_update", "whatsapp", "تحديث على مرتجعك لطلب #{order_number}: تابع التفاصيل هنا {tracking_url}", "Update on your return for order #{order_number}: {tracking_url}"),
  template("otp", "sms", "رمز التحقق: {order_number}. صالح لمدة 10 دقائق.", "Your verification code: {order_number}. Valid for 10 minutes."),
  template("otp", "whatsapp", "رمز التحقق الخاص بك: {order_number}", "Your verification code: {order_number}"),
];

export const channelSettings: ChannelSettings = {
  whatsappNumbers: [
    { id: "chn_wa1", phone: "+966555123456", displayName: "متجر نخلة", status: "active", qualityRating: "high", agentId: "agt_sales" },
    { id: "chn_wa2", phone: "+966555987654", displayName: "دعم نخلة", status: "pending", qualityRating: null, agentId: "agt_care" },
  ],
  voiceNumbers: [{ id: "chn_v1", phone: "+966112345678", displayName: "اتصال نخلة", status: "active", qualityRating: null, agentId: "agt_main" }],
  webchat: { enabled: true, position: "start", color: "primary", greeting: "أهلاً! كيف نقدر نساعدك؟", agentId: "agt_sales" },
  /* Social messaging connections (`/agents/channels`) — instagram/messenger/email
   * already feed the seeded inbox threads; x/tiktok start pending/disconnected so
   * the connect flow has something to show. */
  social: [
    { id: "soc_ig", kind: "instagram", handle: "@nakhla_store", status: "connected", agentId: "agt_sales", connectedAt: daysAgo(45, 13) },
    { id: "soc_msg", kind: "messenger", handle: "nakhla.sa", status: "connected", agentId: "agt_care", connectedAt: daysAgo(12, 15) },
    { id: "soc_x", kind: "x", handle: "@nakhla_sa", status: "pending", agentId: null, connectedAt: null },
    { id: "soc_tt", kind: "tiktok", handle: "", status: "disconnected", agentId: null, connectedAt: null },
    { id: "soc_em", kind: "email", handle: "fawzi@nakhla.sa", status: "connected", agentId: "agt_care", connectedAt: daysAgo(20, 10) },
  ],
};

/** Storefront maintenance toggle — synced cross-app like paymentSettings. */
export const maintenance: MaintenanceSettings = {
  enabled: false,
  message: { ar: "نجهّز المتجر بتحسينات جديدة — نرجع لك قريباً.", en: "We're preparing new improvements — back soon." },
  eta: null,
};

/* Merchant notification preferences (`/notifications` → تفضيلات) — per-event
 * channel toggles. `inapp` is delivered for real; the other channels persist
 * as the merchant's choice until real delivery exists. */
const pref = (over: Partial<Record<NotificationPrefChannel, boolean>> = {}) => ({ inapp: true, whatsapp: false, email: false, sms: false, ...over });
export const notificationPrefs: NotificationPreferences = {
  matrix: {
    order_created: pref({ whatsapp: true, email: true }),
    payment_failed: pref({ whatsapp: true, sms: true }),
    conversation_waiting: pref({ whatsapp: true }),
    approval_requested: pref({ whatsapp: true }),
    low_stock: pref({ email: true }),
    shipments_delayed: pref({ email: true }),
    invoice_rejected: pref({ whatsapp: true, email: true }),
    return_requested: pref({ whatsapp: true }),
    app_installed: pref(),
    usage_limit: pref({ email: true, sms: true }),
  },
};

export const apiKeys: ApiKey[] = [
  { id: "key_erp", name: "ربط نظام المحاسبة", scopes: ["orders.read", "invoices.read"], prefix: "sk_live_a1b2", createdBy: "خالد العتيبي", lastUsedAt: minutesAgo(35), expiresAt: null },
  { id: "key_bi", name: "لوحة التقارير الخارجية", scopes: ["reports.read"], prefix: "sk_live_x9y8", createdBy: "ريم الحربي", lastUsedAt: daysAgo(2, 16), expiresAt: daysAgo(-180, 0) },
];

export const storeWebhooks: WebhookSubscription[] = [
  {
    id: "wh_orders",
    url: "https://erp.example.sa/webhooks/orders",
    events: ["order.created", "order.paid", "order.shipped"],
    secret: null,
    status: "active",
    deliveries: Array.from({ length: 8 }, (_, j) => ({
      id: `wh_orders_dlv_${j}`,
      event: ["order.created", "order.paid", "order.shipped"][j % 3] ?? "order.created",
      status: j === 4 ? ("failed" as const) : ("succeeded" as const),
      httpCode: j === 4 ? 500 : 200,
      attempt: j === 4 ? 2 : 1,
      at: minutesAgo(j * 61 + 12),
      durationMs: 90 + j * 37,
    })),
  },
  {
    id: "wh_customers",
    url: "https://hooks.example.sa/customers",
    events: ["customer.created"],
    secret: null,
    status: "disabled_failing",
    deliveries: Array.from({ length: 4 }, (_, j) => ({
      id: `wh_customers_dlv_${j}`,
      event: "customer.created",
      status: "failed" as const,
      httpCode: 502,
      attempt: 3,
      at: minutesAgo(j * 130 + 45),
      durationMs: 3000,
    })),
  },
];

export const merchantBilling: MerchantBilling = {
  planId: "growth",
  status: "active",
  currentPeriodEnd: daysAgo(-18, 0),
  monthlyPrice: money(29900),
  usage: [
    { metric: "products", used: 30, limit: 500 },
    { metric: "staff", used: 5, limit: 5 },
    { metric: "agentConversations", used: 580, limit: 1000 },
    { metric: "orders", used: 412, limit: 2000 },
  ],
  addons: [
    { id: "addon_ai", name: { ar: "حزمة محادثات وكيل إضافية", en: "Extra agent conversations pack" }, price: money(9900), enabled: false },
    { id: "addon_whatsapp", name: { ar: "رقم WhatsApp إضافي", en: "Extra WhatsApp number" }, price: money(4900), enabled: true },
  ],
  invoices: Array.from({ length: 3 }, (_, i) => ({ id: `sub_inv_${i + 1}`, at: daysAgo((i + 1) * 30, 8), amount: money(34385), status: "paid" as const })),
  paymentMethod: { brand: "mada", last4: "8821" },
};

export const storeVerification: StoreVerification = {
  status: "in_review",
  rejectionReason: null,
  documents: [
    { id: "doc_nid", kind: "national_id", fileName: "national-id.pdf", status: "uploaded" },
    { id: "doc_cr", kind: "commercial_registration", fileName: "cr.pdf", status: "uploaded" },
    { id: "doc_iban", kind: "iban_certificate", fileName: null, status: "missing" },
  ],
};
