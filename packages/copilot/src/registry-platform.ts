import { z } from "zod";
import type { CopilotContext, CopilotTool, PlatformApi } from "./types";
import { assertBulk } from "./guards";

/* Platform tools — run only when ctx.actor === "platform" and a
 * ctx.api.platform surface (commerce.platform) is injected. */

const needPlatform = (ctx: CopilotContext): PlatformApi => {
  if (!ctx.api.platform) throw new Error("platform_api_missing");
  return ctx.api.platform;
};

const empty = z.object({}).strict();

/* Platform tools carry `platform.*` permissions (PLATFORM_PERMISSIONS in
 * contracts) so `canUse` filters them against the platform actor's role. */
export const PLATFORM_TOOLS: CopilotTool[] = [
  {
    name: "platform.summary",
    descriptionAr: "ملخص المنصة (MRR، المتاجر، GMV)",
    descriptionEn: "platform summary (MRR, tenants, GMV)",
    schema: empty, kind: "read", undoable: false, permission: "platform.read",
    handler: (_args, ctx) => needPlatform(ctx).summary(),
  },
  {
    name: "platform.tenants",
    descriptionAr: "قائمة المتاجر المشتركة",
    descriptionEn: "list platform tenants",
    schema: empty, kind: "read", undoable: false, permission: "platform.read",
    handler: (_args, ctx) => needPlatform(ctx).tenants(),
  },
  {
    name: "platform.usage",
    descriptionAr: "استهلاك الذكاء الاصطناعي لكل متجر",
    descriptionEn: "per-store AI usage counters",
    schema: empty, kind: "read", undoable: false, permission: "platform.read",
    handler: (_args, ctx) => needPlatform(ctx).usage(),
  },
  {
    name: "platform.plans",
    descriptionAr: "قائمة الباقات",
    descriptionEn: "list plans",
    schema: empty, kind: "read", undoable: false, permission: "platform.read",
    handler: (_args, ctx) => needPlatform(ctx).plans(),
  },
  {
    name: "platform.jobs",
    descriptionAr: "حالة المهام الخلفية",
    descriptionEn: "background job statuses",
    schema: empty, kind: "read", undoable: false, permission: "platform.read",
    handler: (_args, ctx) => needPlatform(ctx).jobs(),
  },
  {
    name: "platform.subscriptions",
    descriptionAr: "اشتراكات المتاجر",
    descriptionEn: "store subscriptions",
    schema: empty, kind: "read", undoable: false, permission: "platform.read",
    handler: (_args, ctx) => needPlatform(ctx).subscriptions(),
  },
  {
    name: "platform.retryJobs",
    descriptionAr: "إعادة تشغيل المهام الفاشلة (محاكاة)",
    descriptionEn: "retry failed background jobs (stub)",
    schema: z.object({ ids: z.array(z.string().min(1)).min(1) }).strict(),
    kind: "write", undoable: false, permission: "platform.jobs.manage",
    handler: async (args, ctx) => {
      const ids = assertBulk(args.ids as string[]);
      const jobs = await needPlatform(ctx).jobs();
      const retried = ids.filter((id) => jobs.some((j) => j.id === id && j.status === "failed"));
      return { queued: retried.length, ids: retried };
    },
  },
  {
    name: "platform.suspendStore",
    descriptionAr: "إيقاف متجر مشترك — إجراء خطير",
    descriptionEn: "suspend a tenant store — dangerous",
    schema: z.object({ tenantId: z.string().min(1) }).strict(),
    kind: "dangerous", undoable: true, permission: "platform.tenants.manage",
    handler: (args, ctx) => needPlatform(ctx).setTenantStatus(args.tenantId as string, "suspended"),
  },
];
