import type { ActorRef, EntityRef, ISODate, LocalizedText, Money } from "../common";

/* ============================================================================
 * Growth suite — loyalty, gift cards, affiliates, B2B price lists and digital
 * fulfilment. All of it runs on the mock "server" (@repo/api-client); anything
 * that would need real payment/email rails is labelled simulated in the UI.
 * ========================================================================== */

/* ---- Loyalty program (/marketing/loyalty) ---- */
export type LoyaltyTierKey = "bronze" | "silver" | "gold";

export interface LoyaltyTier {
  key: LoyaltyTierKey;
  name: LocalizedText;
  /** Lifetime earned points needed to reach the tier. */
  minPoints: number;
  /** Free-text perks shown to the merchant (display only). */
  perks: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  /** Points earned per 1 SAR of paid order total. */
  earnRate: number;
  /** SAR value of one point at redemption. */
  redeemRate: number;
  tiers: LoyaltyTier[];
  /** Days until earned points expire; 0 = never. */
  expiryDays: number;
}

export interface LoyaltyAccount {
  customerId: string;
  points: number;
  lifetimeEarned: number;
  tier: LoyaltyTierKey;
  updatedAt: ISODate;
}

export type LoyaltyTxnType = "earn" | "redeem" | "adjust" | "expire";

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: LoyaltyTxnType;
  /** Signed — positive on earn, negative on redeem/expire. */
  points: number;
  note: string | null;
  reference: EntityRef | null;
  actor: ActorRef;
  at: ISODate;
  balanceAfter: number;
}

/* ---- Gift cards (/marketing/gift-cards) ---- */
export type GiftCardStatus = "active" | "partially_used" | "redeemed" | "expired" | "deactivated";

export interface GiftCard {
  id: string;
  code: string;
  initialBalance: Money;
  balance: Money;
  customerId: string | null;
  status: GiftCardStatus;
  expiresAt: ISODate | null;
  issuedBy: ActorRef;
  createdAt: ISODate;
}

export type GiftCardTxnType = "issue" | "redeem" | "deactivate" | "adjust";

export interface GiftCardTransaction {
  id: string;
  cardId: string;
  type: GiftCardTxnType;
  /** Signed halalas — negative on redeem. */
  amount: number;
  orderId: string | null;
  note: string | null;
  actor: ActorRef;
  at: ISODate;
  balanceAfter: Money;
}

/* ---- Affiliates (/marketing/affiliates) ---- */
export type AffiliateStatus = "active" | "paused";

export interface Affiliate {
  id: string;
  name: string;
  email: string | null;
  /** Referral code — customers/checkout attribute orders with it. */
  code: string;
  status: AffiliateStatus;
  /** Commission percent of the attributed order total. */
  commissionRate: number;
  stats: { clicks: number; orders: number; revenue: Money; commission: Money };
  createdAt: ISODate;
}

/** One order attributed to an affiliate code. */
export interface AffiliateConversion {
  id: string;
  affiliateId: string;
  orderId: string;
  orderNumber: number;
  total: Money;
  commission: Money;
  at: ISODate;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  amount: Money;
  status: "pending" | "paid";
  note: string | null;
  createdAt: ISODate;
  paidAt: ISODate | null;
}

/* ---- B2B / wholesale price lists (/products/price-lists) ---- */
export interface PriceListRule {
  id: string;
  /** null = applies to every variant not matched by a more specific rule. */
  variantId: string | null;
  /** Percent off the variant price (0-100). Mutually exclusive with fixedPrice. */
  percentOff: number | null;
  /** Fixed price in halalas — overrides percentOff when set. */
  fixedPrice: Money | null;
}

export interface PriceList {
  id: string;
  name: LocalizedText;
  status: "active" | "archived";
  /** Customers this list resolves for. */
  customerIds: string[];
  rules: PriceListRule[];
  createdAt: ISODate;
}

/* ---- Digital products fulfilment ---- */
export interface DigitalAsset {
  id: string;
  productId: string;
  /** null = asset covers the whole product / all variants. */
  variantId: string | null;
  name: string;
  kind: "file" | "link";
  /** Media-library id for uploaded files, or an external URL for links. */
  mediaId: string | null;
  url: string;
  sizeBytes: number | null;
  createdAt: ISODate;
}

/** Per-order digital delivery — created when a paid order contains digital items. */
export interface DigitalDelivery {
  id: string;
  orderId: string;
  orderItemId: string;
  assetId: string | null;
  name: string;
  url: string;
  deliveredAt: ISODate;
}
