import type {
  Plan, SubmissionStatus, TenantStatus,
} from "@repo/contracts";
import { spec } from "@repo/mocks";
import { db, fail, respond } from "./db";

/* Platform-console surface (apps/super-admin + platform copilot) —
 * the namespace formerly served by `legacyApi.platform`. */
export const platformApi = {
  summary: () => respond(spec.platformSummary),
  tenants: () => respond(db.tenants),
  tenant: (id: string) => {
    const t = db.tenants.find((x) => x.id === id);
    return t ? respond(t) : fail(`Tenant ${id} not found`);
  },
  setTenantStatus: (id: string, status: TenantStatus) => {
    const t = db.tenants.find((x) => x.id === id);
    if (!t) return fail(`Tenant ${id} not found`);
    t.status = status;
    return respond(t);
  },
  plans: () => respond(db.plans),
  plan: (id: string) => {
    const p = db.plans.find((x) => x.id === id);
    return p ? respond(p) : fail(`Plan ${id} not found`);
  },
  savePlan: (plan: Plan) => {
    const index = db.plans.findIndex((p) => p.id === plan.id);
    if (index >= 0) db.plans[index] = plan;
    return respond(plan);
  },
  subscriptions: () => respond(spec.storeSubscriptions),
  usage: () => respond(spec.storeUsage),
  tenantStaff: (tenantId: string) => respond(spec.staffByTenant[tenantId] ?? []),
  tenantOrders: (tenantId: string) => respond(spec.ordersByTenant[tenantId] ?? []),
  themes: () => respond(db.themes),
  appSubmissions: () => respond(db.appSubmissions),
  appSubmission: (id: string) => {
    const s = db.appSubmissions.find((x) => x.id === id);
    return s ? respond(s) : fail(`App submission ${id} not found`);
  },
  reviewApp: (id: string, status: SubmissionStatus, reason?: string) => {
    const s = db.appSubmissions.find((x) => x.id === id);
    if (!s) return fail(`App submission ${id} not found`);
    s.status = status;
    s.rejectionReason = status === "rejected" ? (reason ?? "other") : null;
    return respond(s);
  },
  partners: () => respond(spec.platformPartners),
  providers: () => respond(db.providers),
  setProvider: (id: string, enabled: boolean) => {
    const p = db.providers.find((x) => x.id === id);
    if (!p) return fail(`Provider ${id} not found`);
    p.enabled = enabled;
    return respond(p);
  },
  jobs: () => respond(spec.platformJobs),
  auditLogs: () => respond(spec.platformAuditLogs),
  flags: () => respond(db.flags),
  setFlag: (id: string, enabled: boolean) => {
    const f = db.flags.find((x) => x.id === id);
    if (!f) return fail(`Feature flag ${id} not found`);
    f.enabled = enabled;
    return respond(f);
  },
  team: () => respond(spec.platformTeam),
};
