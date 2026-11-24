import { catalogApi } from "./catalog";
import { copilotApi } from "./copilot";
import { growthApi } from "./growth";
import { growthB2bApi } from "./growth-b2b";
import { customersApi } from "./customers";
import { inboxApi } from "./inbox";
import { marketingApi } from "./marketing";
import { mediaApi } from "./media";
import { ordersApi } from "./orders";
import { partnerApi } from "./partner";
import { platformApi } from "./platform";
import { reviewsApi } from "./reviews";
import { settingsApi } from "./settings";
import { storefrontApi } from "./storefront";
import { themesApi } from "./themes";

export { resolveCollectionProducts, setRequestContext } from "./db";
export type { GiftCardInput } from "./growth";
export type { AffiliateInput, PriceListInput } from "./growth-b2b";
export type {
  BrandInput, CartRecoverySettings, CategoryInput, CollectionInput, ConversationMessageInput, CouponInput, EditOrderInput, ImportInput, KnowledgeInput,
  NewConversationInput, NewOrderInput, NewReturnInput, NewsletterInput, NewsletterSubscriber, OrderLookupInput, PageInput, ProductInput, PromotionInput,
  RedirectInput, RefundInput, SavedCustomerSegment, SendRecoveryInput, ShipmentInput, ShipmentStatusInput, TrackingInput, ZatcaAttempt,
} from "./types";

/**
 * Full mock commerce surface — the single data layer. `commerce.platform`
 * serves the super-admin console and `commerce.partner` the developer portal
 * (both migrated from the deleted legacy layer).
 */
export const commerce = {
  ...catalogApi,
  ...mediaApi,
  ...customersApi,
  ...marketingApi,
  ...copilotApi,
  ...ordersApi,
  ...inboxApi,
  ...reviewsApi,
  ...settingsApi,
  ...themesApi,
  ...growthApi,
  ...growthB2bApi,
  ...storefrontApi,
  platform: platformApi,
  partner: partnerApi,
};

/** Headless consumers (e.g. @repo/copilot) type ctx.api against this. */
export type CommerceApi = typeof commerce;

/* E2E/dev handle — lets tests assert server-side behaviour (permission denials,
 * idempotent refunds, webhook dedupe) straight against the mock "server". */
if (typeof window !== "undefined") {
  (window as unknown as { __commerce: typeof commerce }).__commerce = commerce;
}
