"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import type { Address, AdminNotificationEvent, Affiliate, CancelReason, ChannelSettings, Conversation, CopilotConversation, CopilotSettings, CopilotTask, DigitalAsset, FulfillmentStatus, LoyaltySettings, MaintenanceSettings, Media, Menu, MenuItem, MerchantBilling, MovementReason, NotificationPrefChannel, NotificationTemplate, PaymentSettings, PriceList, ProductStatus, RecoveryTemplate, Return, ReturnPolicySettings, ReturnStatus, ReviewStatus, Role, ShippingSettings, SocialChannelKind, Staff, Store, StorefrontSeo, TaxSettings, Theme } from "@repo/contracts";
import { commerce, type AffiliateInput, type BrandInput, type CartRecoverySettings, type CategoryInput, type CollectionInput, type ConversationMessageInput, type CouponInput, type EditOrderInput, type GiftCardInput, type ImportInput, type KnowledgeInput, type NewConversationInput, type NewOrderInput, type NewReturnInput, type NewsletterInput, type OrderLookupInput, type PageInput, type PriceListInput, type ProductInput, type PromotionInput, type RedirectInput, type RefundInput, type SendRecoveryInput, type ShipmentInput, type ShipmentStatusInput, type TrackingInput } from "./commerce";

/** One key per entity so any mutation invalidates every screen showing it. */
export const keys = {
  stores: ["stores"] as const,
  store: (slug: string) => ["stores", slug] as const,
  staff: ["staff"] as const,
  me: ["staff", "me"] as const,
  roles: ["roles"] as const,
  categories: ["categories"] as const,
  brands: ["brands"] as const,
  products: ["products"] as const,
  product: (id: string) => ["products", id] as const,
  inventory: ["inventory"] as const,
  customers: ["customers"] as const,
  customer: (id: string) => ["customers", id] as const,
  customerSegments: ["customerSegments"] as const,
  orders: ["orders"] as const,
  order: (id: string) => ["orders", id] as const,
  payments: ["payments"] as const,
  shipments: ["shipments"] as const,
  shipment: (id: string) => ["shipments", id] as const,
  invoices: ["invoices"] as const,
  invoice: (id: string) => ["invoices", id] as const,
  returns: ["returns"] as const,
  return: (id: string) => ["returns", id] as const,
  conversations: ["conversations"] as const,
  conversation: (id: string) => ["conversations", id] as const,
  approvals: ["approvals"] as const,
  abandonedCarts: ["abandonedCarts"] as const,
  abandonedCart: (id: string) => ["abandonedCarts", id] as const,
  notifications: ["notifications"] as const,
  notificationPrefs: ["notifications", "prefs"] as const,
  backInStock: ["backInStock"] as const,
  reviews: ["reviews"] as const,
  productReviews: (productId: string) => ["reviews", "product", productId] as const,
  coupons: ["coupons"] as const,
  coupon: (id: string) => ["coupons", id] as const,
  collections: ["collections"] as const,
  collection: (id: string) => ["collections", id] as const,
  imports: ["imports"] as const,
  import: (id: string) => ["imports", id] as const,
  promotions: ["promotions"] as const,
  knowledge: ["knowledge"] as const,
  knowledgeItem: (id: string) => ["knowledge", id] as const,
  themes: ["themes"] as const,
  theme: (id: string) => ["themes", id] as const,
  themeShares: ["themeShares"] as const,
  media: ["media"] as const,
  mediaItem: (id: string) => ["media", id] as const,
  pages: ["pages"] as const,
  page: (id: string) => ["pages", id] as const,
  menus: ["menus"] as const,
  domains: ["domains"] as const,
  seo: ["storefrontSeo"] as const,
  redirects: ["seoRedirects"] as const,
  apps: ["apps"] as const,
  app: (id: string) => ["apps", id] as const,
  installations: ["appInstallations"] as const,
  installation: (id: string) => ["appInstallations", id] as const,
  audit: ["audit"] as const,
  copilotTasks: ["copilotTasks"] as const,
  copilotSettings: ["copilotSettings"] as const,
  copilotConversations: ["copilotConversations"] as const,
  paymentSettings: ["settings", "payments"] as const,
  shippingSettings: ["settings", "shipping"] as const,
  taxSettings: ["settings", "taxes"] as const,
  notificationTemplates: ["settings", "notifications"] as const,
  channelSettings: ["settings", "channels"] as const,
  maintenance: ["settings", "maintenance"] as const,
  apiKeys: ["settings", "apiKeys"] as const,
  storeWebhooks: ["settings", "webhooks"] as const,
  billing: ["settings", "billing"] as const,
  verification: ["settings", "verification"] as const,
  /* Growth suite */
  loyalty: ["loyalty"] as const,
  giftCards: ["giftCards"] as const,
  giftCard: (id: string) => ["giftCards", id] as const,
  affiliates: ["affiliates"] as const,
  affiliate: (id: string) => ["affiliates", id] as const,
  priceLists: ["priceLists"] as const,
  priceList: (id: string) => ["priceLists", id] as const,
  digital: ["digital"] as const,
  /* Storefront extras */
  productQuestions: ["productQuestions"] as const,
  productQuestionsFor: (productId: string) => ["productQuestions", productId] as const,
  newsletter: ["newsletter"] as const,
};

