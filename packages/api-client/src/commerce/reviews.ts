import type {
  App, AppInstallation, Review, ReviewStatus,
} from "@repo/contracts";
import { spec } from "@repo/mocks";
import { db, find, guard, me, respond, uid } from "./db";

export const reviewsApi = {
  reviews: {
    listAll: () => respond<Review[]>(db.reviews),
    listByProduct: (productId: string) => respond<Review[]>(db.reviews.filter((r) => r.productId === productId)),
    create: (input: { productId: string; customerId: string; rating: number; text: string; images?: string[] }) => guard<Review>(() => {
      find(db.products, input.productId, "product");
      if (!input.text.trim()) throw new Error("text");
      const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
      const verified = db.orders.some(
        (o) => o.customerId === input.customerId && o.fulfillmentStatus === "delivered" && o.items.some((i) => i.productId === input.productId),
      );
      const r: Review = {
        id: uid("rev"), productId: input.productId, customerId: input.customerId, rating, text: input.text.trim(),
        images: input.images?.length ? input.images.slice(0, 5) : undefined, verifiedPurchase: verified,
        status: "pending", createdAt: new Date().toISOString(),
      };
      db.reviews.unshift(r);
      return r;
    }),
    setStatus: (id: string, status: ReviewStatus) => guard(() => Object.assign(find(db.reviews, id, "review"), { status })),
    reply: (id: string, text: string) => guard(() => {
      const r = find(db.reviews, id, "review");
      if (!text.trim()) throw new Error("text");
      r.merchantReply = { text: text.trim(), at: new Date().toISOString() };
      return r;
    }),
  },
  apps: {
    list: () => respond<App[]>(db.apps.filter((a) => a.status === "approved")),
    get: (id: string) => guard<App>(() => find(db.apps, id, "app")),
  },
  appInstallations: {
    list: () => respond<AppInstallation[]>(db.appInstallations),
    get: (id: string) => guard<AppInstallation>(() => find(db.appInstallations, id, "installation")),
    install: (appId: string) => guard(() => {
      const a = find(db.apps, appId, "app");
      const existing = db.appInstallations.find((x) => x.appId === appId && x.status === "active");
      if (existing) return existing;
      const ins: AppInstallation = {
        id: uid("ins"), appId, grantedScopes: [...a.scopes], installedBy: spec.currentStaff.id,
        installedAt: new Date().toISOString(), lastActivityAt: null, status: "active",
      };
      db.appInstallations.unshift(ins);
      db.audit.unshift({ id: uid("aud"), actor: me(), action: "app.installed", target: { type: "installation", id: ins.id, label: a.name.ar }, changes: [], ip: null, at: new Date().toISOString() });
      return ins;
    }),
    /** Post-install credentials/config — persisted on the installation. */
    configure: (id: string, settings: Record<string, string>) => guard(() => {
      const ins = find(db.appInstallations, id, "installation");
      ins.settings = settings;
      return ins;
    }),
    /**
     * "Test connection" — an honest simulated check: it verifies the stored
     * credentials are complete (empty config fails), then flips
     * `connectionStatus`. The UI labels the result as a simulated check since
     * no real provider handshake exists.
     */
    testConnection: (id: string) => guard(() => {
      const ins = find(db.appInstallations, id, "installation");
      const settings = ins.settings ?? {};
      const ok = Object.keys(settings).length > 0 && Object.values(settings).every((v) => v.trim().length > 0);
      ins.connectionStatus = ok ? "ok" : "failed";
      ins.lastActivityAt = new Date().toISOString();
      return ins;
    }),
    /** Suspend/resume an active installation. */
    setStatus: (id: string, status: "active" | "suspended") => guard(() => {
      const ins = find(db.appInstallations, id, "installation");
      if (ins.status === "uninstalled") throw new Error("uninstalled");
      ins.status = status;
      return ins;
    }),
    uninstall: (id: string) => guard(() => {
      const ins = find(db.appInstallations, id, "installation");
      ins.status = "uninstalled";
      const a = db.apps.find((x) => x.id === ins.appId);
      db.audit.unshift({ id: uid("aud"), actor: me(), action: "app.uninstalled", target: { type: "installation", id: ins.id, label: a?.name.ar ?? ins.appId }, changes: [], ip: null, at: new Date().toISOString() });
      return ins;
    }),
  },
};
