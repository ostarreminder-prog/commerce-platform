import type { PartnerApp } from "@repo/contracts";
import { spec } from "@repo/mocks";
import { db, respond, uid } from "./db";

/* Developer-portal surface (apps/partners) —
 * the namespace formerly served by `legacyApi.partners`. */
export const partnerApi = {
  summary: () => respond(spec.partnerSummary),
  apps: () => respond(db.partnerApps),
  app: (id: string) => respond(db.partnerApps.find((a) => a.id === id) ?? null),
  saveApp: (app: PartnerApp) => {
    const index = db.partnerApps.findIndex((a) => a.id === app.id);
    if (index >= 0) db.partnerApps[index] = app;
    else db.partnerApps.unshift(app);
    return respond(app);
  },
  webhook: (appId: string) =>
    respond(
      db.webhooks[appId] ?? {
        id: `wh_${appId}`,
        url: "",
        events: [],
        secret: null,
        status: "active" as const,
        deliveries: [],
      },
    ),
  saveWebhook: (appId: string, patch: { url?: string; events?: string[] }) => {
    const wh =
      db.webhooks[appId] ??
      (db.webhooks[appId] = {
        id: `wh_${appId}`,
        url: "",
        events: [],
        secret: null,
        status: "active" as const,
        deliveries: [],
      });
    Object.assign(wh, patch);
    if (patch.url !== undefined) {
      const app = db.partnerApps.find((a) => a.id === appId);
      if (app) app.webhookUrl = patch.url;
    }
    return respond(wh);
  },
  testStores: () => respond(db.testStores),
  createTestStore: (name: string) => {
    const store = {
      id: uid("tst"),
      name,
      url: `https://sandbox-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "store"}.dev.tajer.sa`,
      createdAt: new Date().toISOString(),
    };
    db.testStores.unshift(store);
    return respond(store);
  },
  deleteTestStore: (id: string) => {
    db.testStores = db.testStores.filter((s) => s.id !== id);
    return respond(id);
  },
};