export const useStoreList = () => useQuery({ queryKey: keys.stores, queryFn: commerce.stores.list });
export const useStoreBySlug = (slug: string) => useQuery({ queryKey: keys.store(slug), queryFn: () => commerce.stores.bySlug(slug), retry: false });
export const useStaffList = () => useQuery({ queryKey: keys.staff, queryFn: commerce.staff.list });
export const useMe = () => useQuery({ queryKey: keys.me, queryFn: commerce.staff.me });
/** Full session — staff + role + effective `Permission[]` (drives guards & copilot gating). */
export const useCurrentUser = () => useQuery({ queryKey: [...keys.me, "session"], queryFn: commerce.me });
export const useRoles = () => useQuery({ queryKey: keys.roles, queryFn: commerce.roles.list });
export const useRole = (id: string) => useQuery({ queryKey: [...keys.roles, id], queryFn: () => commerce.roles.get(id), retry: false });
export const useCategoryList = () => useQuery({ queryKey: keys.categories, queryFn: commerce.categories.list });
export const useProductList = () => useQuery({ queryKey: keys.products, queryFn: commerce.products.list });
export const useProductById = (id: string) => useQuery({ queryKey: keys.product(id), queryFn: () => commerce.products.get(id), retry: false });
export const useInventoryLevels = () => useQuery({ queryKey: [...keys.inventory, "levels"], queryFn: commerce.inventory.levels });
export const useInventoryMovements = () => useQuery({ queryKey: [...keys.inventory, "movements"], queryFn: commerce.inventory.movements });
export const useLocations = () => useQuery({ queryKey: [...keys.inventory, "locations"], queryFn: commerce.inventory.locations });
export const useCustomerList = () => useQuery({ queryKey: keys.customers, queryFn: commerce.customers.list });
export const useCustomerById = (id: string) => useQuery({ queryKey: keys.customer(id), queryFn: () => commerce.customers.get(id), retry: false });
export const useCustomerSegments = () => useQuery({ queryKey: keys.customerSegments, queryFn: commerce.customerSegments.list });
export const useOrderList = () => useQuery({ queryKey: keys.orders, queryFn: commerce.orders.list });
export const useOrderById = (id: string) => useQuery({ queryKey: keys.order(id), queryFn: () => commerce.orders.get(id), retry: false });
export const useOrderPayments = (id: string) => useQuery({ queryKey: [...keys.payments, id], queryFn: () => commerce.orders.payments(id) });
export const useOrderRefunds = (id: string) => useQuery({ queryKey: [...keys.payments, "refunds", id], queryFn: () => commerce.orders.refunds(id) });
export const useShipmentList = () => useQuery({ queryKey: keys.shipments, queryFn: commerce.shipments.list });
export const useShipmentById = (id: string) => useQuery({ queryKey: keys.shipment(id), queryFn: () => commerce.shipments.get(id), retry: false });
export const useInvoiceList = () => useQuery({ queryKey: keys.invoices, queryFn: commerce.invoices.list });
export const useInvoiceById = (id: string) => useQuery({ queryKey: keys.invoice(id), queryFn: () => commerce.invoices.get(id), retry: false });
export const useReturnList = () => useQuery({ queryKey: keys.returns, queryFn: commerce.returns.list });
export const useReturnById = (id: string) => useQuery({ queryKey: keys.return(id), queryFn: () => commerce.returns.get(id), retry: false });
export const useConversationList = () => useQuery({ queryKey: keys.conversations, queryFn: commerce.conversations.list });
export const useConversationById = (id: string) => useQuery({ queryKey: keys.conversation(id), queryFn: () => commerce.conversations.get(id), retry: false });
export const useApprovals = () => useQuery({ queryKey: keys.approvals, queryFn: commerce.approvals.list });
export const useAbandonedCarts = () => useQuery({ queryKey: keys.abandonedCarts, queryFn: commerce.abandonedCarts.list });
export const useAbandonedCartById = (id: string) => useQuery({ queryKey: keys.abandonedCart(id), queryFn: () => commerce.abandonedCarts.get(id), retry: false });
export const useNotificationList = () => useQuery({ queryKey: keys.notifications, queryFn: commerce.notifications.list });
export const useBackInStockList = () => useQuery({ queryKey: keys.backInStock, queryFn: commerce.backInStock.list });
/** Waiting (un-notified) "أعلمني" signups for one product — drives the admin editor badge. */
export const useBackInStockCount = (productId: string) =>
  useQuery({ queryKey: keys.backInStock, queryFn: commerce.backInStock.list, select: (list) => list.filter((s) => s.productId === productId && !s.notifiedAt).length });
export const useBackInStockSubscribe = () => useInvalidating((productId: string, phone: string) => commerce.backInStock.subscribe(productId, phone), [keys.backInStock]);
export const useCollectionList = () => useQuery({ queryKey: keys.collections, queryFn: commerce.collections.list });
export const useCollectionById = (id: string) => useQuery({ queryKey: keys.collection(id), queryFn: () => commerce.collections.get(id), retry: false });
export const useCollectionProducts = (id: string) => useQuery({ queryKey: [...keys.collection(id), "products"], queryFn: () => commerce.collections.products(id), enabled: Boolean(id) });
export const useImportList = () => useQuery({ queryKey: keys.imports, queryFn: commerce.imports.list, refetchInterval: (q) => (q.state.data?.some((j) => j.status === "processing") ? 1_500 : false) });
export const useImportById = (id: string) => useQuery({ queryKey: keys.import(id), queryFn: () => commerce.imports.get(id), retry: false, refetchInterval: (q) => (q.state.data?.status === "processing" ? 1_500 : false) });
export const usePromotionList = () => useQuery({ queryKey: keys.promotions, queryFn: commerce.promotions.list });
export const useKnowledgeList = () => useQuery({ queryKey: keys.knowledge, queryFn: commerce.knowledge.list, refetchInterval: (q) => (q.state.data?.some((s) => s.status === "processing") ? 1_500 : false) });
export const useKnowledgeById = (id: string) => useQuery({ queryKey: keys.knowledgeItem(id), queryFn: () => commerce.knowledge.get(id), retry: false, refetchInterval: (q) => (q.state.data?.status === "processing" ? 1_500 : false) });
export const useCouponById = (id: string) => useQuery({ queryKey: keys.coupon(id), queryFn: () => commerce.coupons.get(id), retry: false });
export const useVariantMovements = (variantId: string) => useQuery({ queryKey: [...keys.inventory, "movements", variantId], queryFn: () => commerce.inventory.movementsFor(variantId), enabled: Boolean(variantId) });
/** All reviews for one product — storefront filters to `approved`, admin uses `useReviewsList`. */
export const useProductReviews = (productId: string) =>
  useQuery({ queryKey: keys.productReviews(productId), queryFn: () => commerce.reviews.listByProduct(productId), enabled: Boolean(productId) });
export const useReviewsList = () => useQuery({ queryKey: keys.reviews, queryFn: commerce.reviews.listAll });
export const useCreateReview = () =>
  useInvalidating((input: { productId: string; customerId: string; rating: number; text: string; images?: string[] }) => commerce.reviews.create(input), [keys.reviews]);
export const useSetReviewStatus = () => useInvalidating((id: string, status: ReviewStatus) => commerce.reviews.setStatus(id, status), [keys.reviews]);
export const useReplyToReview = () => useInvalidating((id: string, text: string) => commerce.reviews.reply(id, text), [keys.reviews]);
export const useThemes = () => useQuery({ queryKey: keys.themes, queryFn: commerce.themes.list });
export const useTheme = (id: string) => useQuery({ queryKey: keys.theme(id), queryFn: () => commerce.themes.get(id), retry: false });
/** The active storefront theme — first published one (perfume ships first in the fixtures). */
export const useActiveTheme = () =>
  useQuery({ queryKey: keys.themes, queryFn: commerce.themes.list, select: (list) => list.find((t) => t.status === "published") ?? list[0] });
