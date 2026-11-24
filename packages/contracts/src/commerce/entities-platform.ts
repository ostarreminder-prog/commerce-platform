import type { ActorRef, EntityRef, Halalas, ISODate, LocalizedText, Money } from "../common";
import type { StaffStatus } from "./entities-store";

/* 4.22 Subscription / AuditLog */
export interface Subscription {
  planId: string;
  status: "trialing" | "active" | "past_due" | "cancelled";
  currentPeriodEnd: ISODate;
  usage: { metric: string; used: number; limit: number }[];
  addons: { id: string; name: LocalizedText; price: Money }[];
  invoices: { id: string; number: string; amount: Money; issuedAt: ISODate; status: "paid" | "due" }[];
}

export interface AuditLog {
  id: string;
  actor: ActorRef;
  action: string;
  target: EntityRef | null;
  changes: { field: string; from: string | null; to: string | null }[];
  ip: string | null;
  at: ISODate;
  /** Set when the entry originated inside a copilot chat — links back to /copilot?c=<id>. */
  conversationId?: string;
}

/* 4.23 Copilot — scheduled tasks, guard settings, saved conversations */
export type CopilotTaskKind = "scheduled" | "alert";

/** Cron-ish daily schedule — hour (0-23) + optional minute. */
export interface CopilotTaskSchedule {
  hour: number;
  minute?: number;
}

export interface CopilotTask {
  id: string;
  storeId: string;
  kind: CopilotTaskKind;
  title: string;
  /** The original natural-language request the task replays. */
  prompt: string;
  schedule: CopilotTaskSchedule;
  /** Alert tasks only — threshold parsed from the prompt (e.g. stock below 5). */
  threshold?: number;
  enabled: boolean;
  createdAt: ISODate;
  lastRunAt: ISODate | null;
}

export interface CopilotSettings {
  /** Tool categories that still demand a confirmation card before running. */
  alwaysConfirm: { write: boolean; dangerous: boolean; bulk: boolean };
  /** Write/dangerous tool names the copilot may never invoke for this store. */
  blockedTools: string[];
  language: "ar" | "en";
  dialect: "gulf" | "fusha";
}

/** Serializable chat message — `response` stays opaque so contracts doesn't depend on @repo/copilot. */
export interface CopilotStoredMessage {
  id: string;
  role: "user" | "assistant";
  text?: string;
  response?: unknown;
  refs?: EntityRef[];
  createdAt: ISODate;
}

export interface CopilotConversation {
  id: string;
  storeId: string;
  title: string;
  messages: CopilotStoredMessage[];
  pinned: boolean;
  /** Shared conversations open read-only for staff other than the owner. */
  shared: boolean;
  ownerId: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Analytics aggregates (merchant home + reports + platform overview)   */
/* ------------------------------------------------------------------ */

export type AgentKind = "sales" | "support" | "marketing" | "inventory";

export interface SalesPoint {
  date: ISODate;
  revenue: Halalas;
  orders: number;
}

/** Merchant dashboard KPIs — `analytics.home` payload (was `useDashboard`). */
export interface DashboardSummary {
  revenue: Halalas;
  revenueDelta: number;
  orders: number;
  ordersDelta: number;
  averageOrderValue: Halalas;
  aovDelta: number;
  conversionRate: number;
  conversionDelta: number;
  salesSeries: SalesPoint[];
  agentActivity: { conversations: number; resolvedRate: number; recoveredCarts: number; revenue: Halalas };
}

/** `commerce.analytics.home()` response — KPIs + storefront-side extras. */
export interface HomeAnalytics extends DashboardSummary {
  visitors: { today: number; yesterday: number };
  setup: { products: boolean; payments: boolean; shipping: boolean; whatsapp: boolean; domain: boolean; published: boolean };
}

/* ------------------------------------------------------------------ */
/* Platform console (apps/super-admin) — docs/SCREENS_SPEC.md §2        */
/* ------------------------------------------------------------------ */

export type PlanId = "starter" | "growth" | "pro";
export type TenantStatus = "active" | "trial" | "suspended";

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  ownerName: string;
  ownerEmail: string;
  city: string;
  plan: PlanId;
  status: TenantStatus;
  gmv: Halalas;
  orders: number;
  aiConversations: number;
  createdAt: ISODate;
  hue: number;
}

export interface Plan {
  id: PlanId;
  name: LocalizedText;
  monthlyPrice: Halalas;
  aiConversations: number;
  staffSeats: number;
  transactionFee: number;
  features: LocalizedText[];
  tenants: number;
}

