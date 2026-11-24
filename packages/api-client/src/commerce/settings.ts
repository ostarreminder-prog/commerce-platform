import type {
  ApiKey, ChannelSettings, MaintenanceSettings, MerchantBilling, NotificationTemplate, PaymentSettings, ShippingSettings,
  SocialChannelKind, Store, StoreVerification, TaxSettings, WebhookSubscription,
} from "@repo/contracts";
import { audit, db, find, guard, me, persistStorefront, requirePerm, respond, syncRead, uid } from "./db";

/** Loose email check for the `email` social channel — the connect is simulated,
 * but the handle still has to look like an address. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mock store-settings surface (spec §4.20–4.22) — `commerce.settings.*`. */
export const settingsApi = {
  settings: {
    /** Store fields (§4.1) — general screen. */
    general: {
      save: (patch: Partial<Store>) => guard<Store>(() => {
        const s = db.stores[0];
        if (!s) throw new Error("store not found");
        Object.assign(s, patch);
        db.audit.unshift({ id: uid("aud"), actor: me(), action: "settings.updated", target: null, changes: Object.keys(patch).map((field) => ({ field, from: null, to: "updated" })), ip: null, at: new Date().toISOString() });
        persistStorefront();
        return s;
      }),
    },
    payments: {
      get: () => syncRead<PaymentSettings>(() => db.paymentSettings),
      save: (patch: Partial<PaymentSettings>) => guard<PaymentSettings>(() => {
        Object.assign(db.paymentSettings, patch);
        persistStorefront();
        return db.paymentSettings;
      }),
    },
    shipping: {
      get: () => syncRead<ShippingSettings>(() => db.shippingSettings),
      save: (patch: Partial<ShippingSettings>) => guard<ShippingSettings>(() => {
        Object.assign(db.shippingSettings, patch);
        persistStorefront();
        return db.shippingSettings;
      }),
    },
    taxes: {
      get: () => syncRead<TaxSettings>(() => db.taxSettings),
      save: (patch: Partial<TaxSettings>) => guard<TaxSettings>(() => {
        Object.assign(db.taxSettings, patch);
        persistStorefront();
        return db.taxSettings;
      }),
    },
    notifications: {
      list: () => respond<NotificationTemplate[]>(db.notificationTemplates),
      /** Upserts one event+channel template; `submit` marks a WhatsApp template as pending review. */
      save: (input: { event: NotificationTemplate["event"]; channel: NotificationTemplate["channel"]; content: NotificationTemplate["content"]; enabled: boolean; submit?: boolean }) =>
        guard<NotificationTemplate>(() => {
          const existing = db.notificationTemplates.find((t) => t.event === input.event && t.channel === input.channel);
          const status = input.channel === "whatsapp" ? (input.submit ? "pending" : (existing?.whatsappTemplateStatus ?? "pending")) : null;
          if (existing) {
            Object.assign(existing, { content: input.content, enabled: input.enabled, whatsappTemplateStatus: status });
            return existing;
          }
          const t: NotificationTemplate = { event: input.event, channel: input.channel, content: input.content, enabled: input.enabled, whatsappTemplateStatus: status };
          db.notificationTemplates.push(t);
          return t;
        }),
    },
    channels: {
      get: () => respond<ChannelSettings>(db.channelSettings),
      save: (patch: Partial<ChannelSettings>) => guard<ChannelSettings>(() => Object.assign(db.channelSettings, patch)),
      /* Social channels (Instagram DM / Messenger / X / TikTok / Email) — the OAuth is
       * simulated honestly: connect lands `pending` and flips to `connected`
       * a moment later, exactly like the imports job. */
      connectSocial: (kind: SocialChannelKind, handle: string) => guard<ChannelSettings>(() => {
        requirePerm("agents.manage");
        if (!handle.trim()) throw new Error("handle_required");
        if (kind === "email" && !EMAIL_RE.test(handle.trim())) throw new Error("invalid_handle");
        const existing = db.channelSettings.social.find((s) => s.kind === kind);
        const target = existing ?? { id: uid("soc"), kind, handle: "", status: "disconnected" as const, agentId: null, connectedAt: null };
        if (!existing) db.channelSettings.social.push(target);
        target.handle = handle.trim();
        target.status = "pending";
        setTimeout(() => {
          if (target.status === "pending") {
            target.status = "connected";
            target.connectedAt = new Date().toISOString();
          }
        }, 2_500);
        audit("channels.social_connected", null, [{ field: kind, from: null, to: handle.trim() }]);
        return db.channelSettings;
      }),
      disconnectSocial: (id: string) => guard<ChannelSettings>(() => {
        requirePerm("agents.manage");
        const s = find(db.channelSettings.social, id, "social channel");
        s.status = "disconnected";
        s.agentId = null;
        s.connectedAt = null;
        audit("channels.social_disconnected", null, [{ field: s.kind, from: s.handle, to: null }]);
        return db.channelSettings;
      }),
      setSocialAgent: (id: string, agentId: string | null) => guard<ChannelSettings>(() => {
        requirePerm("agents.manage");
        find(db.channelSettings.social, id, "social channel").agentId = agentId;
        return db.channelSettings;
      }),
    },
    /* Storefront maintenance mode — synced to the storefront app via the
     * shared-cookie slices; the storefront renders the notice page when on. */
    maintenance: {
      get: () => syncRead<MaintenanceSettings>(() => db.maintenance),
      save: (patch: Partial<MaintenanceSettings>) => guard<MaintenanceSettings>(() => {
        requirePerm("settings.manage");
        Object.assign(db.maintenance, patch);
        audit("settings.maintenance", null, Object.keys(patch).map((field) => ({ field, from: null, to: String((patch as Record<string, unknown>)[field] ?? "updated") })));
        persistStorefront();
        return db.maintenance;
      }),
    },
    billing: {
      get: () => respond<MerchantBilling>(db.merchantBilling),
      /** Plan change / addon toggle / payment-method update — writes real state + audit. */
      save: (patch: Partial<Pick<MerchantBilling, "planId" | "monthlyPrice" | "paymentMethod">>) =>
        guard<MerchantBilling>(() => {
          Object.assign(db.merchantBilling, patch);
          db.audit.unshift({ id: uid("aud"), actor: me(), action: "billing.updated", target: null, changes: Object.keys(patch).map((field) => ({ field, from: null, to: "updated" })), ip: null, at: new Date().toISOString() });
          return db.merchantBilling;
        }),
      setAddon: (id: string, enabled: boolean) => guard<MerchantBilling>(() => {
        const addon = db.merchantBilling.addons.find((a) => a.id === id);
        if (!addon) throw new Error("addon not found");
        addon.enabled = enabled;
        db.audit.unshift({ id: uid("aud"), actor: me(), action: enabled ? "billing.addon_enabled" : "billing.addon_disabled", target: { type: "installation", id, label: addon.name.ar }, changes: [], ip: null, at: new Date().toISOString() });
        return db.merchantBilling;
      }),
    },
    verification: {
      get: () => respond<StoreVerification>(db.storeVerification),
      upload: (docId: string, fileName: string) => guard<StoreVerification>(() => {
        const doc = db.storeVerification.documents.find((d) => d.id === docId);
        if (!doc) throw new Error("doc not found");
        doc.fileName = fileName;
        doc.status = "uploaded";
        return db.storeVerification;
      }),
      submit: () => guard<StoreVerification>(() => {
        if (db.storeVerification.documents.some((d) => d.status === "missing")) throw new Error("missing_docs");
        db.storeVerification.status = "in_review";
        return db.storeVerification;
      }),
    },
    apiKeys: {
      list: () => respond<ApiKey[]>(db.apiKeys),
      /** Returns the full secret once — the list shows `prefix` only. */
      create: (input: { name: string; scopes: string[] }) => guard<{ key: ApiKey; secret: string }>(() => {
        const rand = Math.random().toString(36).slice(2, 10);
        const key: ApiKey = { id: uid("key"), name: input.name, scopes: input.scopes, prefix: `sk_live_${rand.slice(0, 4)}`, createdBy: me().name, lastUsedAt: null, expiresAt: null };
        db.apiKeys.unshift(key);
        return { key, secret: `sk_live_${rand}${uid("s").slice(-8)}` };
      }),
      revoke: (id: string) => guard<string>(() => {
        find(db.apiKeys, id, "api_key");
        db.apiKeys = db.apiKeys.filter((k) => k.id !== id);
        return id;
      }),
    },
    webhooks: {
      list: () => respond<WebhookSubscription[]>(db.storeWebhooks),
      create: (input: { url: string; events: string[] }) => guard<WebhookSubscription>(() => {
        if (!input.url.startsWith("https://")) throw new Error("url");
        const wh: WebhookSubscription = { id: uid("wh"), url: input.url, events: input.events, secret: `whsec_${Math.random().toString(36).slice(2, 12)}`, status: "active", deliveries: [] };
        db.storeWebhooks.unshift(wh);
        return wh;
      }),
      resend: (webhookId: string, deliveryId: string) => guard<WebhookSubscription>(() => {
        const wh = find(db.storeWebhooks, webhookId, "webhook");
        const d = wh.deliveries.find((x) => x.id === deliveryId);
        if (!d) throw new Error("delivery not found");
        d.attempt += 1;
        d.status = "succeeded";
        d.httpCode = 200;
        d.at = new Date().toISOString();
        return wh;
      }),
    },
    danger: {
      exportAll: () => respond<{ started: true }>({ started: true }),
      suspend: () => guard<Store>(() => {
        const s = db.stores[0];
        if (!s) throw new Error("store not found");
        s.status = "paused";
        return s;
      }),
      remove: () => guard<Store>(() => {
        const s = db.stores[0];
        if (!s) throw new Error("store not found");
        s.status = "suspended";
        return s;
      }),
    },
  },
};