export const usePageList = () => useQuery({ queryKey: keys.pages, queryFn: commerce.pages.list });
export const usePageById = (id: string) => useQuery({ queryKey: keys.page(id), queryFn: () => commerce.pages.get(id), retry: false });
export const useMenus = () => useQuery({ queryKey: keys.menus, queryFn: commerce.menus.list });
export const useDomains = () =>
  useQuery({ queryKey: keys.domains, queryFn: commerce.domains.list, refetchInterval: (q) => (q.state.data?.some((d) => d.verificationStatus === "pending" || d.sslStatus === "pending") ? 1_500 : false) });
export const useStorefrontSeo = () => useQuery({ queryKey: keys.seo, queryFn: commerce.seo.get });
export const useSeoRedirects = () => useQuery({ queryKey: keys.redirects, queryFn: commerce.seo.redirects });
export const useAppList = () => useQuery({ queryKey: keys.apps, queryFn: commerce.apps.list });
export const useAppById = (id: string) => useQuery({ queryKey: keys.app(id), queryFn: () => commerce.apps.get(id), retry: false });
export const useAppInstallationList = () => useQuery({ queryKey: keys.installations, queryFn: commerce.appInstallations.list });
export const useAppInstallationById = (id: string) => useQuery({ queryKey: keys.installation(id), queryFn: () => commerce.appInstallations.get(id), retry: false });
export const useAuditLog = () => useQuery({ queryKey: keys.audit, queryFn: commerce.audit.list });
export const useCopilotTasks = () => useQuery({ queryKey: keys.copilotTasks, queryFn: commerce.copilotTasks.list });
export const useCopilotSettings = () => useQuery({ queryKey: keys.copilotSettings, queryFn: commerce.copilotSettings.get });
export const useCopilotConversations = () => useQuery({ queryKey: keys.copilotConversations, queryFn: commerce.copilotConversations.list });
export const useCreateCopilotTask = () =>
  useInvalidating((input: Omit<CopilotTask, "id" | "createdAt" | "lastRunAt">) => commerce.copilotTasks.create(input), [keys.copilotTasks]);
export const useUpdateCopilotTask = () =>
  useInvalidating(
    (id: string, patch: Partial<Pick<CopilotTask, "title" | "prompt" | "schedule" | "threshold" | "enabled">>) => commerce.copilotTasks.update(id, patch),
    [keys.copilotTasks],
  );
export const useDeleteCopilotTask = () => useInvalidating((id: string) => commerce.copilotTasks.remove(id), [keys.copilotTasks]);
export const useRunCopilotTask = () => useInvalidating((id: string) => commerce.copilotTasks.runNow(id), [keys.copilotTasks]);
export const useSaveCopilotSettings = () => useInvalidating((s: CopilotSettings) => commerce.copilotSettings.save(s), [keys.copilotSettings]);
export const usePinCopilotConversation = () =>
  useInvalidating((id: string, pinned: boolean) => commerce.copilotConversations.pin(id, pinned), [keys.copilotConversations]);
export const useShareCopilotConversation = () =>
  useInvalidating((id: string, shared: boolean) => commerce.copilotConversations.share(id, shared), [keys.copilotConversations]);
export const useSaveCopilotConversation = () =>
  useInvalidating((conv: CopilotConversation) => commerce.copilotConversations.save(conv), [keys.copilotConversations]);
export const useDeleteCopilotConversation = () =>
  useInvalidating((id: string) => commerce.copilotConversations.remove(id), [keys.copilotConversations]);
export const useMediaList = () => useQuery({ queryKey: keys.media, queryFn: commerce.media.list });
export const useMediaById = (id: string) => useQuery({ queryKey: keys.mediaItem(id), queryFn: () => commerce.media.get(id), retry: false });

function useInvalidating<A extends unknown[], R>(fn: (...args: A) => Promise<R>, invalidate: QueryKey[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: A) => fn(...args),
    onSuccess: () => invalidate.forEach((queryKey) => qc.invalidateQueries({ queryKey })),
  });
}

/** Order mutations fan out to stock, payments and the audit trail. */
const ORDER_GRAPH: QueryKey[] = [keys.orders, keys.customers, keys.payments, keys.inventory, keys.audit];
export const useCouponList = () => useQuery({ queryKey: keys.coupons, queryFn: commerce.coupons.list });
export const useHomeAnalytics = () => useQuery({ queryKey: ["analytics", "home"], queryFn: commerce.analytics.home });
export const useCartRecoverySettings = () => useQuery({ queryKey: [...keys.abandonedCarts, "settings"], queryFn: commerce.abandonedCarts.settings });
export const useSaveCartRecoverySettings = () => useInvalidating((s: CartRecoverySettings) => commerce.abandonedCarts.saveSettings(s), [keys.abandonedCarts, keys.audit]);
export const useSetOrderFulfillment = () => useInvalidating((ids: string[], to: FulfillmentStatus) => commerce.orders.setFulfillment(ids, to), [keys.orders, keys.audit]);
export const useAddOrderTag = () => useInvalidating((ids: string[], tag: string) => commerce.orders.addTag(ids, tag), [keys.orders]);
export const useRemoveOrderTag = () => useInvalidating((ids: string[], tag: string) => commerce.orders.removeTag(ids, tag), [keys.orders]);
export const useUpdateOrderAddress = () => useInvalidating((id: string, patch: Partial<Address>) => commerce.orders.updateAddress(id, patch), [keys.orders, keys.audit]);
export const useSendPaymentLink = () => useInvalidating((id: string) => commerce.orders.sendPaymentLink(id), [keys.orders]);
export const useCreateCustomer = () => useInvalidating((input: Parameters<typeof commerce.customers.create>[0]) => commerce.customers.create(input), [keys.customers]);
export const useDeleteRole = () => useInvalidating((id: string) => commerce.roles.remove(id), [keys.roles]);
export const useAddCustomerAddress = () => useInvalidating((id: string, a: Omit<Address, "id">) => commerce.customers.addAddress(id, a), [keys.customers]);
export const useAddOrderNote = () => useInvalidating((id: string, text: string) => commerce.orders.addNote(id, text), [keys.orders]);
export const useFulfillOrder = () => useInvalidating((id: string) => commerce.orders.fulfill(id), [keys.orders]);
export const useCreateShipment = () =>
  useInvalidating((id: string, input: ShipmentInput) => commerce.orders.createShipment(id, input), [keys.orders, keys.shipments, keys.audit]);
export const useCancelOrder = () =>
  useInvalidating((id: string, input: { code: CancelReason; text: string; refund: boolean; restock: boolean; notify: boolean }) => commerce.orders.cancel(id, input), ORDER_GRAPH);
export const useRefundOrder = () =>
  useInvalidating((id: string, input: RefundInput) => commerce.orders.refund(id, input), ORDER_GRAPH);