export interface PlatformSummary {
  mrr: Halalas;
  mrrDelta: number;
  tenants: number;
  tenantsDelta: number;
  gmv: Halalas;
  gmvDelta: number;
  aiConversations: number;
  aiDelta: number;
  series: { date: ISODate; mrr: Halalas; signups: number }[];
  aiByKind: Record<AgentKind, Halalas>;
  aiCost: Halalas;
  services: { name: string; status: "operational" | "degraded"; latencyMs: number; uptime: number }[];
}

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "cancelled";

/** Per-store billing row for `/subscriptions`. */
export interface StoreSubscription {
  id: string;
  tenantId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  mrr: Halalas;
  currentPeriodEnd: ISODate;
  startedAt: ISODate;
}

/** AI usage counters per store for `/usage`. */
export interface StoreUsage {
  tenantId: string;
  aiMessages: number;
  aiTokens: number;
  apiCalls: number;
}

/** App-review queue status (`/apps-review`) — distinct from product `ReviewStatus`. */
export type SubmissionStatus = "pending" | "approved" | "rejected";

/** Partner app waiting in the `/apps-review` queue (spec §4.21 App). */
export interface AppSubmission {
  id: string;
  name: LocalizedText;
  tagline: LocalizedText;
  description: LocalizedText;
  developer: string;
  developerEmail: string;
  category: PartnerAppCategory;
  scopes: string[];
  monthlyPrice: Halalas;
  installs: number;
  status: SubmissionStatus;
  submittedAt: ISODate;
  rejectionReason: string | null;
  hue: number;
}

export type PartnerStatus = "active" | "pending" | "suspended";

/** Developer account for `/partners`. */
export interface PlatformPartner {
  id: string;
  name: string;
  company: string;
  email: string;
  appsCount: number;
  status: PartnerStatus;
  joinedAt: ISODate;
}

export type ProviderKind = "shipping" | "payment" | "communication";

/** Third-party integration the platform offers to stores (`/providers`). */
export interface ProviderIntegration {
  id: string;
  kind: ProviderKind;
  name: LocalizedText;
  description: LocalizedText;
  enabled: boolean;
  storesCount: number;
}

export type JobStatus = "success" | "running" | "failed" | "queued";

/** Background job row for `/jobs`. */
export interface PlatformJob {
  id: string;
  name: string;
  status: JobStatus;
  lastRunAt: ISODate;
  durationMs: number;
  failures: number;
}

export type FlagScope = "all" | "plan" | "stores";
export type FlagAudience = "all" | "pro" | "growth_pro" | "stores_120" | "stores_beta";

/** Feature flag for `/flags`. */
export interface FeatureFlag {
  id: string;
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  enabled: boolean;
  scope: FlagScope;
  audience: FlagAudience;
}

export type PlatformRole = "owner" | "admin" | "support" | "developer";

/** Platform staff member for `/team`. */
export interface PlatformStaff {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  status: StaffStatus;
  lastActiveAt: ISODate | null;
}

/** Staff row inside `/stores/[id]`. */
export interface TenantStaff {
  id: string;
  name: string;
  email: string;
  role: PlatformRole;
  status: StaffStatus;
}

/** Order row inside `/stores/[id]` (stub). */
export interface TenantOrder {
  id: string;
  number: number;
  total: Halalas;
  status: "paid" | "pending" | "refunded";
  at: ISODate;
}

/* ------------------------------------------------------------------ */
/* Developer portal (apps/partners)                                     */
/* ------------------------------------------------------------------ */

export type PartnerAppCategory = "payments" | "shipping" | "marketing" | "accounting" | "ai";
export type PartnerAppStatus = "live" | "inReview" | "draft";

export interface PartnerApp {
  id: string;
  name: LocalizedText;
  tagline: LocalizedText;
  category: PartnerAppCategory;
  status: PartnerAppStatus;
  installs: number;
  rating: number;
  revenue: Halalas;
  monthlyPrice: Halalas;
  scopes: string[];
  webhookUrl: string;
  redirectUrl: string;
  clientId: string;
  /** Store-listing fields (§5.22) — optional until filled in the listing tab. */
  description?: LocalizedText;
  supportEmail?: string;
  privacyUrl?: string;
  updatedAt: ISODate;
  hue: number;
}

export interface PartnerSummary {
  installs: number;
  installsDelta: number;
  revenue: Halalas;
  revenueDelta: number;
  apiCalls: number;
  apiCallsDelta: number;
  errorRate: number;
  series: { date: ISODate; installs: number; apiCalls: number }[];
  recentEvents: { id: string; event: string; storeName: string; at: ISODate; status: "delivered" | "failed" }[];
}

/** Sandbox store a developer can open/delete (`/test-stores`). */
export interface TestStore {
  id: string;
  name: string;
  url: string;
  createdAt: ISODate;
}
