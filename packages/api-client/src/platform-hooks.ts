"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PartnerApp, Plan, SubmissionStatus, TenantStatus } from "@repo/contracts";
import { commerce } from "./commerce";

/* Platform-console (apps/super-admin) + developer-portal (apps/partners)
 * hooks — backed by `commerce.platform` / `commerce.partner`. */

const api = commerce;

export const platformKeys = {
  platform: ["platform", "summary"] as const,
  tenants: ["platform", "tenants"] as const,
  tenant: (id: string) => ["platform", "tenants", id] as const,
  tenantStaff: (id: string) => ["platform", "tenants", id, "staff"] as const,
  tenantOrders: (id: string) => ["platform", "tenants", id, "orders"] as const,
  plans: ["platform", "plans"] as const,
  plan: (id: string) => ["platform", "plans", id] as const,
  platformSubscriptions: ["platform", "platform-subscriptions"] as const,
  platformUsage: ["platform", "platform-usage"] as const,
  platformThemes: ["platform", "platform-themes"] as const,
  appSubmissions: ["platform", "app-submissions"] as const,
  appSubmission: (id: string) => ["platform", "app-submissions", id] as const,
  platformPartners: ["platform", "platform-partners"] as const,
  providers: ["platform", "providers"] as const,
  platformJobs: ["platform", "platform-jobs"] as const,
  platformAuditLogs: ["platform", "platform-audit-logs"] as const,
  featureFlags: ["platform", "feature-flags"] as const,
  platformTeam: ["platform", "platform-team"] as const,
};

export const usePlatformSummary = () => useQuery({ queryKey: platformKeys.platform, queryFn: api.platform.summary });
export const useTenants = () => useQuery({ queryKey: platformKeys.tenants, queryFn: api.platform.tenants });
export const useTenant = (id: string) =>
  useQuery({ queryKey: platformKeys.tenant(id), queryFn: () => api.platform.tenant(id) });
export function useSetTenantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TenantStatus }) => api.platform.setTenantStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformKeys.tenants }),
  });
}
export const usePlans = () => useQuery({ queryKey: platformKeys.plans, queryFn: api.platform.plans });
export const usePlan = (id: string) =>
  useQuery({ queryKey: platformKeys.plan(id), queryFn: () => api.platform.plan(id) });
export const usePlatformSubscriptions = () =>
  useQuery({ queryKey: platformKeys.platformSubscriptions, queryFn: api.platform.subscriptions });
export const usePlatformUsage = () =>
  useQuery({ queryKey: platformKeys.platformUsage, queryFn: api.platform.usage });
export const usePlatformThemes = () =>
  useQuery({ queryKey: platformKeys.platformThemes, queryFn: api.platform.themes });
export const useTenantStaff = (tenantId: string) =>
  useQuery({ queryKey: platformKeys.tenantStaff(tenantId), queryFn: () => api.platform.tenantStaff(tenantId) });
export const useTenantOrders = (tenantId: string) =>
  useQuery({ queryKey: platformKeys.tenantOrders(tenantId), queryFn: () => api.platform.tenantOrders(tenantId) });

export const useAppSubmissions = () =>
  useQuery({ queryKey: platformKeys.appSubmissions, queryFn: api.platform.appSubmissions });
export const useAppSubmission = (id: string) =>
  useQuery({ queryKey: platformKeys.appSubmission(id), queryFn: () => api.platform.appSubmission(id) });
export function useReviewApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: SubmissionStatus; reason?: string }) =>
      api.platform.reviewApp(id, status, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformKeys.appSubmissions }),
  });
}

export const usePlatformPartners = () =>
  useQuery({ queryKey: platformKeys.platformPartners, queryFn: api.platform.partners });
export const useProviders = () => useQuery({ queryKey: platformKeys.providers, queryFn: api.platform.providers });
export function useSetProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.platform.setProvider(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformKeys.providers }),
  });
}
export const usePlatformJobs = () => useQuery({ queryKey: platformKeys.platformJobs, queryFn: api.platform.jobs });
export const usePlatformAuditLogs = () =>
  useQuery({ queryKey: platformKeys.platformAuditLogs, queryFn: api.platform.auditLogs });
export const useFeatureFlags = () => useQuery({ queryKey: platformKeys.featureFlags, queryFn: api.platform.flags });
export function useSetFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.platform.setFlag(id, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformKeys.featureFlags }),
  });
}
export const usePlatformTeam = () => useQuery({ queryKey: platformKeys.platformTeam, queryFn: api.platform.team });
export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: Plan) => api.platform.savePlan(plan),
    onSuccess: () => qc.invalidateQueries({ queryKey: platformKeys.plans }),
  });
}

const partnerKeys = {
  partnerSummary: ["partner", "partner-summary"] as const,
  partnerApps: ["partner", "partner-apps"] as const,
  partnerApp: (id: string) => ["partner", "partner-apps", id] as const,
  appWebhook: (id: string) => ["partner", "partner-apps", id, "webhook"] as const,
  testStores: ["partner", "test-stores"] as const,
};

export const usePartnerSummary = () => useQuery({ queryKey: partnerKeys.partnerSummary, queryFn: api.partner.summary });
export const usePartnerApps = () => useQuery({ queryKey: partnerKeys.partnerApps, queryFn: api.partner.apps });
export const usePartnerApp = (id: string) =>
  useQuery({ queryKey: partnerKeys.partnerApp(id), queryFn: () => api.partner.app(id) });
export function useSavePartnerApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (app: PartnerApp) => api.partner.saveApp(app),
    onSuccess: () => qc.invalidateQueries({ queryKey: partnerKeys.partnerApps }),
  });
}
export const useAppWebhook = (appId: string) =>
  useQuery({ queryKey: partnerKeys.appWebhook(appId), queryFn: () => api.partner.webhook(appId) });
export function useSaveAppWebhook(appId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: { url?: string; events?: string[] }) => api.partner.saveWebhook(appId, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: partnerKeys.appWebhook(appId) });
      void qc.invalidateQueries({ queryKey: partnerKeys.partnerApp(appId) });
    },
  });
}
export const useTestStores = () => useQuery({ queryKey: partnerKeys.testStores, queryFn: api.partner.testStores });
export function useCreateTestStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.partner.createTestStore(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: partnerKeys.testStores }),
  });
}
export function useDeleteTestStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.partner.deleteTestStore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: partnerKeys.testStores }),
  });
}
