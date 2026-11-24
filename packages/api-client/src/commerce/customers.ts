import type {
  AbandonedCart, Address, AdminNotification, AdminNotificationEvent, BackInStockSubscription, Customer, CustomerSource,
  NotificationPrefChannel, RecoveryTemplate
} from "@repo/contracts";
import { money } from "@repo/contracts";
import type {
  CartRecoverySettings, SavedCustomerSegment, SendRecoveryInput
} from "./types";
import { NOW } from "@repo/mocks";
import { audit, db, find, guard, me, requirePerm, respond, uid } from "./db";

/* Recovery cadence — a cart becomes recoverable only after `settings.delay` of
 * inactivity (the abandonment threshold), and a second message inside that
 * window is deduped so the customer never gets spammed.
 * The mock world is anchored to the fixture clock (NOW), not wall time —
 * seeded timestamps live there, so thresholds compare against it. Attempts
 * are stamped at NOW too, which makes an immediate resend dedupe correctly. */
const DELAY_MS = { "1h": 3_600_000, "24h": 86_400_000 } as const;
const recoveryDelayMs = () => DELAY_MS[db.cartSettings.delay] ?? DELAY_MS["1h"];
const isCartDue = (c: AbandonedCart) => NOW - new Date(c.abandonedAt).getTime() >= recoveryDelayMs();
const lastAttemptAt = (c: AbandonedCart) => {
  const last = c.recoveryAttempts.at(-1);
  return last ? new Date(last.at).getTime() : null;
};

