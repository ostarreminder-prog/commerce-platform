import type { Email, ISODate, LocalizedText, MediaRef, Money } from "../common";

/* 4.21 Apps & developers */
export type AppStatus = "draft" | "in_review" | "approved" | "rejected" | "suspended";

export interface App {
  id: string;
  name: LocalizedText;
  icon: MediaRef | null;
  developer: string;
  category: string;
  shortDescription: LocalizedText;
  description: LocalizedText;
  screenshots: MediaRef[];
  scopes: string[];
  pricing: { type: "free" | "monthly" | "usage" | "one_time"; price: Money | null };
  rating: number;
  installsCount: number;
  status: AppStatus;
  supportEmail: Email;
  privacyUrl: string;
}

export interface AppInstallation {
  id: string;
  appId: string;
  grantedScopes: string[];
  installedBy: string;
  installedAt: ISODate;
  lastActivityAt: ISODate | null;
  status: "active" | "suspended" | "uninstalled";
  /** Merchant-entered credentials/config saved post-install (mock). */
  settings?: Record<string, string>;
  /** Outcome of the last "test connection" run — a simulated check the UI labels as such. */
  connectionStatus?: "untested" | "ok" | "failed";
}

export interface ApiKey {
  id: string;
  name: string;
  scopes: string[];
  prefix: string;
  createdBy: string;
  lastUsedAt: ISODate | null;
  expiresAt: ISODate | null;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string | null;
  status: "active" | "disabled_failing";
  deliveries: { id: string; event: string; status: "succeeded" | "failed"; httpCode: number; attempt: number; at: ISODate; durationMs: number }[];
}
