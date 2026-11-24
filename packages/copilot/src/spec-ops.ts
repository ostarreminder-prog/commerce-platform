import { z } from "zod";
import { idFlag, idsWith, zId, zRec, type GenNsSpec } from "./spec-helpers";

/* Operations domain: orders + shipments/invoices/returns + inbox
 * (conversations, approvals, knowledge) + reviews + marketplace apps. */

export const OPS_SPEC: GenNsSpec[] = [
  {
    ns: "orders", entityAr: "طلب", entityEn: "order", readPermission: "orders.read", writePermission: "orders.manage",
    read: [
      { m: "list" }, { m: "get", args: "id" },
      { m: "payments", args: "id", descAr: "مدفوعات طلب" },
      { m: "refunds", args: "id", descAr: "مستردات طلب" },
    ],
    write: [
      { m: "addNote", args: "idText", descAr: "إضافة ملاحظة داخلية لطلب" },
      { m: "fulfill", args: "id", descAr: "بدء تجهيز طلب" },
      { m: "createShipment", args: "idInput", descAr: "إنشاء شحنة لطلب" },
      { m: "setFulfillment", ...idsWith("to", z.enum(["unfulfilled", "processing", "shipped", "delivered", "returned", "cancelled"])), undoable: true, descAr: "تحديث حالة تجهيز طلبات" },
      { m: "addTag", ...idsWith("tag"), descAr: "وسم طلبات" },
      { m: "updateAddress", args: "idPatch", undoable: true, descAr: "تعديل عنوان شحن طلب" },
      { m: "sendPaymentLink", args: "id", descAr: "إرسال رابط دفع لطلب" },
      { m: "create", args: "input", descAr: "إنشاء طلب يدوي" },
    ],
    danger: [
      { m: "cancel", args: "idInput", descAr: "إلغاء طلب" },
      { m: "refund", args: "idInput", permission: "orders.refund", descAr: "استرداد مبلغ طلب" },
    ],
  },
  {
    ns: "shipments", entityAr: "شحنة", entityEn: "shipment", readPermission: "shipments.manage", writePermission: "shipments.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "setStatus", args: "custom", undoable: true,
        schema: z.object({ id: zId, status: z.enum(["label_created", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed_attempt", "returned", "cancelled"]) }).strict(),
        call: (a) => [a.id, { status: a.status }] },
    ],
  },
  {
    ns: "invoices", entityAr: "فاتورة", entityEn: "invoice", readPermission: "invoices.read", writePermission: "invoices.read",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [{ m: "resend", args: "id", descAr: "إعادة إرسال فاتورة مرفوضة لزاتكا" }],
  },
  {
    ns: "returns", entityAr: "مرتجع", entityEn: "return", readPermission: "returns.manage", writePermission: "returns.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "setStatus", args: "custom", undoable: true,
        schema: z.object({ id: zId, status: z.enum(["requested", "approved", "rejected", "in_transit", "received", "refunded", "closed"]), extra: zRec.optional() }).strict(),
        call: (a) => [a.id, a.status, a.extra ?? {}] },
      { m: "approve", args: "idInput", descAr: "اعتماد مرتجع (قرار + مبلغ + شحنة إرجاع)" },
    ],
    danger: [{ m: "refund", args: "id", descAr: "تنفيذ استرداد مرتجع وإصدار إشعار دائن" }],
  },
  {
    ns: "conversations", entityAr: "محادثة", entityEn: "conversation", readPermission: "conversations.read", writePermission: "conversations.reply",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "sendMessage", args: "idInput", descAr: "إرسال رسالة في محادثة" },
      { m: "takeOver", args: "id", descAr: "استلام محادثة من الوكيل" },
      { m: "returnToAgent", args: "id", descAr: "إرجاع محادثة للوكيل" },
      { m: "setStatus", args: "custom", undoable: true,
        schema: z.object({ id: zId, status: z.enum(["resolved", "closed"]) }).strict(), call: (a) => [a.id, a.status] },
      { m: "assign", args: "custom", undoable: true, descAr: "إسناد محادثة لموظف",
        schema: z.object({ id: zId, staffId: z.string().nullable().default(null) }).strict(), call: (a) => [a.id, a.staffId] },
      { m: "setPriority", args: "custom", undoable: true,
        schema: z.object({ id: zId, priority: z.enum(["low", "normal", "high", "urgent"]) }).strict(), call: (a) => [a.id, a.priority] },
      { m: "addTag", args: "custom", schema: z.object({ id: zId, tag: z.string().min(1) }).strict(), call: (a) => [a.id, a.tag] },
    ],
  },
  {
    ns: "approvals", entityAr: "طلب اعتماد", entityEn: "agent approval", readPermission: "approvals.decide", writePermission: "approvals.decide",
    read: [{ m: "list" }],
    write: [
      { m: "decide", args: "custom", descAr: "اعتماد/رفض إجراء وكيل",
        schema: z.object({ id: zId, decision: z.enum(["approved", "rejected"]), reason: z.string().optional() }).strict(),
        call: (a) => [a.id, a.decision, a.reason] },
    ],
  },
  {
    ns: "knowledge", entityAr: "مصدر معرفة", entityEn: "knowledge source", readPermission: "agents.read", writePermission: "knowledge.manage",
    read: [
      { m: "list" }, { m: "get", args: "id" },
      { m: "testQuery", args: "custom", permission: "agents.read", descAr: "اختبار استرجاع سؤال من مصدر",
        schema: z.object({ id: zId, question: z.string().min(1) }).strict(), call: (a) => [a.id, a.question] },
    ],
    write: [
      { m: "create", args: "input" },
      { m: "linkAgent", args: "custom", undoable: true, descAr: "ربط مصدر معرفة بوكيل",
        schema: z.object({ id: zId, agentId: zId }).strict(), call: (a) => [a.id, a.agentId] },
      { m: "unlinkAgent", args: "custom", undoable: true,
        schema: z.object({ id: zId, agentId: zId }).strict(), call: (a) => [a.id, a.agentId] },
      { m: "setAutoSync", ...idFlag("on"), undoable: true },
      { m: "sync", args: "id", descAr: "مزامنة مصدر معرفة" },
    ],
    danger: [{ m: "remove", args: "id" }],
  },
  {
    ns: "reviews", entityAr: "تقييم", entityEn: "review", readPermission: "products.read", writePermission: "products.manage",
    read: [
      { m: "listAll", name: "list", descAr: "كل التقييمات" },
      { m: "listByProduct", args: "id", descAr: "تقييمات منتج" },
    ],
    write: [
      { m: "create", args: "input" },
      { m: "setStatus", args: "custom", undoable: true,
        schema: z.object({ id: zId, status: z.enum(["pending", "approved", "hidden"]) }).strict(), call: (a) => [a.id, a.status] },
      { m: "reply", args: "idText", descAr: "رد التاجر على تقييم" },
    ],
  },
  {
    ns: "apps", entityAr: "تطبيق", entityEn: "app", readPermission: "apps.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
  },
  {
    ns: "appInstallations", entityAr: "تطبيق مثبت", entityEn: "app installation", readPermission: "apps.manage", writePermission: "apps.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [{ m: "install", args: "id", descAr: "تثبيت تطبيق (id = appId)" }],
    danger: [{ m: "uninstall", args: "id" }],
  },
];