export const customersApi = {
  customers: {
    list: () => guard<Customer[]>(() => { requirePerm("customers.read"); return db.customers; }),
    get: (id: string) => guard<Customer>(() => { requirePerm("customers.read"); return find(db.customers, id, "customer"); }),
    create: (input: {
      name: string;
      phone: string;
      email?: string | null;
      gender?: Customer["gender"];
      birthDate?: string | null;
      source?: CustomerSource;
      tags?: string[];
      notes?: string;
      marketingConsent?: Partial<Customer["marketingConsent"]>;
      address?: Omit<Address, "id">;
    }) => guard(() => {
      requirePerm("customers.manage");
      if (db.customers.some((c) => c.phone === input.phone)) throw new Error("phone_taken");
      const now = new Date().toISOString();
      const c: Customer = {
        id: uid("cus"), name: input.name, phone: input.phone, email: input.email ?? null,
        gender: input.gender ?? "unspecified", birthDate: input.birthDate ?? null,
        addresses: input.address ? [{ ...input.address, id: uid("adr") }] : [],
        tags: input.tags ?? [], notes: input.notes ?? "",
        marketingConsent: { whatsapp: false, sms: false, email: false, ...input.marketingConsent, updatedAt: now },
        source: input.source ?? "manual", createdAt: now,
        stats: { ordersCount: 0, totalSpent: money(0), avgOrder: money(0), lastOrderAt: null, firstOrderAt: null, returnsCount: 0 }, segment: "new",
      };
      db.customers.unshift(c);
      return c;
    }),
    addAddress: (id: string, address: Omit<Address, "id">) => guard(() => {
      requirePerm("customers.manage");
      const c = find(db.customers, id, "customer");
      const a: Address = { ...address, id: uid("adr") };
      if (a.isDefault) c.addresses.forEach((x) => (x.isDefault = false));
      c.addresses.push(a);
      return a;
    }),
    updateAddress: (id: string, addressId: string, patch: Partial<Omit<Address, "id">>) => guard(() => {
      requirePerm("customers.manage");
      const c = find(db.customers, id, "customer");
      const a = find(c.addresses, addressId, "address");
      if (patch.isDefault) c.addresses.forEach((x) => (x.isDefault = false));
      Object.assign(a, patch);
      return a;
    }),
    removeAddress: (id: string, addressId: string) => guard(() => {
      requirePerm("customers.manage");
      const c = find(db.customers, id, "customer");
      const a = find(c.addresses, addressId, "address");
      c.addresses = c.addresses.filter((x) => x.id !== addressId);
      if (a.isDefault && c.addresses[0]) c.addresses[0].isDefault = true;
      return c;
    }),
    setDefaultAddress: (id: string, addressId: string) => guard(() => {
      requirePerm("customers.manage");
      const c = find(db.customers, id, "customer");
      find(c.addresses, addressId, "address");
      c.addresses.forEach((x) => (x.isDefault = x.id === addressId));
      return c;
    }),
    update: (id: string, patch: Partial<Pick<Customer, "name" | "email" | "gender" | "birthDate" | "notes" | "tags" | "marketingConsent">>) => guard(() => {
      requirePerm("customers.manage");
      const c = find(db.customers, id, "customer");
      if (patch.marketingConsent) patch.marketingConsent = { ...patch.marketingConsent, updatedAt: new Date().toISOString() };
      Object.assign(c, patch);
      return c;
    }),
    addTag: (ids: string[], tag: string) => guard(() => {
      requirePerm("customers.manage");
      ids.forEach((id) => { const c = find(db.customers, id, "customer"); if (!c.tags.includes(tag)) c.tags.push(tag); });
    }),
    removeTag: (ids: string[], tag: string) => guard(() => {
      requirePerm("customers.manage");
      ids.forEach((id) => { const c = find(db.customers, id, "customer"); c.tags = c.tags.filter((t) => t !== tag); });
    }),
    addNote: (id: string, text: string) => guard(() => {
      requirePerm("customers.manage");
      const c = find(db.customers, id, "customer");
      (c.staffNotes ??= []).unshift({ id: uid("nte"), text, actor: me(), at: new Date().toISOString() });
      return c;
    }),
    remove: (id: string) => guard(() => {
      requirePerm("customers.manage");
      const c = find(db.customers, id, "customer");
      Object.assign(c, { name: null, email: null, phone: `+966000${c.id.slice(-6)}`, addresses: [], tags: [], notes: "", staffNotes: [], birthDate: null, gender: "unspecified" });
      return c;
    }),
  },
  /* Merchant-saved customer segments — named filter snapshots applied on
   * /customers via `?segment=saved:<id>` (preset segments are client-side). */
  customerSegments: {
    list: () => respond<SavedCustomerSegment[]>(db.customerSegments),
    save: (name: string, filters: Record<string, string>) => guard(() => {
      requirePerm("customers.manage");
      const s: SavedCustomerSegment = { id: uid("seg"), name, filters, createdAt: new Date().toISOString() };
      db.customerSegments.unshift(s);
      return s;
    }),
    remove: (id: string) => guard(() => {
      requirePerm("customers.manage");
      db.customerSegments = db.customerSegments.filter((s) => s.id !== id);
    }),
  },
  abandonedCarts: {
    list: () => guard<AbandonedCart[]>(() => { requirePerm("orders.read"); return db.abandonedCarts; }),
    settings: () => respond(db.cartSettings),
    saveSettings: (next: CartRecoverySettings) => guard(() => {
      requirePerm("marketing.manage");
      Object.assign(db.cartSettings, next);
      audit("settings.cart_recovery", null, Object.keys(next).map((field) => ({ field, from: null, to: "updated" })));
    }),
    get: (id: string) => guard<AbandonedCart>(() => { requirePerm("orders.read"); return find(db.abandonedCarts, id, "cart"); }),
    /* Recovery message templates — editable copy used by manual sends (and the
     * mocked auto-recovery job). */
    templates: {
      list: () => respond<RecoveryTemplate[]>(db.recoveryTemplates),
      save: (t: RecoveryTemplate) => guard<RecoveryTemplate>(() => {
        requirePerm("marketing.manage");
        const existing = db.recoveryTemplates.find((x) => x.id === t.id);
        if (existing) {
          Object.assign(existing, t);
          audit("cart.template_saved", { type: "abandonedCart", id: t.id, label: t.name.ar });
          return existing;
        }
        const next = { ...t, id: uid("tpl") };
        db.recoveryTemplates.unshift(next);
        audit("cart.template_saved", { type: "abandonedCart", id: next.id, label: t.name.ar });
        return next;
      }),
      remove: (id: string) => guard(() => {
        requirePerm("marketing.manage");
        db.recoveryTemplates = db.recoveryTemplates.filter((t) => t.id !== id);
        audit("cart.template_removed", { type: "abandonedCart", id, label: id });
      }),
    },
    sendRecovery: (id: string, input: SendRecoveryInput = {}) => guard(() => {
      requirePerm("marketing.manage");
      const c = find(db.abandonedCarts, id, "cart");
      if (c.recoveryStatus === "recovered" || c.recoveryStatus === "lost") throw new Error("closed");
      /* Abandonment threshold — only carts idle past the configured delay are
       * due; a cart abandoned 30 min ago is not "abandoned" for recovery yet. */
      if (!isCartDue(c)) throw new Error("cart_not_due");
      /* Exclusion rules (merchant settings): customers who ordered recently are
       * already active — no nudge; opted-out phones are skipped on WhatsApp. */
      const days = db.cartSettings.excludeRecentOrdersDays;
      if (days > 0 && c.customerId && db.orders.some((o) => o.customerId === c.customerId && o.status !== "cancelled" && NOW - new Date(o.createdAt).getTime() < days * 86_400_000))
        throw new Error("excluded_recent_order");
      const customer = db.customers.find((x) => x.id === c.customerId);
      const channel = input.channel ?? "whatsapp";
      if (db.cartSettings.excludeOptedOut && channel === "whatsapp" && customer && customer.marketingConsent.whatsapp === false)
        throw new Error("excluded_opted_out");
      /* Dedupe — no second message inside the delay window (manual resend after
       * it elapses is allowed and logged as another attempt). */
      const last = lastAttemptAt(c);
      if (last !== null && NOW - last < recoveryDelayMs()) throw new Error("recovery_recent");
      const template = input.templateId ? db.recoveryTemplates.find((t) => t.id === input.templateId) : undefined;
      c.recoveryAttempts.push({
        channel, at: new Date(NOW).toISOString(), agentId: db.cartSettings.agentId ?? "agt_sales", opened: false,
        templateId: template?.id ?? null, message: input.message ?? template?.content.ar ?? null,
      });
      if (c.recoveryStatus === "not_contacted") c.recoveryStatus = "message_sent";
      audit("cart.recovery_sent", { type: "abandonedCart", id: c.id, label: c.phone });
      return c;
    }),
  },
  notifications: {
    /* Every signed-in role sees the store's admin notifications — the feed is
     * merchant-scoped, not permission-gated. */
    list: () => respond<AdminNotification[]>(db.notifications),
    markRead: (id?: string) => guard(() => db.notifications.forEach((n) => (!id || n.id === id) && (n.read = true))),
    setArchived: (id: string, archived: boolean) => guard<AdminNotification>(() => {
      const n = find(db.notifications, id, "notification");
      n.archived = archived;
      if (archived) n.read = true;
      return n;
    }),
    /* Merchant prefs — per-event channel toggles. Only `inapp` is delivered
     * for real; the rest persist as honest local state until delivery exists. */
    prefs: () => respond(db.notificationPrefs),
    setPref: (event: AdminNotificationEvent, channel: NotificationPrefChannel, enabled: boolean) =>
      guard(() => {
        db.notificationPrefs.matrix[event][channel] = enabled;
        audit("settings.notification_prefs", null, [{ field: `${event}.${channel}`, from: String(!enabled), to: String(enabled) }]);
        return db.notificationPrefs;
      }),
  },
  /* Storefront "أعلمني عند التوفر" signups — deduped by product+phone; the admin reads the waiting count. */
  backInStock: {
    list: () => respond<BackInStockSubscription[]>(db.backInStock),
    subscribe: (productId: string, phone: string) => guard<BackInStockSubscription>(() => {
      const existing = db.backInStock.find((x) => x.productId === productId && x.phone === phone);
      if (existing) return existing;
      const s: BackInStockSubscription = { id: uid("bis"), productId, phone, createdAt: new Date().toISOString(), notifiedAt: null };
      db.backInStock.unshift(s);
      return s;
    }),
  },
  /* Product reviews (§8.3) — storefront renders `approved` only; `create`
   * lands as `pending` until the merchant approves/hides it in /reviews. */
};