export const useCreateOrder = () => useInvalidating((input: NewOrderInput) => commerce.orders.create(input), ORDER_GRAPH);
export const useEditOrder = () => useInvalidating((id: string, input: EditOrderInput) => commerce.orders.edit(id, input), ORDER_GRAPH);
export const useCreateReturn = () =>
  useInvalidating((input: NewReturnInput) => commerce.returns.create(input), [keys.returns, keys.orders, keys.customers, keys.audit]);
export const useRequestReturnInfo = () => useInvalidating((id: string, note: string) => commerce.returns.requestInfo(id, note), [keys.returns, keys.orders, keys.audit]);
export const useAddReturnNote = () => useInvalidating((id: string, text: string) => commerce.returns.addNote(id, text), [keys.returns]);
export const useReturnPolicy = () => useQuery({ queryKey: [...keys.returns, "policy"], queryFn: commerce.returns.policy });
export const useSaveReturnPolicy = () => useInvalidating((patch: Partial<ReturnPolicySettings>) => commerce.returns.savePolicy(patch), [keys.returns, keys.audit]);
export const useSetReturnStatus = () =>
  useInvalidating(
    (id: string, status: ReturnStatus, extra?: Partial<Pick<Return, "rejectionReason" | "refundAmount" | "restock" | "resolution">>) => commerce.returns.setStatus(id, status, extra),
    [keys.returns, keys.orders, keys.audit],
  );
export const useApproveReturn = () =>
  useInvalidating((id: string, input: Parameters<typeof commerce.returns.approve>[1]) => commerce.returns.approve(id, input), [keys.returns, keys.shipments, keys.audit]);
export const useUpdateShipmentStatus = () =>
  useInvalidating((id: string, input: ShipmentStatusInput) => commerce.shipments.setStatus(id, input), [keys.shipments, keys.orders, keys.audit]);
export const useUpdateShipmentTracking = () =>
  useInvalidating((id: string, input: TrackingInput) => commerce.shipments.updateTracking(id, input), [keys.shipments, keys.audit]);
export const useNotifyShipmentCustomer = () =>
  useInvalidating((id: string) => commerce.shipments.notifyCustomer(id), [keys.shipments, keys.orders, keys.audit]);
export const useInvoiceAttempts = (invoiceId: string) =>
  useQuery({ queryKey: [...keys.invoice(invoiceId), "attempts"], queryFn: () => commerce.invoices.attempts(invoiceId), enabled: Boolean(invoiceId) });
export const useResendInvoice = () => useInvalidating((id: string) => commerce.invoices.resend(id), [keys.invoices, keys.audit]);
export const useInstallApp = () => useInvalidating((appId: string) => commerce.appInstallations.install(appId), [keys.installations, keys.audit]);
export const useUninstallApp = () => useInvalidating((id: string) => commerce.appInstallations.uninstall(id), [keys.installations, keys.audit]);
export const useRefundReturn = () => useInvalidating((id: string) => commerce.returns.refund(id), [keys.returns, keys.orders, keys.payments, keys.invoices, keys.audit, keys.inventory]);
export const useDecideApproval = () => useInvalidating((id: string, d: "approved" | "rejected", reason?: string) => commerce.approvals.decide(id, d, reason), [keys.approvals, keys.orders, keys.conversations]);
export const useSendCartRecovery = () => useInvalidating((id: string, input?: SendRecoveryInput) => commerce.abandonedCarts.sendRecovery(id, input), [keys.abandonedCarts, keys.audit]);
export const useRecoveryTemplates = () => useQuery({ queryKey: [...keys.abandonedCarts, "templates"], queryFn: commerce.abandonedCarts.templates.list });
export const useSaveRecoveryTemplate = () => useInvalidating((t: RecoveryTemplate) => commerce.abandonedCarts.templates.save(t), [keys.abandonedCarts, keys.audit]);
export const useDeleteRecoveryTemplate = () => useInvalidating((id: string) => commerce.abandonedCarts.templates.remove(id), [keys.abandonedCarts, keys.audit]);
export const useMarkNotificationsRead = () => useInvalidating((id?: string) => commerce.notifications.markRead(id), [keys.notifications]);
export const useSetNotificationArchived = () =>
  useInvalidating((id: string, archived: boolean) => commerce.notifications.setArchived(id, archived), [keys.notifications]);
export const useNotificationPrefs = () => useQuery({ queryKey: keys.notificationPrefs, queryFn: commerce.notifications.prefs });
export const useSetNotificationPref = () =>
  useInvalidating((event: AdminNotificationEvent, channel: NotificationPrefChannel, enabled: boolean) => commerce.notifications.setPref(event, channel, enabled), [keys.notificationPrefs, keys.audit]);
export const useBrandList = () => useQuery({ queryKey: keys.brands, queryFn: commerce.brands.list });
export const useBrandById = (id: string) => useQuery({ queryKey: [...keys.brands, id], queryFn: () => commerce.brands.get(id), enabled: Boolean(id), retry: false });
export const useSaveBrand = () => useInvalidating((input: BrandInput) => commerce.brands.save(input), [keys.brands, keys.products, keys.audit]);
export const useDeleteBrand = () => useInvalidating((id: string) => commerce.brands.remove(id), [keys.brands, keys.products, keys.audit]);
export const useMaintenanceSettings = () => useQuery({ queryKey: keys.maintenance, queryFn: commerce.settings.maintenance.get });
export const useSaveMaintenanceSettings = () =>
  useInvalidating((patch: Partial<MaintenanceSettings>) => commerce.settings.maintenance.save(patch), [keys.maintenance, keys.audit]);
export const useConnectSocialChannel = () =>
  useInvalidating((kind: SocialChannelKind, handle: string) => commerce.settings.channels.connectSocial(kind, handle), [keys.channelSettings, keys.audit]);
export const useDisconnectSocialChannel = () => useInvalidating((id: string) => commerce.settings.channels.disconnectSocial(id), [keys.channelSettings, keys.audit]);
export const useSetSocialChannelAgent = () => useInvalidating((id: string, agentId: string | null) => commerce.settings.channels.setSocialAgent(id, agentId), [keys.channelSettings]);
export const useUpdateTheme = () => useInvalidating((id: string, theme: Partial<Omit<Theme, "id">>) => commerce.themes.update(id, theme), [keys.themes]);
export const usePublishTheme = () => useInvalidating((id: string, note?: string) => commerce.themes.publish(id, note), [keys.themes]);
export const useApplyThemeAsDraft = () => useInvalidating((id: string) => commerce.themes.applyAsDraft(id), [keys.themes]);
export const useScheduleTheme = () => useInvalidating((id: string, at: string | null) => commerce.themes.schedule(id, at), [keys.themes]);
export const useSetThemeWindow = () =>
  useInvalidating((id: string, window: { from: string; to: string } | null) => commerce.themes.setWindow(id, window), [keys.themes]);
