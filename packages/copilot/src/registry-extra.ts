import { z } from "zod";
import type { Agent, Coupon, Product } from "@repo/contracts";
import type { CopilotTool, ToolArgs } from "./types";
import { MAX_BULK, assertBulk, chunk } from "./guards";

/* Hand-written merchant tools — multi-step api calls the CRUD generator
 * can't express (loops, derived ids, composite updates, UI stubs). */

const idsSchema = z.object({ ids: z.array(z.string().min(1)).min(1) }).strict();

export const EXTRA_TOOLS: CopilotTool[] = [
  {
    name: "products.setStatus",
    descriptionAr: "تغيير حالة منتجات (مسودة/نشط/مؤرشف)",
    descriptionEn: "bulk-set product status",
    schema: idsSchema.extend({ status: z.enum(["draft", "active", "archived"]) }),
    kind: "write", undoable: true, permission: "products.manage",
    handler: async (args: ToolArgs, ctx) => {
      const ids = assertBulk(args.ids as string[]);
      for (const part of chunk(ids, MAX_BULK)) await ctx.api.products.setStatus(part, args.status as "draft" | "active" | "archived");
      return { updated: ids.length };
    },
  },
  {
    name: "products.adjustPrices",
    descriptionAr: "تعديل أسعار منتجات بنسبة أو مبلغ ثابت",
    descriptionEn: "bulk price adjustment (percent | fixed)",
    schema: idsSchema.extend({ mode: z.enum(["percent", "fixed"]), value: z.number() }),
    kind: "write", undoable: true, permission: "products.manage",
    handler: async (args, ctx) => {
      const ids = assertBulk(args.ids as string[]);
      for (const part of chunk(ids, MAX_BULK)) await ctx.api.products.adjustPrices(part, args.mode as "percent" | "fixed", args.value as number);
      return { updated: ids.length };
    },
  },
  {
    name: "products.deleteArchived",
    descriptionAr: "حذف كل المنتجات المؤرشفة نهائياً",
    descriptionEn: "permanently delete every archived product",
    schema: z.object({}).strict(),
    kind: "dangerous", undoable: false, permission: "products.manage",
    handler: async (_args, ctx) => {
      const archived = (await ctx.api.products.list()).filter((p: Product) => p.status === "archived").map((p) => p.id);
      for (const part of chunk(archived, MAX_BULK)) await ctx.api.products.remove(part);
      return { deleted: archived.length, ids: archived };
    },
  },
  {
    name: "orders.bulkCancel",
    descriptionAr: "إلغاء مجموعة طلبات دفعة واحدة",
    descriptionEn: "cancel many orders (loops orders.cancel)",
    schema: idsSchema.extend({ reason: z.string().default("إلغاء جماعي من المساعد") }),
    kind: "dangerous", undoable: false, permission: "orders.manage",
    handler: async (args, ctx) => {
      const ids = assertBulk(args.ids as string[]);
      const done: string[] = [];
      const failed: { id: string; error: string }[] = [];
      for (const id of ids) {
        try {
          await ctx.api.orders.cancel(id, { code: "other", text: args.reason as string, refund: false, restock: true, notify: true });
          done.push(id);
        } catch (e) {
          failed.push({ id, error: (e as Error).message });
        }
      }
      return { cancelled: done.length, failed };
    },
  },
  {
    name: "themes.publish",
    descriptionAr: "نشر ثيم",
    descriptionEn: "publish a theme",
    schema: z.object({ id: z.string().min(1), note: z.string().optional() }).strict(),
    kind: "write", undoable: true, permission: "storefront.manage",
    handler: (args, ctx) => ctx.api.themes.publish(args.id as string, (args.note as string) ?? "copilot"),
  },
  {
    name: "themes.applyPreset",
    descriptionAr: "تطبيق preset موسمي على الثيم المنشور ونشره",
    descriptionEn: "apply a named preset to the live theme and publish",
    schema: z.object({ query: z.string().min(1) }).strict(),
    kind: "write", undoable: true, permission: "storefront.manage",
    handler: async (args, ctx) => {
      const q = (args.query as string).trim();
      const themes = await ctx.api.themes.list();
      const live = themes.find((t) => t.status === "published") ?? themes[0];
      if (!live) throw new Error("no_theme");
      const preset = (live.presets ?? []).find((p) => p.nameAr.includes(q) || p.nameEn.toLowerCase().includes(q.toLowerCase()) || p.id.includes(q));
      if (!preset) throw new Error(`preset_not_found:${q}`);
      await ctx.api.themes.update(live.id, { globals: { ...live.globals, ...preset.globals } });
      const published = await ctx.api.themes.publish(live.id, `apply_preset:${preset.id}`);
      return { themeId: live.id, presetId: preset.id, status: published.status };
    },
  },
  {
    name: "staff.invite",
    descriptionAr: "دعوة موظف جديد بدور محدد",
    descriptionEn: "invite a staff member with a role",
    schema: z.object({ name: z.string().min(1), email: z.string().email(), roleId: z.string().min(1) }).strict(),
    kind: "write", undoable: false, permission: "staff.manage",
    handler: (args, ctx) => ctx.api.staff.invite({ name: args.name as string, email: args.email as string, roleId: args.roleId as string }),
  },
  {
    name: "agents.create",
    descriptionAr: "إنشاء وكيل فرعي مسودة تحت الوكيل الرئيسي",
    descriptionEn: "create a draft sub-agent under the orchestrator",
    schema: z.object({ name: z.string().min(1), parentId: z.string().optional() }).strict(),
    kind: "write", undoable: false, permission: "agents.manage",
    handler: async (args, ctx) => {
      const parentId = (args.parentId as string | undefined) ?? (await ctx.api.agents.list()).find((a: Agent) => a.parentId === null)?.id ?? null;
      return ctx.api.agents.create(parentId, args.name as string);
    },
  },
  {
    name: "agents.updateGreeting",
    descriptionAr: "تحديث رسالة الترحيب لوكيل",
    descriptionEn: "update an agent greeting message",
    schema: z.object({ greeting: z.string().min(1), agentId: z.string().optional() }).strict(),
    kind: "write", undoable: true, permission: "agents.manage",
    handler: async (args, ctx) => {
      const agentId = (args.agentId as string | undefined) ?? (await ctx.api.agents.list()).find((a: Agent) => a.parentId === null)?.id;
      if (!agentId) throw new Error("no_agent");
      const agent = await ctx.api.agents.get(agentId);
      return ctx.api.agents.save({ ...agent, persona: { ...agent.persona, greeting: args.greeting as string } });
    },
  },
  {
    name: "marketing.whatsappCampaign",
    descriptionAr: "إرسال حملة واتساب لشريحة عملاء (محاكاة)",
    descriptionEn: "queue a WhatsApp campaign to a customer segment (stub)",
    schema: z.object({ segment: z.string().min(1), message: z.string().min(1), recipients: z.number().int().nonnegative().default(0) }).strict(),
    kind: "write", undoable: false, permission: "marketing.manage",
    handler: async (args) => ({ queued: true, channel: "whatsapp", segment: args.segment, recipients: args.recipients, sentAt: new Date().toISOString() }),
  },
  {
    name: "approvals.request",
    descriptionAr: "إرسال طلب موافقة لصفحة الموافقات (استرداد/خصم/إلغاء)",
    descriptionEn: "file a pending approval request (refund/discount/cancel)",
    schema: z
      .object({
        action: z.enum(["cancel_order", "refund", "discount_above_limit"]),
        orderId: z.string().min(1),
        amount: z.number().positive().optional(),
        reason: z.string().min(1),
      })
      .strict(),
    kind: "write", undoable: false, permission: "approvals.decide",
    handler: (args, ctx) =>
      ctx.api.approvals.request({
        agentId: "copilot",
        conversationId: ctx.conversationId ?? null,
        action: args.action as "cancel_order" | "refund" | "discount_above_limit",
        target: { type: "order", id: args.orderId as string, label: args.orderId as string },
        amount: args.amount != null ? { amount: args.amount as number, currency: "SAR" } : null,
        reason: args.reason as string,
      }),
  },
  {
    name: "copilotTasks.create",
    descriptionAr: "إنشاء مهمة مجدولة أو تنبيه للمساعد",
    descriptionEn: "create a scheduled task or alert for the copilot",
    schema: z
      .object({
        input: z.object({
          kind: z.enum(["scheduled", "alert"]),
          title: z.string().min(1),
          prompt: z.string().min(1),
          schedule: z.object({ hour: z.number().int().min(0).max(23), minute: z.number().int().min(0).max(59).optional() }),
          threshold: z.number().optional(),
          enabled: z.boolean().default(true),
        }),
      })
      .strict(),
    kind: "write", undoable: true,
    handler: (args, ctx) => {
      const input = args.input as { kind: "scheduled" | "alert"; title: string; prompt: string; schedule: { hour: number; minute?: number }; threshold?: number; enabled: boolean };
      return ctx.api.copilotTasks.create({ ...input, storeId: ctx.storeId });
    },
  },
  {
    name: "copilotTasks.runNow",
    descriptionAr: "تشغيل مهمة مجدولة فوراً (محاكاة)",
    descriptionEn: "run a scheduled copilot task now (stub)",
    schema: z.object({ id: z.string().min(1) }).strict(),
    kind: "write", undoable: false,
    handler: (args, ctx) => ctx.api.copilotTasks.runNow(args.id as string),
  },
  {
    name: "analytics.home",
    descriptionAr: "بيانات لوحة التقارير الرئيسية",
    descriptionEn: "home analytics / reports data",
    schema: z.object({}).strict(),
    kind: "read", undoable: false, permission: "reports.read",
    handler: (args, ctx) => ctx.api.analytics.home(),
  },
  {
    name: "developers.createWebhook",
    descriptionAr: "إنشاء webhook جديد — يتطلب confirm=true",
    descriptionEn: "create a webhook — requires an explicit confirm flag",
    schema: z.object({ url: z.string().url(), events: z.array(z.string()).min(1), confirm: z.literal(true) }).strict(),
    kind: "dangerous", undoable: false, permission: "developers.manage",
    handler: async (args) => ({ created: true, url: args.url, events: args.events }),
  },
  /* ---- UI stub tools — the app shell implements UiActions ---- */
  {
    name: "ui.navigate",
    descriptionAr: "التنقل لشاشة داخل اللوحة",
    descriptionEn: "navigate to an app route",
    schema: z.object({ route: z.string().min(1) }).strict(),
    kind: "read", undoable: false,
    handler: async (args, ctx) => (ctx.ui.navigate(args.route as string), { navigated: args.route }),
  },
  {
    name: "ui.highlight",
    descriptionAr: "تسليط الضوء على عنصر في الشاشة",
    descriptionEn: "highlight a DOM selector",
    schema: z.object({ selector: z.string().min(1) }).strict(),
    kind: "read", undoable: false,
    handler: async (args, ctx) => (ctx.ui.highlight(args.selector as string), { highlighted: args.selector }),
  },
  {
    name: "ui.openDialog",
    descriptionAr: "فتح نافذة حوارية",
    descriptionEn: "open a named dialog",
    schema: z.object({ name: z.string().min(1) }).strict(),
    kind: "read", undoable: false,
    handler: async (args, ctx) => (ctx.ui.openDialog(args.name as string), { opened: args.name }),
  },
  {
    name: "ui.fillForm",
    descriptionAr: "تعبئة نموذج بقيم",
    descriptionEn: "fill a form with values",
    schema: z.object({ formId: z.string().min(1), values: z.record(z.string(), z.unknown()) }).strict(),
    kind: "read", undoable: false,
    handler: async (args, ctx) => (ctx.ui.fillForm(args.formId as string, args.values as Record<string, unknown>), { filled: args.formId }),
  },
];

/** Coupons save input helper shared by plan steps. */
export const couponInput = (code: string, percent: number, eligibility: Coupon["customerEligibility"], endsAt: string | null = null) => ({
  code, type: "percentage" as const, value: percent, maxDiscount: null, minOrderAmount: null,
  appliesTo: { type: "all" as const, ids: [] }, excludeSaleItems: false, usageLimit: null,
  usageLimitPerCustomer: 1, customerEligibility: eligibility, startsAt: new Date().toISOString(), endsAt,
});
