import type {
  AuditLog, Collection, EntityRef, InventoryMovement, Message, ActorRef, Conversation, InventoryLevel,
  MovementReason, Order, OrderEvent, Product, ProductQuestion, Return as OrderReturn, ReturnEvent, Theme, ThemeShare,
} from "@repo/contracts";
import { knowledgeSources as knowledgeMock, spec } from "@repo/mocks";
import type { NewsletterSubscriber, SavedCustomerSegment, ZatcaAttempt } from "./types";
export const LATENCY_MS = 300;
export const respond = <T>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), LATENCY_MS));
export const fail = (message: string) => new Promise<never>((_, reject) => setTimeout(() => reject(new Error(message)), LATENCY_MS));
export let seq = 1;
export const uid = (p: string) => `${p}_n${Date.now().toString(36)}${seq++}`;

export const db = {
  stores: structuredClone(spec.stores),
  staff: structuredClone(spec.staff),
  roles: structuredClone(spec.roles),
  categories: structuredClone(spec.categories),
  brands: structuredClone(spec.brands),
  products: structuredClone(spec.products),
  locations: structuredClone(spec.locations),
  inventoryLevels: structuredClone(spec.inventoryLevels),
  inventoryMovements: structuredClone(spec.inventoryMovements),
  customers: structuredClone(spec.customers),
  /* Merchant-defined customer segments (filters → saved segment) — start empty. */
  customerSegments: [] as SavedCustomerSegment[],
  orders: structuredClone(spec.orders),
  shipments: structuredClone(spec.shipments),
  invoices: structuredClone(spec.invoices),
  /* ZATCA submission log — side-table so the Invoice contract stays unchanged;
   * rows are appended by invoices.resend (the seed's original submissions are
   * synthesized from invoice state in invoices.attempts). */
  zatcaAttempts: [] as ZatcaAttempt[],
  returns: structuredClone(spec.returns),
  payments: structuredClone(spec.payments),
  refunds: structuredClone(spec.refunds),
  conversations: structuredClone(spec.conversations),
  approvals: structuredClone(spec.approvals),
  abandonedCarts: structuredClone(spec.abandonedCarts),
  notifications: structuredClone(spec.adminNotifications),
  backInStock: structuredClone(spec.backInStockRequests),
  reviews: structuredClone(spec.reviews),
  coupons: structuredClone(spec.coupons),
  collections: structuredClone(spec.collections),
  imports: structuredClone(spec.importJobs),
  promotions: structuredClone(spec.promotions),
  knowledge: structuredClone(knowledgeMock),
  themes: structuredClone(spec.themes),
  cartSettings: structuredClone(spec.cartRecoverySettings),
  recoveryTemplates: structuredClone(spec.recoveryTemplates),
  returnPolicy: structuredClone(spec.returnPolicy),
  pages: structuredClone(spec.pages),
  menus: structuredClone(spec.menus),
  domains: structuredClone(spec.domains),
  seoRedirects: structuredClone(spec.seoRedirects),
  storefrontSeo: structuredClone(spec.storefrontSeo),
  apps: structuredClone(spec.apps),
  media: structuredClone(spec.mediaAssets),
  /* Shares persist in a cookie — cookies ignore port, so admin(:3000) →
   * storefront(:3001) share links resolve in the demo without a backend. */
  themeShares: [] as ThemeShare[],
  appInstallations: structuredClone(spec.appInstallations),
  audit: structuredClone(spec.auditLog),
  copilotTasks: structuredClone(spec.copilotTasks),
  copilotSettings: structuredClone(spec.copilotSettings),
  copilotConversations: structuredClone(spec.copilotConversations),
  /* Platform console + developer portal fixtures (was legacyApi platform/partners). */
  tenants: structuredClone(spec.tenants),
  plans: structuredClone(spec.plans),
  partnerApps: structuredClone(spec.partnerApps),
  appSubmissions: structuredClone(spec.appSubmissions),
  providers: structuredClone(spec.providerIntegrations),
  flags: structuredClone(spec.featureFlags),
  testStores: structuredClone(spec.testStores),
  webhooks: structuredClone(spec.appWebhooks),
  /* Merchant settings (spec §4.20–4.22) — `/settings/*` screens. */
  paymentSettings: structuredClone(spec.paymentSettings),
  shippingSettings: structuredClone(spec.shippingSettings),
  taxSettings: structuredClone(spec.taxSettings),
  notificationTemplates: structuredClone(spec.notificationTemplates),
  notificationPrefs: structuredClone(spec.notificationPrefs),
  channelSettings: structuredClone(spec.channelSettings),
  maintenance: structuredClone(spec.maintenance),
  apiKeys: structuredClone(spec.apiKeys),
  storeWebhooks: structuredClone(spec.storeWebhooks),
  merchantBilling: structuredClone(spec.merchantBilling),
  storeVerification: structuredClone(spec.storeVerification),
  /* Growth suite — loyalty, gift cards, affiliates, B2B price lists, digital fulfilment. */
  loyaltySettings: structuredClone(spec.loyaltySettings),
  loyaltyAccounts: structuredClone(spec.loyaltyAccounts),
  loyaltyTransactions: structuredClone(spec.loyaltyTransactions),
  giftCards: structuredClone(spec.giftCards),
  giftCardTransactions: structuredClone(spec.giftCardTransactions),
  affiliates: structuredClone(spec.affiliates),
  affiliateConversions: structuredClone(spec.affiliateConversions),
  affiliatePayouts: structuredClone(spec.affiliatePayouts),
  priceLists: structuredClone(spec.priceLists),
  digitalAssets: structuredClone(spec.digitalAssets),
  digitalDeliveries: structuredClone(spec.digitalDeliveries),
  /* Storefront extras — product Q&A (asked publicly, answered by staff) and the
   * footer newsletter list. Small seeded answers so the section isn't empty. */
  productQuestions: [
    { id: "qa_1", productId: "prd_001", authorName: "نورة", question: "هل البن مطحون ولا حبوب؟", answer: "حبوب كاملة — نطحنها عند الطلب لو حبيت، اكتبها في ملاحظات الطلب.", answeredBy: { type: "staff", id: "stf_reem", name: "ريم الحربي" }, status: "answered", createdAt: "2026-01-20T10:00:00.000Z" },
    { id: "qa_2", productId: "prd_001", authorName: "فهد", question: "ينفع للقهوة التركية؟", answer: "نعم، اطلب الطحنة الناعمة جداً في الملاحظات.", answeredBy: { type: "staff", id: "stf_reem", name: "ريم الحربي" }, status: "answered", createdAt: "2026-01-28T14:30:00.000Z" },
    { id: "qa_3", productId: "prd_004", authorName: "سارة", question: "العطر ثباته كم ساعة تقريباً؟", answer: null, answeredBy: null, status: "pending", createdAt: "2026-02-08T09:15:00.000Z" },
  ] as ProductQuestion[],
  newsletterSubscribers: [] as NewsletterSubscriber[],
};