export const useDuplicateTheme = () => useInvalidating((id: string) => commerce.themes.duplicate(id), [keys.themes]);
export const useRenameTheme = () => useInvalidating((id: string, name: string) => commerce.themes.rename(id, name), [keys.themes]);
export const useDeleteTheme = () => useInvalidating((id: string) => commerce.themes.remove(id), [keys.themes]);
export const useImportTheme = () => useInvalidating((theme: Theme) => commerce.themes.importTheme(theme), [keys.themes]);
export const useThemeShares = () => useQuery({ queryKey: keys.themeShares, queryFn: commerce.themeShares.list });
export const useCreateThemeShare = () => useInvalidating((themeId: string) => commerce.themeShares.create(themeId), [keys.themeShares]);
export const useRevokeThemeShare = () => useInvalidating((token: string) => commerce.themeShares.revoke(token), [keys.themeShares]);
/** Public share-token resolution for the storefront preview — errors `expired`/`invalid`. */
export const useResolveThemeShare = (token: string | null) =>
  useQuery({ queryKey: [...keys.themeShares, token], queryFn: () => commerce.themeShares.resolve(token as string), enabled: Boolean(token), retry: false });

const CATALOG_GRAPH: QueryKey[] = [keys.products, keys.categories, keys.collections, keys.inventory];
export const useSaveProduct = () => useInvalidating((input: ProductInput) => commerce.products.save(input), [keys.products, keys.inventory]);
export const useSetProductStatus = () => useInvalidating((ids: string[], status: ProductStatus) => commerce.products.setStatus(ids, status), [keys.products]);
export const useAdjustPrices = () => useInvalidating((ids: string[], mode: "percent" | "fixed", value: number) => commerce.products.adjustPrices(ids, mode, value), [keys.products]);
export const useProductsAddToCategory = () => useInvalidating((ids: string[], categoryId: string) => commerce.products.addToCategory(ids, categoryId), CATALOG_GRAPH);
export const useProductsAddToCollection = () => useInvalidating((ids: string[], collectionId: string) => commerce.products.addToCollection(ids, collectionId), CATALOG_GRAPH);
export const useProductsAddTag = () => useInvalidating((ids: string[], tag: string) => commerce.products.addTag(ids, tag), [keys.products]);
export const useDeleteProducts = () => useInvalidating((ids: string[]) => commerce.products.remove(ids), CATALOG_GRAPH);
export const useSaveCategory = () => useInvalidating((input: CategoryInput) => commerce.categories.save(input), CATALOG_GRAPH);
export const useMoveCategory = () => useInvalidating((id: string, parentId: string | null, sortOrder: number) => commerce.categories.move(id, parentId, sortOrder), [keys.categories]);
export const useDeleteCategory = () => useInvalidating((id: string) => commerce.categories.remove(id), CATALOG_GRAPH);
export const useSaveCollection = () => useInvalidating((input: CollectionInput) => commerce.collections.save(input), CATALOG_GRAPH);
export const useDeleteCollection = () => useInvalidating((id: string) => commerce.collections.remove(id), CATALOG_GRAPH);
export const useUploadMedia = () => useInvalidating((file: File) => commerce.media.upload(file), [keys.media]);
export const useCreateMedia = () => useInvalidating((input: { url: string; altAr?: string; altEn?: string; width?: number; height?: number; mime?: string }) => commerce.media.create(input), [keys.media]);
export const useUpdateMedia = () =>
  useInvalidating((id: string, patch: Partial<Pick<Media, "altAr" | "altEn" | "url" | "sizeBytes" | "width" | "height" | "mime">>) => commerce.media.update(id, patch), [keys.media]);
