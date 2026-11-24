import type { ISODate, LocalizedText, Money, Phone } from "../common";
import type { Address, SaudiCity } from "./entities-customer";
import type { SocialChannelKind } from "./entities-inbox";
import type { PaymentMethod, ReturnReason } from "./entities-order";
import type { SubscriptionStatus } from "./entities-platform";

/* 4.20 Settings */
export interface PaymentSettings {
  providerAccountStatus: "not_started" | "pending_kyc" | "active" | "rejected";
  methods: { method: PaymentMethod; enabled: boolean }[];
  cod: { enabled: boolean; fee: Money; maxOrder: Money; cities: SaudiCity[] };
  bankTransfer: { enabled: boolean; iban: string; bankName: string; instructions: string };
  settlement: { nextPayoutAt: ISODate; pending: Money; lastPayout: Money };
}

export interface ShippingRate {
  type: "flat" | "weight" | "price";
  conditions: string;
  price: Money;
}

export interface ShippingSettings {
  pickupAddress: Address;
  zones: { id: string; name: string; cities: SaudiCity[]; rates: ShippingRate[] }[];
  carriers: { carrierId: string; enabled: boolean }[];
  freeShippingThreshold: Money | null;
  fallbackRate: Money;
  handlingDays: number;
}

export interface TaxSettings {
  vatEnabled: boolean;
  vatRate: number;
  pricesIncludeTax: boolean;
  zatcaStatus: "not_connected" | "onboarding" | "connected" | "error";
  egsSerial: string | null;
}

export type NotificationEvent =
  | "order_confirmed"
  | "payment_failed"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cart_abandoned"
  | "return_update"
  | "otp";

export interface NotificationTemplate {
  event: NotificationEvent;
  channel: "whatsapp" | "sms" | "email";
  enabled: boolean;
  content: LocalizedText;
  whatsappTemplateStatus: "approved" | "pending" | "rejected" | null;
}

export interface ChannelNumber {
  id: string;
  phone: Phone;
  displayName: string;
  status: "active" | "pending" | "disconnected";
  qualityRating: "high" | "medium" | "low" | null;
  agentId: string | null;
}

/** A connected social messaging account (`/agents/channels` — simulated OAuth). */
export interface SocialChannelConnection {
  id: string;
  kind: SocialChannelKind;
  /** Handle / page id entered at connect time, e.g. `@nakhla_store`. */
  handle: string;
  status: "connected" | "pending" | "disconnected";
  agentId: string | null;
  connectedAt: ISODate | null;
}

export interface ChannelSettings {
  whatsappNumbers: ChannelNumber[];
  voiceNumbers: ChannelNumber[];
  webchat: { enabled: boolean; position: "start" | "end"; color: string; greeting: string; agentId: string | null };
  social: SocialChannelConnection[];
}

/**
 * Storefront maintenance mode (`/settings/maintenance`) — synced to the
 * storefront app via the shared-cookie slices like the other settings.
 */
export interface MaintenanceSettings {
  enabled: boolean;
  message: LocalizedText;
  eta: ISODate | null;
}

/* 4.22 Subscription — merchant-facing billing card (`/settings/billing`). */
export interface MerchantBilling {
  planId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: ISODate;
  monthlyPrice: Money;
  usage: { metric: string; used: number; limit: number }[];
  addons: { id: string; name: LocalizedText; price: Money; enabled: boolean }[];
  invoices: { id: string; at: ISODate; amount: Money; status: "paid" | "open" }[];
  paymentMethod: { brand: string; last4: string } | null;
}

/* 4.21 Returns policy — eligibility rules enforced when a return is created
 * (`returns.create`): windowDays is counted from order creation in the mock. */
export interface ReturnPolicySettings {
  /** Orders older than this many days can't be returned. */
  windowDays: number;
  /** Reasons the customer/staff may pick — a disabled reason is rejected at create. */
  reasons: ReturnReason[];
  /** Products excluded from returns entirely (e.g. digital goods, hygiene). */
  nonReturnableProductIds: string[];
  /** Allowed resolutions the reviewer may pick on approve. */
  allowExchange: boolean;
  allowStoreCredit: boolean;
}

/* KYC / payment-provider verification (`/settings/verification`). */
export type VerificationStatus = "not_started" | "in_review" | "approved" | "rejected";
export type VerificationDocKind = "national_id" | "commercial_registration" | "iban_certificate";

export interface StoreVerification {
  status: VerificationStatus;
  rejectionReason: string | null;
  documents: { id: string; kind: VerificationDocKind; fileName: string | null; status: "missing" | "uploaded" | "rejected" }[];
}
