import { z } from "zod";
import { idFlag, zId, type GenNsSpec } from "./spec-helpers";

/* Agents (studio) + platform (super-admin) + the excluded partner ns. */

export const AGENTS_PLATFORM_SPEC: GenNsSpec[] = [
  {
    ns: "agents", entityAr: "وكيل", entityEn: "agent", readPermission: "agents.read", writePermission: "agents.manage",
    read: [{ m: "list" }, { m: "get", args: "id" }],
    write: [
      { m: "create", args: "custom", // handwritten agents.create covers
        schema: z.object({ name: z.string().min(1), parentId: z.string().nullable().default(null) }).strict(), call: (a) => [a.parentId, a.name] },
      { m: "save", args: "input", undoable: true, descAr: "حفظ وكيل كاملاً" },
      { m: "setStatus", args: "custom", undoable: true,
        schema: z.object({ id: zId, status: z.enum(["draft", "live", "paused"]), branch: z.boolean().default(false) }).strict(),
        call: (a) => [a.id, a.status, a.branch] },
      { m: "publish", args: "custom", descAr: "نشر إصدار وكيل",
        schema: z.object({ id: zId, note: z.string().default("copilot") }).strict(), call: (a) => [a.id, a.note] },
    ],
  },
  {
    ns: "platform", resolve: (api) => api.platform, entityAr: "المنصة", entityEn: "platform",
    readPermission: "platform.read", writePermission: "platform.tenants.manage",
    read: [
      { m: "summary" }, // handwritten platform.summary covers
      { m: "tenants" }, // handwritten platform.tenants covers
      { m: "tenant", args: "id", descAr: "قراءة متجر مشترك" },
      { m: "plans" }, // handwritten platform.plans covers
      { m: "plan", args: "id" },
      { m: "subscriptions" }, // handwritten platform.subscriptions covers
      { m: "usage" }, // handwritten platform.usage covers
      { m: "tenantStaff", args: "id", descAr: "موظفو متجر مشترك" },
      { m: "tenantOrders", args: "id", descAr: "طلبات متجر مشترك" },
      { m: "themes", descAr: "ثيمات المتاجر على المنصة" },
      { m: "appSubmissions", descAr: "طلبات نشر التطبيقات" },
      { m: "appSubmission", args: "id" },
      { m: "partners" },
      { m: "providers" },
      { m: "jobs" }, // handwritten platform.jobs covers
      { m: "auditLogs" },
      { m: "flags", descAr: "أعلام الميزات" },
      { m: "team", descAr: "فريق المنصة" },
    ],
    write: [
      { m: "savePlan", args: "input", undoable: true },
      { m: "reviewApp", args: "custom", descAr: "اعتماد/رفض تطبيق مرسل",
        schema: z.object({ id: zId, status: z.enum(["pending", "approved", "rejected"]), reason: z.string().optional() }).strict(),
        call: (a) => [a.id, a.status, a.reason] },
      { m: "setProvider", ...idFlag("enabled"), undoable: true },
      { m: "setFlag", ...idFlag("enabled"), undoable: true },
    ],
    danger: [
      { m: "setTenantStatus", args: "custom", permission: "platform.tenants.manage", descAr: "تغيير حالة متجر مشترك",
        schema: z.object({ id: zId, status: z.enum(["active", "trial", "suspended"]) }).strict(), call: (a) => [a.id, a.status] },
    ],
  },
  {
    ns: "partner", entityAr: "بوابة المطورين", entityEn: "developer portal",
    skipNs: "سطح بوابة المطورين — تطبيق partners بلا copilot ولا سياق تاجر",
    skipOps: ["summary", "apps", "app", "saveApp", "webhook", "saveWebhook", "testStores", "createTestStore", "deleteTestStore"],
  },
];