export const useDeleteMedia = () => useInvalidating((id: string) => commerce.media.remove(id), [keys.media]);
export const useAdjustInventory = () => useInvalidating((variantId: string, input: { delta?: number; set?: number; reason: MovementReason; note: string }) => commerce.inventory.adjust(variantId, input), [keys.inventory, keys.products]);
export const useUpdateCustomer = () => useInvalidating((id: string, patch: Parameters<typeof commerce.customers.update>[1]) => commerce.customers.update(id, patch), [keys.customers]);
export const useCustomersAddTag = () => useInvalidating((ids: string[], tag: string) => commerce.customers.addTag(ids, tag), [keys.customers]);
export const useCustomersRemoveTag = () => useInvalidating((ids: string[], tag: string) => commerce.customers.removeTag(ids, tag), [keys.customers]);
export const useUpdateCustomerAddress = () => useInvalidating((id: string, addressId: string, patch: Partial<Omit<Address, "id">>) => commerce.customers.updateAddress(id, addressId, patch), [keys.customers]);
export const useDeleteCustomerAddress = () => useInvalidating((id: string, addressId: string) => commerce.customers.removeAddress(id, addressId), [keys.customers]);
export const useSetDefaultCustomerAddress = () => useInvalidating((id: string, addressId: string) => commerce.customers.setDefaultAddress(id, addressId), [keys.customers]);
export const useAddCustomerNote = () => useInvalidating((id: string, text: string) => commerce.customers.addNote(id, text), [keys.customers]);
export const useSaveCustomerSegment = () => useInvalidating((name: string, filters: Record<string, string>) => commerce.customerSegments.save(name, filters), [keys.customerSegments]);
export const useDeleteCustomerSegment = () => useInvalidating((id: string) => commerce.customerSegments.remove(id), [keys.customerSegments]);
export const useDeleteCustomer = () => useInvalidating((id: string) => commerce.customers.remove(id), [keys.customers]);
export const useSaveCoupon = () => useInvalidating((input: CouponInput) => commerce.coupons.save(input), [keys.coupons]);
export const useSetCouponStatus = () => useInvalidating((id: string, disabled: boolean) => commerce.coupons.setStatus(id, disabled), [keys.coupons]);
export const useDeleteCoupon = () => useInvalidating((id: string) => commerce.coupons.remove(id), [keys.coupons]);
export const useSavePromotion = () => useInvalidating((input: PromotionInput) => commerce.promotions.save(input), [keys.promotions]);
export const useSetPromotionStatus = () => useInvalidating((id: string, disabled: boolean) => commerce.promotions.setStatus(id, disabled), [keys.promotions]);
export const useDeletePromotion = () => useInvalidating((id: string) => commerce.promotions.remove(id), [keys.promotions]);
export const useCreateImport = () => useInvalidating((input: ImportInput) => commerce.imports.create(input), [keys.imports, keys.products, keys.inventory, keys.customers]);
export const useSendConversationMessage = () => useInvalidating((id: string, input: ConversationMessageInput) => commerce.conversations.sendMessage(id, input), [keys.conversations]);
export const useTakeOverConversation = () => useInvalidating((id: string) => commerce.conversations.takeOver(id), [keys.conversations]);
export const useReturnConversationToAgent = () => useInvalidating((id: string) => commerce.conversations.returnToAgent(id), [keys.conversations]);
export const useSetConversationStatus = () => useInvalidating((id: string, status: "resolved" | "closed" | "open_human") => commerce.conversations.setStatus(id, status), [keys.conversations]);
export const useAssignConversation = () => useInvalidating((id: string, staffId: string | null) => commerce.conversations.assign(id, staffId), [keys.conversations]);
export const useSetConversationPriority = () => useInvalidating((id: string, priority: Conversation["priority"]) => commerce.conversations.setPriority(id, priority), [keys.conversations]);
export const useConversationAddTag = () => useInvalidating((id: string, tag: string) => commerce.conversations.addTag(id, tag), [keys.conversations]);
export const useLinkConversationOrder = () => useInvalidating((id: string, orderId: string | null) => commerce.conversations.linkOrder(id, orderId), [keys.conversations]);
export const useUnlinkConversationOrder = () => useInvalidating((id: string, orderId: string) => commerce.conversations.unlinkOrder(id, orderId), [keys.conversations]);
export const useLinkConversationCustomer = () => useInvalidating((id: string, customerId: string | null) => commerce.conversations.linkCustomer(id, customerId), [keys.conversations, keys.customers]);
/** Smart-reply draft — generated on demand, never auto-sent. */
export const useSuggestReply = () => useMutation({ mutationFn: (id: string) => commerce.conversations.suggestReply(id) });
export const useRequestApproval = () => useInvalidating((input: Parameters<typeof commerce.approvals.request>[0]) => commerce.approvals.request(input), [keys.approvals]);
export const useCreateKnowledge = () => useInvalidating((input: KnowledgeInput) => commerce.knowledge.create(input), [keys.knowledge]);
export const useUpdateKnowledge = () => useInvalidating((id: string, input: Pick<KnowledgeInput, "title" | "detail" | "faq">) => commerce.knowledge.update(id, input), [keys.knowledge]);
export const useLinkKnowledgeAgent = () => useInvalidating((id: string, agentId: string) => commerce.knowledge.linkAgent(id, agentId), [keys.knowledge]);
export const useUnlinkKnowledgeAgent = () => useInvalidating((id: string, agentId: string) => commerce.knowledge.unlinkAgent(id, agentId), [keys.knowledge]);
export const useDeleteKnowledge = () => useInvalidating((id: string) => commerce.knowledge.remove(id), [keys.knowledge]);
export const useSetKnowledgeAutoSync = () => useInvalidating((id: string, on: boolean) => commerce.knowledge.setAutoSync(id, on), [keys.knowledge]);
export const useSyncKnowledge = () => useInvalidating((id: string) => commerce.knowledge.sync(id), [keys.knowledge]);
export const useTestKnowledge = () => useMutation({ mutationFn: (args: [string, string]) => commerce.knowledge.testQuery(...args) });
export const useCreatePage = () => useInvalidating((input: PageInput) => commerce.pages.create(input), [keys.pages]);
export const useUpdatePage = () => useInvalidating((id: string, input: PageInput) => commerce.pages.update(id, input), [keys.pages]);
export const useDeletePage = () => useInvalidating((id: string) => commerce.pages.remove(id), [keys.pages]);
export const useSaveMenu = () => useInvalidating((id: string, items: MenuItem[]) => commerce.menus.update(id, items), [keys.menus]);
export const useCreateMenu = () => useInvalidating((location: Menu["location"]) => commerce.menus.create(location), [keys.menus]);
export const useDeleteMenu = () => useInvalidating((id: string) => commerce.menus.remove(id), [keys.menus]);
export const useAddDomain = () => useInvalidating((hostname: string) => commerce.domains.add(hostname), [keys.domains]);
export const useVerifyDomain = () => useInvalidating((id: string) => commerce.domains.verify(id), [keys.domains]);
export const useSetPrimaryDomain = () => useInvalidating((id: string) => commerce.domains.setPrimary(id), [keys.domains]);
export const useRemoveDomain = () => useInvalidating((id: string) => commerce.domains.remove(id), [keys.domains]);
export const useSaveStorefrontSeo = () => useInvalidating((input: StorefrontSeo) => commerce.seo.save(input), [keys.seo]);
export const useAddSeoRedirect = () => useInvalidating((input: RedirectInput) => commerce.seo.addRedirect(input), [keys.redirects]);
export const useDeleteSeoRedirect = () => useInvalidating((id: string) => commerce.seo.removeRedirect(id), [keys.redirects]);

/* ---- growth suite: loyalty / gift cards / affiliates / price lists / digital / locations ---- */
export const useLoyaltySettings = () => useQuery({ queryKey: keys.loyalty, queryFn: commerce.loyalty.settings });
export const useSaveLoyaltySettings = () => useInvalidating((patch: Partial<LoyaltySettings>) => commerce.loyalty.saveSettings(patch), [keys.loyalty, keys.customers, keys.audit]);
export const useLoyaltyAccounts = () => useQuery({ queryKey: [...keys.loyalty, "accounts"], queryFn: commerce.loyalty.accounts });
export const useLoyaltyAccount = (customerId: string) =>
  useQuery({ queryKey: [...keys.loyalty, "accounts", customerId], queryFn: () => commerce.loyalty.accountFor(customerId), enabled: Boolean(customerId) });
export const useLoyaltyTransactions = (customerId?: string) =>
  useQuery({ queryKey: [...keys.loyalty, "txns", customerId ?? "all"], queryFn: () => commerce.loyalty.transactions(customerId) });
export const useAdjustLoyalty = () =>
  useInvalidating((customerId: string, points: number, note: string) => commerce.loyalty.adjust(customerId, points, note), [keys.loyalty, keys.customers, keys.audit]);

export const useGiftCards = () => useQuery({ queryKey: keys.giftCards, queryFn: commerce.giftCards.list });
export const useGiftCard = (id: string) => useQuery({ queryKey: keys.giftCard(id), queryFn: () => commerce.giftCards.get(id), enabled: Boolean(id), retry: false });
export const useGiftCardTransactions = (cardId: string) =>
  useQuery({ queryKey: [...keys.giftCard(cardId), "txns"], queryFn: () => commerce.giftCards.transactions(cardId), enabled: Boolean(cardId) });