import { loadSyncedSlices, pruneStaleCookies, syncStorefront, persistSlice } from "./sync";
export { persistSlice };

export const SHARES_COOKIE = "cp_theme_shares";
export const loadShares = (): ThemeShare[] => {
  if (typeof document === "undefined") return [];
  try {
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${SHARES_COOKIE}=`));
    return raw ? (JSON.parse(decodeURIComponent(raw.slice(raw.indexOf("=") + 1))) as ThemeShare[]) : [];
  } catch {
    return [];
  }
};
export const persistShares = () => {
  if (typeof document === "undefined") return;
  document.cookie = `${SHARES_COOKIE}=${encodeURIComponent(JSON.stringify(db.themeShares))};path=/;max-age=${7 * 24 * 3600};samesite=lax`;
};
db.themeShares = loadShares();

/* ---- cross-app sync hydration ----
 * Storefront-facing slices persisted as chunked cookies (see sync.ts) override
 * the spec seeds — this is how admin(:3000) edits reach the storefront(:3001)
 * app and how merchant state survives a page reload. Runs at module init and
 * again inside `syncRead` (storefront-facing reads) so a SPA session sees
 * cross-port edits on its next query without a full reload. */

/* Themes are the payload whale (~100KB raw). Both apps ship the same spec
 * fixtures, so a theme whose DESIGN still matches its seed is synced as a stub
 * carrying only lifecycle fields — the reader merges it back onto its own spec
 * copy. A theme that diverges (applied design, editor save, import) travels in
 * full. */
type ThemeStub = Pick<Theme, "id" | "status" | "publishedAt" | "scheduledPublish" | "activeWindow"> & { sameAsSpec: true };
const themeDesign = (t: Theme) => {
  const { versions: _v, status: _s, publishedAt: _p, scheduledPublish: _sp, activeWindow: _aw, ...design } = t as Theme & Record<string, unknown>;
  return JSON.stringify(design);
};
const specThemeDesign = new Map(spec.themes.map((t) => [t.id, themeDesign(t)]));
const packThemeForSync = (t: Theme): Theme | ThemeStub =>
  specThemeDesign.get(t.id) === themeDesign(t)
    ? { id: t.id, status: t.status, publishedAt: t.publishedAt, scheduledPublish: t.scheduledPublish, activeWindow: t.activeWindow, sameAsSpec: true }
    : { ...t, versions: t.versions.map((v) => ({ ...v, snapshot: undefined })) };
const unpackTheme = (t: Theme | ThemeStub): Theme => {
  if ((t as ThemeStub).sameAsSpec) {
    const seed = spec.themes.find((s) => s.id === t.id);
    if (seed) {
      const stub = t as ThemeStub;
      return { ...structuredClone(seed), status: stub.status, publishedAt: stub.publishedAt, scheduledPublish: stub.scheduledPublish, activeWindow: stub.activeWindow };
    }
  }
  return t as Theme;
};

export const refreshSyncedSlices = async () => {
  pruneStaleCookies();
  const synced = await loadSyncedSlices();
  if (Array.isArray(synced.themes)) db.themes = (synced.themes as (Theme | ThemeStub)[]).map(unpackTheme) as typeof db.themes;
  if (Array.isArray(synced.pages)) db.pages = synced.pages as typeof db.pages;
  if (Array.isArray(synced.menus)) db.menus = synced.menus as typeof db.menus;
  if (Array.isArray(synced.domains)) db.domains = synced.domains as typeof db.domains;
  if (synced.storefrontSeo) db.storefrontSeo = synced.storefrontSeo as typeof db.storefrontSeo;
  if (Array.isArray(synced.seoRedirects)) db.seoRedirects = synced.seoRedirects as typeof db.seoRedirects;
  if (Array.isArray(synced.stores)) db.stores = synced.stores as typeof db.stores;
  if (Array.isArray(synced.media)) db.media = synced.media as typeof db.media;
  if (synced.paymentSettings) db.paymentSettings = synced.paymentSettings as typeof db.paymentSettings;
  if (synced.shippingSettings) db.shippingSettings = synced.shippingSettings as typeof db.shippingSettings;
  if (synced.taxSettings) db.taxSettings = synced.taxSettings as typeof db.taxSettings;
  if (synced.maintenance) db.maintenance = synced.maintenance as typeof db.maintenance;
};
void refreshSyncedSlices();

/** Read a storefront-facing slice after re-hydrating from the shared cookies —
 * use for endpoints whose data the other app may have mutated. The thunk keeps
 * evaluation lazy so callers always see the refreshed value. */
export const syncRead = async <T>(fn: () => T): Promise<T> => {
  await refreshSyncedSlices();
  return respond(fn());
};

/** Persist every storefront-facing slice to shared cookies — call at the end
 * of any mutation that affects what the storefront renders. Writes are gzip-
 * compressed and serialized through a chain so rapid mutations can't interleave
 * the shared index cookie. Theme version snapshots are stripped (they're local
 * history; keeping them would multiply the cookie payload per publish) and
 * `data:` media URLs stay device-local — uploaded binaries need a real backend. */
let persistChain: Promise<void> = Promise.resolve();
export const persistStorefront = () => {
  persistChain = persistChain.then(() =>
    syncStorefront({
      themes: db.themes.map(packThemeForSync),
      pages: db.pages,
      menus: db.menus,
      domains: db.domains,
      storefrontSeo: db.storefrontSeo,
      seoRedirects: db.seoRedirects,
      stores: db.stores,
      media: db.media.filter((m) => !(m.url ?? "").startsWith("data:")),
      paymentSettings: db.paymentSettings,
      shippingSettings: db.shippingSettings,
      taxSettings: db.taxSettings,
      maintenance: db.maintenance,
    }).then(() => undefined),
  );
};

/* Original ZATCA submissions — one attempt per seeded invoice so the log is
 * complete from the start; resends append more rows. */
db.invoices.forEach((inv) => {
  db.zatcaAttempts.push({
    id: `zat_seed_${inv.id}`, invoiceId: inv.id, at: inv.issuedAt,
    actor: { type: "system", id: "system", name: "النظام" },
    result: inv.zatcaStatus, detail: inv.zatcaErrors[0] ?? null,
  });
});

export const me = (): ActorRef => ({ type: "staff", id: spec.currentStaff.id, name: spec.currentStaff.name });
export const SYSTEM: ActorRef = { type: "system", id: "system", name: "النظام" };

/* ---- request context (mock "server" authorization) ----
 * The mock db has no real session, so the admin shell pushes the effective
 * permission set here whenever the signed-in/impersonated role changes
 * (`setRequestContext`). `null` = unrestricted — used by non-admin apps
 * (storefront checkout) and while the role is still resolving, matching the
 * `can()` fallback in the admin PermissionsProvider.
 * Mutations call `requirePerm("orders.manage")` etc.; a denied call rejects
 * the promise with `permission_denied:<perm>` — same code the copilot
 * executor throws when a tool is gated off. */
export const requestContext: { permissions: ReadonlySet<string> | null } = { permissions: null };
export const setRequestContext = (ctx: { permissions: ReadonlySet<string> | null }) => {
  requestContext.permissions = ctx.permissions;
};
export const requirePerm = (perm: string) => {
  const perms = requestContext.permissions;
  if (perms && !perms.has(perm)) throw new Error(`permission_denied:${perm}`);
};

/* ---- audit log (§4.22) — mutations write entries with the acting staff user. */
export const audit = (action: string, target: EntityRef | null, changes: AuditLog["changes"] = [], actor: ActorRef = me()) =>
  db.audit.unshift({ id: uid("aud"), actor, action, target, changes, ip: null, at: new Date().toISOString() });

/* ---- inventory ---- */
export const stockAvailable = (variantId: string) =>
  db.inventoryLevels.filter((l) => l.variantId === variantId).reduce((s, l) => s + l.available, 0);

/** The warehouse order stock commits against when none is picked. */
export const defaultLocation = () => db.locations.find((l) => l.isDefault && l.status === "active") ?? db.locations.find((l) => l.status === "active") ?? db.locations[0] ?? null;

/** Applies a stock delta to a variant's level at one location (default when not
 * given) and records the matching InventoryMovement — used by order create
 * (sale), cancel (cancellation), return/refund restock and transfers. */
export const adjustStock = (
  variantId: string,
  delta: number,
  reason: MovementReason,
  opts: { note?: string | null; reference?: EntityRef | null; actor?: ActorRef; locationId?: string } = {},
): InventoryMovement | null => {
  const level = opts.locationId
    ? db.inventoryLevels.find((l) => l.variantId === variantId && l.locationId === opts.locationId)
    : db.inventoryLevels.find((l) => l.variantId === variantId);
  if (!level || delta === 0) return null;
  level.onHand += delta;
  level.available = level.onHand - level.reserved;
  const m: InventoryMovement = {
    id: uid("mov"), variantId, locationId: level.locationId, delta, reason, note: opts.note ?? null, reference: opts.reference ?? null,
    actor: opts.actor ?? me(), at: new Date().toISOString(), balanceAfter: level.onHand,
  };
  db.inventoryMovements.unshift(m);
  return m;
};

/* ---- payment-webhook dedupe (mock gateway) ----
 * A real gateway delivers signed events at-least-once and possibly out of
 * order; processed event ids are kept so replays are acknowledged but ignored. */
export const processedWebhookEvents = new Set<string>();
export const find = <T extends { id: string }>(list: T[], id: string, what: string): T => {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error(`${what} ${id} not found`);
  return item;
};
export const guard = <T>(fn: () => T): Promise<T> => {
  try {
    return respond(fn());
  } catch (e) {
    return fail((e as Error).message);
  }
};
export const event = (order: Order, type: OrderEvent["type"], data: OrderEvent["data"] = {}, link: OrderEvent["link"] = null, actor = me()) =>
  order.events.push({ id: uid("ev"), type, actor, at: new Date().toISOString(), data, link });

export const returnEvent = (r: OrderReturn, type: ReturnEvent["type"], data: ReturnEvent["data"] = {}, actor = me()) =>
  r.events.push({ id: uid("rev"), type, actor, at: new Date().toISOString(), data });

/* ---- theme scheduling (mock) ----
 * Publish = single live theme: publishing demotes every other published theme.
 * `tickThemeSchedule` runs on themes.list/get so scheduled publishes and
 * temporary windows evaluate lazily without a real clock job. */
export const windowActivated = new Set<string>();
export const windowFallback = new Map<string, string>();

/**
 * Full Theme clone for a version entry — nested `versions[].snapshot` fields
 * are stripped so snapshots don't grow unboundedly.
 */
export const themeSnapshot = (t: Theme): Theme => {
  const snap = structuredClone(t);
  snap.versions = snap.versions.map((v) => ({ ...v, snapshot: undefined }));
  return snap;
};

export const pushVersion = (t: Theme, note: string) => {
  t.versions.push({ id: uid("ver"), at: new Date().toISOString(), actor: me(), note, snapshot: themeSnapshot(t) });
};

export const publishThemeNow = (t: Theme, note: string) => {
  t.status = "published";
  t.publishedAt = new Date().toISOString();
  t.scheduledPublish = null;
  t.versions.push({ id: uid("ver"), at: t.publishedAt, actor: me(), note, snapshot: themeSnapshot(t) });
  db.themes.forEach((x) => {
    if (x.id !== t.id && x.status === "published") x.status = "draft";
  });
};

export const tickThemeSchedule = () => {
  const now = Date.now();
  for (const t of db.themes) {
    if (t.status !== "published" && t.scheduledPublish && +new Date(t.scheduledPublish.at) <= now) {
      publishThemeNow(t, "scheduled");
    }
    const w = t.activeWindow;
    if (!w) continue;
    const from = +new Date(w.from);
    const to = +new Date(w.to);
    if (t.status !== "published" && from <= now && now < to) {
      const prev = db.themes.find((x) => x.status === "published");
      if (prev) windowFallback.set(t.id, prev.id);
      windowActivated.add(t.id);
      publishThemeNow(t, "window_start");
    } else if (now >= to && windowActivated.has(t.id)) {
      windowActivated.delete(t.id);
      if (t.status === "published") t.status = "draft";
      const back = windowFallback.get(t.id);
      if (back && !db.themes.some((x) => x.status === "published")) {
        const fallback = db.themes.find((x) => x.id === back);
        if (fallback) fallback.status = "published";
      }
    }
  }
};

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/(^-|-$)/g, "");

/** Resolves which products belong to a collection; automatic collections evaluate their rules live (§4.4). */
export function resolveCollectionProducts(c: Collection, products: Product[], levels: InventoryLevel[]): Product[] {
  if (c.type === "manual") return c.productIds.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));
  if (!c.rules.length) return [];
  const test = (p: Product, r: Collection["rules"][number]): boolean => {
    const price = Math.min(...p.variants.map((v) => v.price.amount));
    const stock = p.variants.reduce((s, v) => s + levels.filter((l) => l.variantId === v.id).reduce((t, l) => t + l.available, 0), 0);
    const field = r.field === "price" ? price : r.field === "stock" ? stock : null;
    if (field !== null) {
      const v = Number(r.value);
      return r.op === "eq" ? field === v : r.op === "neq" ? field !== v : r.op === "gt" ? field > v : r.op === "lt" ? field < v : false;
    }
    if (r.field === "tag") return r.op === "neq" ? !p.tags.includes(r.value) : p.tags.includes(r.value);
    if (r.field === "category") return r.op === "neq" ? !p.categoryIds.includes(r.value) : p.categoryIds.includes(r.value);
    if (r.field === "brand") return r.op === "neq" ? p.brand !== r.value : r.op === "contains" ? (p.brand ?? "").includes(r.value) : p.brand === r.value;
    return false;
  };
  return products.filter((p) => (c.match === "all" ? c.rules.every((r) => test(p, r)) : c.rules.some((r) => test(p, r))));
}

export const categoryDepth = (id: string | null): number => {
  let depth = 0;
  let cur = id;
  while (cur) {
    depth += 1;
    cur = db.categories.find((c) => c.id === cur)?.parentId ?? null;
  }
  return depth;
};
export const isCategoryDescendant = (ancestorId: string, id: string): boolean =>
  ancestorId === id || db.categories.some((c) => c.parentId === ancestorId && isCategoryDescendant(c.id, id));

export const pushMessage = (c: Conversation, msg: Omit<Message, "id" | "at">, at = new Date().toISOString()) => {
  c.messages.push({ ...msg, id: uid("msg"), at });
  c.updatedAt = at;
};

/* ---- media library helpers (browser-side: FileReader + natural size via <img>) ---- */
export const measureImage = (url: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = url;
  });
export const readImageFile = (file: File): Promise<{ url: string; width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const url = String(reader.result);
      void measureImage(url).then(({ width, height }) => resolve({ url, width, height }));
    };
    reader.readAsDataURL(file);
  });
