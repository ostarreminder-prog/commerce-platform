import { z } from "zod";
import { idFlag, idsWith, zId, type GenNsSpec } from "./spec-helpers";

/* Growth domain: customers + abandoned carts + notifications +
 * back-in-stock + coupons/promotions + copilot's own namespaces
 * (analytics, audit, tasks, settings, conversations). */

export const GROWTH_SPEC: GenNsSpec[] = [
  {
    ns: "customers", entityAr: "عميل", entityEn: "customer", readPermission: "customers.read", writePermission: "customers.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "create", args: "input" },
      { m: "addAddress", args: "idInput" },
      { m: "update", args: "idPatch", undoable: true },
      { m: "addTag", ...idsWith("tag"), descAr: "وسم عملاء" },
    ],
    danger: [{ m: "remove", args: "id", descAr: "مسح بيانات عميل (خصوصية)" }],
  },
  {
    ns: "abandonedCarts", entityAr: "سلة متروكة", entityEn: "abandoned cart", readPermission: "marketing.manage", writePermission: "marketing.manage",
    read: [{ m: "list" }, { m: "settings", descAr: "إعدادات استرجاع السلات" }, { m: "get", args: "id" }],
    write: [
      { m: "saveSettings", args: "input", undoable: true },
      { m: "sendRecovery", args: "id", descAr: "إرسال رسالة استرجاع لسلة" },
    ],
  },
  {
    ns: "notifications", entityAr: "تنبيه", entityEn: "notification",
    read: [{ m: "list" }],
    write: [{ m: "markRead", args: "idOpt", descAr: "تعليم تنبيه كمقروء (الكل بلا id)" }],
  },
  {
    ns: "backInStock", entityAr: "طلب إشعار توفر", entityEn: "back-in-stock subscription", readPermission: "products.read", writePermission: "products.manage",
    read: [{ m: "list" }],
    write: [{ m: "subscribe", args: "custom", schema: z.object({ productId: zId, phone: z.string().min(1) }).strict(), call: (a) => [a.productId, a.phone] }],
  },
  {
    ns: "coupons", entityAr: "كوبون", entityEn: "coupon", readPermission: "marketing.manage", writePermission: "marketing.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "save", name: "create", args: "input", descAr: "إنشاء/تحديث كوبون" },
      { m: "setStatus", args: "custom", undoable: true, descAr: "تفعيل/تعطيل كوبون",
        schema: z.object({ id: zId, disabled: z.boolean().default(true) }).strict(), call: (a) => [a.id, a.disabled] },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "promotions", entityAr: "عرض ترويجي", entityEn: "promotion", readPermission: "marketing.manage", writePermission: "marketing.manage",
    read: [{ m: "list" }],
    write: [
      { m: "save", name: "create", args: "input", descAr: "إنشاء/تحديث عرض ترويجي" },
      { m: "setStatus", args: "custom", undoable: true, descAr: "تفعيل/تعطيل عرض",
        schema: z.object({ id: zId, disabled: z.boolean().default(true) }).strict(), call: (a) => [a.id, a.disabled] },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  /* ---- copilot's own namespaces (analytics/audit/tasks/settings/convs) */
  {
    ns: "analytics", entityAr: "تحليلات", entityEn: "analytics", readPermission: "reports.read",
    read: [{ m: "home", descAr: "بيانات لوحة التقارير الرئيسية" }], // handwritten analytics.home covers
  },
  {
    ns: "audit", entityAr: "سجل تدقيق", entityEn: "audit entry", readPermission: "audit.read",
    read: [{ m: "list" }],
    write: [{ m: "log", skip: "داخلي — executor يسجل تدقيق تنفيذ الأدوات تلقائياً" }],
  },
  {
    ns: "copilotTasks", entityAr: "مهمة مساعد", entityEn: "copilot task",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "create", args: "input" }, // handwritten copilotTasks.create covers
      { m: "update", args: "idPatch", undoable: true },
      { m: "runNow", args: "id" }, // handwritten copilotTasks.runNow covers
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "copilotSettings", entityAr: "إعدادات المساعد", entityEn: "copilot settings",
    read: [{ m: "get", args: "none" }],
    write: [{ m: "save", args: "input", undoable: true }],
  },
  {
    ns: "copilotConversations", entityAr: "محادثة مساعد", entityEn: "copilot conversation",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "save", args: "input" },
      { m: "pin", ...idFlag("pinned"), undoable: true },
      { m: "share", ...idFlag("shared"), undoable: true },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
];