export const useIssueGiftCard = () => useInvalidating((input: GiftCardInput) => commerce.giftCards.issue(input), [keys.giftCards, keys.audit]);
export const useDeactivateGiftCard = () => useInvalidating((id: string) => commerce.giftCards.deactivate(id), [keys.giftCards, keys.audit]);
export const useCheckGiftCardBalance = () => useMutation({ mutationFn: (code: string) => commerce.giftCards.checkBalance(code) });

export const useAffiliates = () => useQuery({ queryKey: keys.affiliates, queryFn: commerce.affiliates.list });
export const useAffiliate = (id: string) => useQuery({ queryKey: keys.affiliate(id), queryFn: () => commerce.affiliates.get(id), enabled: Boolean(id), retry: false });
export const useSaveAffiliate = () => useInvalidating((input: AffiliateInput) => commerce.affiliates.save(input), [keys.affiliates, keys.audit]);
export const useSetAffiliateStatus = () => useInvalidating((id: string, status: Affiliate["status"]) => commerce.affiliates.setStatus(id, status), [keys.affiliates, keys.audit]);
export const useAffiliateConversions = (affiliateId?: string) =>
  useQuery({ queryKey: [...keys.affiliates, "conversions", affiliateId ?? "all"], queryFn: () => commerce.affiliates.conversions(affiliateId) });
export const useAffiliatePayouts = (affiliateId?: string) =>
  useQuery({ queryKey: [...keys.affiliates, "payouts", affiliateId ?? "all"], queryFn: () => commerce.affiliates.payouts(affiliateId) });
export const useCreateAffiliatePayout = () =>
  useInvalidating((affiliateId: string, amount: number, note?: string) => commerce.affiliates.createPayout(affiliateId, amount, note), [keys.affiliates, keys.audit]);
export const useMarkAffiliatePayoutPaid = () => useInvalidating((id: string) => commerce.affiliates.markPayoutPaid(id), [keys.affiliates, keys.audit]);
export const useTrackAffiliateClick = () => useMutation({ mutationFn: (code: string) => commerce.affiliates.trackClick(code) });

export const usePriceLists = () => useQuery({ queryKey: keys.priceLists, queryFn: commerce.priceLists.list });
export const usePriceList = (id: string) => useQuery({ queryKey: keys.priceList(id), queryFn: () => commerce.priceLists.get(id), enabled: Boolean(id), retry: false });
export const useSavePriceList = () => useInvalidating((input: PriceListInput) => commerce.priceLists.save(input), [keys.priceLists, keys.audit]);
export const useSetPriceListStatus = () => useInvalidating((id: string, status: PriceList["status"]) => commerce.priceLists.setStatus(id, status), [keys.priceLists, keys.audit]);
export const useDeletePriceList = () => useInvalidating((id: string) => commerce.priceLists.remove(id), [keys.priceLists, keys.audit]);
/** Price a customer pays for one variant under their lists — null = base price. */
export const useResolvedPrice = (customerId: string | null, variantId: string | null) =>
  useQuery({
    queryKey: [...keys.priceLists, "resolve", customerId, variantId],
    queryFn: () => commerce.priceLists.resolvePrice(customerId as string, variantId as string),
    enabled: Boolean(customerId && variantId),
  });

export const useSaveLocation = () =>
  useInvalidating((input: { id?: string; name: string; city: string | null; address: string | null; isDefault: boolean }) => commerce.locations.save(input), [keys.inventory, keys.audit]);
export const useSetLocationStatus = () => useInvalidating((id: string, status: "active" | "inactive") => commerce.locations.setStatus(id, status), [keys.inventory, keys.audit]);
export const useSetDefaultLocation = () => useInvalidating((id: string) => commerce.locations.setDefault(id), [keys.inventory, keys.audit]);
export const useTransferStock = () =>
  useInvalidating(
    (variantId: string, input: { fromLocationId: string; toLocationId: string; quantity: number; note?: string }) => commerce.inventory.transfer(variantId, input),
    [keys.inventory, keys.audit],
  );

export const useDigitalAssets = (productId: string) =>
  useQuery({ queryKey: [...keys.digital, "assets", productId], queryFn: () => commerce.digital.assetsFor(productId), enabled: Boolean(productId) });
export const useSaveDigitalAssets = () =>
  useInvalidating((productId: string, assets: Omit<DigitalAsset, "id" | "productId" | "createdAt">[]) => commerce.digital.saveAssets(productId, assets), [keys.digital, keys.audit]);
export const useOrderDigitalDeliveries = (orderId: string) =>
  useQuery({ queryKey: [...keys.digital, "deliveries", orderId], queryFn: () => commerce.digital.deliveriesFor(orderId), enabled: Boolean(orderId) });
export const useCustomerDigitalDeliveries = (customerId: string) =>
  useQuery({ queryKey: [...keys.digital, "customer", customerId], queryFn: () => commerce.digital.deliveriesForCustomer(customerId), enabled: Boolean(customerId) });

/* ---- storefront extras: contact form, guest tracking, Q&A, newsletter ---- */
export const useCreateConversation = () => useInvalidating((input: NewConversationInput) => commerce.conversations.create(input), [keys.conversations, keys.audit]);
export const useLookupOrder = () => useMutation({ mutationFn: (input: OrderLookupInput) => commerce.orders.lookup(input) });
export const useProductQuestions = (productId: string) =>
  useQuery({ queryKey: keys.productQuestionsFor(productId), queryFn: () => commerce.qa.list(productId), enabled: Boolean(productId) });
export const useAskProductQuestion = () =>
  useInvalidating((productId: string, input: { name: string; question: string }) => commerce.qa.ask(productId, input), [keys.productQuestions]);
export const useNewsletterSubscribe = () => useMutation({ mutationFn: (input: NewsletterInput) => commerce.newsletter.subscribe(input) });

export const useUpdateProfile = () =>
  useInvalidating((patch: { name?: string; phone?: string | null; avatar?: Staff["avatar"]; preferredLanguage?: "ar" | "en" | null }) => commerce.staff.updateProfile(patch), [keys.me, keys.staff, keys.audit]);
export const useChangePassword = () => useInvalidating((input: { current: string; next: string }) => commerce.staff.changePassword(input), [keys.audit]);

const PREVIEW_SOURCES = {
  order: [keys.orders, commerce.orders.list],
  customer: [keys.customers, commerce.customers.list],
  product: [keys.products, commerce.products.list],
  conversation: [keys.conversations, commerce.conversations.list],
  shipment: [keys.shipments, commerce.shipments.list],
  invoice: [keys.invoices, commerce.invoices.list],
  return: [keys.returns, commerce.returns.list],
  abandonedCart: [keys.abandonedCarts, commerce.abandonedCarts.list],
  category: [keys.categories, commerce.categories.list],
  collection: [keys.collections, commerce.collections.list],
  coupon: [keys.coupons, commerce.coupons.list],
  import: [keys.imports, commerce.imports.list],
  knowledge: [keys.knowledge, commerce.knowledge.list],
  approval: [keys.approvals, commerce.approvals.list],
  staff: [keys.staff, commerce.staff.list],
  page: [keys.pages, commerce.pages.list],
} as const;

