import { z } from "zod";
import { zId, zRec, type GenNsSpec } from "./spec-helpers";

/* Store-settings + storefront domain: settings.* sub-namespaces (dotted
 * api paths) and themes/pages/menus/domains/seo/themeShares. */

const SETTINGS = "settings.manage";

export const STORE_SPEC: GenNsSpec[] = [
  {
    ns: "settings.general", entityAr: "إعدادات المتجر العامة", entityEn: "general settings", writePermission: SETTINGS,
    write: [{ m: "save", args: "input", undoable: true }],
  },
  {
    ns: "settings.payments", entityAr: "إعدادات الدفع", entityEn: "payment settings", readPermission: SETTINGS, writePermission: SETTINGS,
    read: [{ m: "get", args: "none" }],
    write: [{ m: "save", args: "input", undoable: true }],
  },
  {
    ns: "settings.shipping", entityAr: "إعدادات الشحن", entityEn: "shipping settings", readPermission: SETTINGS, writePermission: SETTINGS,
    read: [{ m: "get", args: "none" }],
    write: [{ m: "save", args: "input", undoable: true }],
  },
  {
    ns: "settings.taxes", entityAr: "إعدادات الضريبة", entityEn: "tax settings", readPermission: SETTINGS, writePermission: SETTINGS,
    read: [{ m: "get", args: "none" }],
    write: [{ m: "save", args: "input", undoable: true }],
  },
  {
    ns: "settings.notifications", entityAr: "قالب تنبيه", entityEn: "notification template", readPermission: SETTINGS, writePermission: SETTINGS,
    read: [{ m: "list" }],
    write: [{ m: "save", args: "input", undoable: true, descAr: "حفظ قالب حدث+قناة" }],
  },
  {
    ns: "settings.channels", entityAr: "إعدادات القنوات", entityEn: "channel settings", readPermission: SETTINGS, writePermission: SETTINGS,
    read: [{ m: "get", args: "none" }],
    write: [{ m: "save", args: "input", undoable: true }],
  },
  {
    ns: "settings.billing", entityAr: "فوترة التاجر", entityEn: "merchant billing", readPermission: "billing.manage",
    read: [{ m: "get", args: "none" }],
  },
  {
    ns: "settings.verification", entityAr: "توثيق المتجر", entityEn: "store verification", readPermission: SETTINGS, writePermission: SETTINGS,
    read: [{ m: "get", args: "none" }],
    write: [
      { m: "upload", args: "custom", descAr: "تسجيل رفع مستند توثيق",
        schema: z.object({ id: zId, fileName: z.string().min(1) }).strict(), call: (a) => [a.id, a.fileName] },
      { m: "submit", descAr: "إرسال التوثيق للمراجعة" },
    ],
  },
  {
    ns: "settings.apiKeys", entityAr: "مفتاح API", entityEn: "api key", readPermission: "developers.manage", writePermission: "developers.manage",
    read: [{ m: "list" }],
    write: [{ m: "create", args: "input", descAr: "إنشاء مفتاح API — السر يظهر مرة" }],
    danger: [{ m: "revoke", args: "id" }],
  },
  {
    ns: "settings.webhooks", entityAr: "اشتراك webhook", entityEn: "webhook subscription", readPermission: "developers.manage", writePermission: "developers.manage",
    read: [{ m: "list" }],
    write: [
      { m: "create", args: "input" },
      { m: "resend", args: "custom", descAr: "إعادة إرسال تسليم webhook",
        schema: z.object({ id: zId, deliveryId: zId }).strict(), call: (a) => [a.id, a.deliveryId] },
    ],
  },
  {
    ns: "settings.danger", entityAr: "منطقة الخطر", entityEn: "danger zone", readPermission: SETTINGS, writePermission: SETTINGS,
    read: [{ m: "exportAll", descAr: "تصدير كل بيانات المتجر" }],
    danger: [
      { m: "suspend", descAr: "إيقاف المتجر مؤقتاً" },
      { m: "remove", descAr: "تعليق المتجر نهائياً" },
    ],
  },
  {
    ns: "themes", entityAr: "ثيم", entityEn: "theme", readPermission: "storefront.manage", writePermission: "storefront.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "update", args: "idPatch", undoable: true },
      { m: "publish", args: "custom", // handwritten themes.publish covers
        schema: z.object({ id: zId, note: z.string().default("") }).strict(), call: (a) => [a.id, a.note] },
      { m: "schedule", args: "custom", undoable: true, descAr: "جدولة نشر ثيم",
        schema: z.object({ id: zId, at: z.string().nullable().default(null) }).strict(), call: (a) => [a.id, a.at] },
      { m: "setWindow", args: "custom", undoable: true, descAr: "نافذة تفعيل مؤقتة لثيم",
        schema: z.object({ id: zId, window: zRec.nullable().default(null) }).strict(), call: (a) => [a.id, a.window] },
      { m: "applyAsDraft", args: "id", undoable: true, descAr: "تطبيق ثيم كمسودة" },
      { m: "duplicate", args: "id", descAr: "نسخ ثيم كمسودة جديدة" },
      { m: "rename", args: "custom", undoable: true,
        schema: z.object({ id: zId, name: z.string().min(1) }).strict(), call: (a) => [a.id, a.name] },
      { m: "importTheme", args: "input", descAr: "استيراد حزمة ثيم كمسودة" },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "themeShares", entityAr: "رابط معاينة ثيم", entityEn: "theme share", readPermission: "storefront.manage", writePermission: "storefront.manage",
    read: [
      { m: "list" },
      { m: "resolve", args: "custom", descAr: "حل رابط معاينة بتوكن",
        schema: z.object({ token: z.string().min(1) }).strict(), call: (a) => [a.token] },
    ],
    write: [{ m: "create", args: "id", descAr: "إنشاء رابط معاينة لثيم (id = themeId)" }],
    danger: [{ m: "revoke", args: "custom", schema: z.object({ token: z.string().min(1) }).strict(), call: (a) => [a.token], descAr: "إبطال رابط معاينة" }],
  },
  {
    ns: "pages", entityAr: "صفحة", entityEn: "page", readPermission: "storefront.manage", writePermission: "storefront.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "create", args: "input" },
      { m: "update", args: "idInput", undoable: true },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "menus", entityAr: "قائمة تنقل", entityEn: "menu", readPermission: "storefront.manage", writePermission: "storefront.manage",
    read: [{ m: "list" }],
    write: [
      { m: "update", args: "custom", undoable: true,
        schema: z.object({ id: zId, items: z.array(zRec) }).strict(), call: (a) => [a.id, a.items] },
    ],
  },
  {
    ns: "domains", entityAr: "نطاق", entityEn: "domain", readPermission: "storefront.manage", writePermission: "storefront.manage",
    read: [{ m: "list" }],
    write: [
      { m: "add", args: "custom", schema: z.object({ hostname: z.string().min(1) }).strict(), call: (a) => [a.hostname] },
      { m: "verify", args: "id", descAr: "إعادة تحقق نطاق" },
      { m: "setPrimary", args: "id", undoable: true },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "seo", entityAr: "إعدادات SEO", entityEn: "seo", readPermission: "storefront.manage", writePermission: "storefront.manage",
    read: [{ m: "get", args: "none" }, { m: "redirects", descAr: "قائمة التحويلات" }],
    write: [
      { m: "save", args: "input", undoable: true },
      { m: "addRedirect", args: "input", descAr: "إضافة تحويل مسار" },
    ],
    danger: [{ m: "removeRedirect", args: "id" }],
  },
];