export type PreviewableEntity = keyof typeof PREVIEW_SOURCES;
type PreviewData = {
  [K in PreviewableEntity]: Awaited<ReturnType<(typeof PREVIEW_SOURCES)[K][1]>>[number];
};

/** Resolves any entity from the shared list cache, so labels/previews stay consistent with list screens. */
export function useEntityRecord<K extends PreviewableEntity>(type: K, id: string, enabled = true) {
  const [queryKey, queryFn] = PREVIEW_SOURCES[type];
  return useQuery({
    queryKey,
    queryFn: queryFn as () => Promise<PreviewData[K][]>,
    enabled,
    select: (list: PreviewData[K][]) => list.find((x) => x.id === id) ?? null,
  });
}
export const isPreviewable = (type: string): type is PreviewableEntity => type in PREVIEW_SOURCES;

/* ---- store settings (spec §4.20–4.22, `/settings/*`) ---- */
export const useSaveStoreSettings = () => useInvalidating((patch: Partial<Store>) => commerce.settings.general.save(patch), [keys.stores, keys.audit]);
export const usePaymentSettings = () => useQuery({ queryKey: keys.paymentSettings, queryFn: commerce.settings.payments.get });
export const useSavePaymentSettings = () => useInvalidating((patch: Partial<PaymentSettings>) => commerce.settings.payments.save(patch), [keys.paymentSettings]);
export const useShippingSettings = () => useQuery({ queryKey: keys.shippingSettings, queryFn: commerce.settings.shipping.get });
export const useSaveShippingSettings = () => useInvalidating((patch: Partial<ShippingSettings>) => commerce.settings.shipping.save(patch), [keys.shippingSettings]);
export const useTaxSettings = () => useQuery({ queryKey: keys.taxSettings, queryFn: commerce.settings.taxes.get });
export const useSaveTaxSettings = () => useInvalidating((patch: Partial<TaxSettings>) => commerce.settings.taxes.save(patch), [keys.taxSettings]);
export const useNotificationTemplates = () => useQuery({ queryKey: keys.notificationTemplates, queryFn: commerce.settings.notifications.list });
export const useSaveNotificationTemplate = () =>
  useInvalidating(
    (input: { event: NotificationTemplate["event"]; channel: NotificationTemplate["channel"]; content: NotificationTemplate["content"]; enabled: boolean; submit?: boolean }) =>
      commerce.settings.notifications.save(input),
    [keys.notificationTemplates],
  );
export const useChannelSettings = () =>
  useQuery({
    queryKey: keys.channelSettings,
    queryFn: commerce.settings.channels.get,
    /* Simulated OAuth connect lands `pending` and flips a few seconds later —
     * poll while any social channel is mid-connect. */
    refetchInterval: (q) => (q.state.data?.social.some((s) => s.status === "pending") ? 1_500 : false),
  });
export const useSaveChannelSettings = () => useInvalidating((patch: Partial<ChannelSettings>) => commerce.settings.channels.save(patch), [keys.channelSettings]);
export const useBilling = () => useQuery({ queryKey: keys.billing, queryFn: commerce.settings.billing.get });
export const useSaveBilling = () =>
  useInvalidating((patch: Partial<Pick<MerchantBilling, "planId" | "monthlyPrice" | "paymentMethod">>) => commerce.settings.billing.save(patch), [keys.billing, keys.audit]);
export const useSetBillingAddon = () => useInvalidating((id: string, enabled: boolean) => commerce.settings.billing.setAddon(id, enabled), [keys.billing, keys.audit]);
export const useConfigureInstallation = () => useInvalidating((id: string, settings: Record<string, string>) => commerce.appInstallations.configure(id, settings), [keys.installations]);
export const useTestAppConnection = () => useInvalidating((id: string) => commerce.appInstallations.testConnection(id), [keys.installations]);
export const useSetInstallationStatus = () => useInvalidating((id: string, status: "active" | "suspended") => commerce.appInstallations.setStatus(id, status), [keys.installations]);
export const useVerification = () => useQuery({ queryKey: keys.verification, queryFn: commerce.settings.verification.get });
export const useUploadVerificationDoc = () => useInvalidating((docId: string, fileName: string) => commerce.settings.verification.upload(docId, fileName), [keys.verification]);
export const useSubmitVerification = () => useInvalidating(() => commerce.settings.verification.submit(), [keys.verification]);
export const useApiKeys = () => useQuery({ queryKey: keys.apiKeys, queryFn: commerce.settings.apiKeys.list });
export const useCreateApiKey = () => useMutation({ mutationFn: (input: { name: string; scopes: string[] }) => commerce.settings.apiKeys.create(input) });
export const useRevokeApiKey = () => useInvalidating((id: string) => commerce.settings.apiKeys.revoke(id), [keys.apiKeys]);
export const useStoreWebhooks = () => useQuery({ queryKey: keys.storeWebhooks, queryFn: commerce.settings.webhooks.list });
export const useCreateStoreWebhook = () => useInvalidating((input: { url: string; events: string[] }) => commerce.settings.webhooks.create(input), [keys.storeWebhooks]);
export const useResendWebhookDelivery = () => useInvalidating((webhookId: string, deliveryId: string) => commerce.settings.webhooks.resend(webhookId, deliveryId), [keys.storeWebhooks]);
export const useExportStoreData = () => useMutation({ mutationFn: () => commerce.settings.danger.exportAll() });
export const useSuspendStore = () => useInvalidating(() => commerce.settings.danger.suspend(), [keys.stores]);
export const useDeleteStore = () => useInvalidating(() => commerce.settings.danger.remove(), [keys.stores]);
export const useInviteStaff = () => useInvalidating((input: { name: string; email: string; roleId: string }) => commerce.staff.invite(input), [keys.staff, keys.audit]);
export const useSetStaffStatus = () => useInvalidating((id: string, status: Staff["status"]) => commerce.staff.setStatus(id, status), [keys.staff]);
export const useRemoveStaff = () => useInvalidating((id: string) => commerce.staff.remove(id), [keys.staff]);
export const useSaveRole = () => useInvalidating((input: { id?: string; name: string; description: string; permissions: Role["permissions"] }) => commerce.staff.saveRole(input), [keys.roles]);
