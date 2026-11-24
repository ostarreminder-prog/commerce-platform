import type { Affiliate, AffiliateConversion, AffiliatePayout, Order, PriceList } from "@repo/contracts";
import { money } from "@repo/contracts";
import { audit, db, find, guard, requirePerm, respond, uid } from "./db";

/* ============================================================================
 * Growth-suite mock "server" (part 2) — affiliates and B2B/wholesale price
 * lists. Mutations gate on marketing.manage / products.manage respectively.
 * ========================================================================== */

const affiliateRef = (a: Affiliate) => ({ type: "staff" as const, id: a.id, label: a.name });

/** Attributes an order to an affiliate code — idempotent per order. */
export const attributeOrder = (code: string, o: Order) => {
  const a = db.affiliates.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
  if (!a) throw new Error("affiliate_not_found");
  if (a.status !== "active") throw new Error("affiliate_inactive");
  if (db.affiliateConversions.some((c) => c.orderId === o.id)) return;
  const commission = Math.round((o.total.amount * a.commissionRate) / 100);
  db.affiliateConversions.unshift({
    id: uid("acv"), affiliateId: a.id, orderId: o.id, orderNumber: o.number,
    total: o.total, commission: money(commission), at: new Date().toISOString(),
  });
  a.stats.orders += 1;
  a.stats.revenue = money(a.stats.revenue.amount + o.total.amount);
  a.stats.commission = money(a.stats.commission.amount + commission);
};

/** Resolves the unit price (halalas) a customer should pay for a variant.
 * Precedence: the first active list containing the customer, then the most
 * specific rule (per-variant fixed → per-variant percent → wildcard). */
export const resolvePrice = (customerId: string, variantId: string, basePrice: number): { price: number; listId: string } | null => {
  const lists = db.priceLists.filter((l) => l.status === "active" && l.customerIds.includes(customerId));
  for (const list of lists) {
    const specific = list.rules.filter((r) => r.variantId === variantId);
    const wildcard = list.rules.filter((r) => r.variantId === null);
    const rules = [...specific, ...wildcard];
    for (const r of rules) {
      if (r.fixedPrice) return { price: r.fixedPrice.amount, listId: list.id };
      if (r.percentOff != null) return { price: Math.round(basePrice * (1 - r.percentOff / 100)), listId: list.id };
    }
  }
  return null;
};

export interface AffiliateInput {
  id?: string;
  name: string;
  email: string | null;
  code: string;
  commissionRate: number;
}

export interface PriceListInput {
  id?: string;
  name: { ar: string; en?: string };
  customerIds: string[];
  rules: { id?: string; variantId: string | null; percentOff: number | null; fixedPrice: number | null }[];
}

export const growthB2bApi = {
  affiliates: {
    list: () => guard<Affiliate[]>(() => { requirePerm("marketing.manage"); return db.affiliates; }),
    get: (id: string) => guard<Affiliate>(() => { requirePerm("marketing.manage"); return find(db.affiliates, id, "affiliate"); }),
    save: (input: AffiliateInput) => guard<Affiliate>(() => {
      requirePerm("marketing.manage");
      if (!input.name.trim()) throw new Error("name");
      const code = input.code.trim().toUpperCase();
      if (!/^[A-Z0-9]+$/.test(code)) throw new Error("code");
      if (db.affiliates.some((a) => a.code === code && a.id !== input.id)) throw new Error("taken");
      if (input.id) {
        const a = find(db.affiliates, input.id, "affiliate");
        Object.assign(a, { name: input.name.trim(), email: input.email?.trim() || null, code, commissionRate: input.commissionRate });
        audit("affiliate.updated", affiliateRef(a));
        return a;
      }
      const a: Affiliate = {
        id: uid("aff"), name: input.name.trim(), email: input.email?.trim() || null, code, status: "active",
        commissionRate: input.commissionRate, stats: { clicks: 0, orders: 0, revenue: money(0), commission: money(0) },
        createdAt: new Date().toISOString(),
      };
      db.affiliates.unshift(a);
      audit("affiliate.created", affiliateRef(a));
      return a;
    }),
    setStatus: (id: string, status: Affiliate["status"]) => guard<Affiliate>(() => {
      requirePerm("marketing.manage");
      const a = find(db.affiliates, id, "affiliate");
      a.status = status;
      audit(status === "paused" ? "affiliate.paused" : "affiliate.resumed", affiliateRef(a), [{ field: "status", to: status, from: null }]);
      return a;
    }),
    conversions: (affiliateId?: string) => guard<AffiliateConversion[]>(() => {
      requirePerm("marketing.manage");
      return affiliateId ? db.affiliateConversions.filter((c) => c.affiliateId === affiliateId) : db.affiliateConversions;
    }),
    payouts: (affiliateId?: string) => guard<AffiliatePayout[]>(() => {
      requirePerm("marketing.manage");
      return affiliateId ? db.affiliatePayouts.filter((p) => p.affiliateId === affiliateId) : db.affiliatePayouts;
    }),
    createPayout: (affiliateId: string, amount: number, note?: string) => guard<AffiliatePayout>(() => {
      requirePerm("marketing.manage");
      const a = find(db.affiliates, affiliateId, "affiliate");
      if (amount <= 0) throw new Error("amount");
      const p: AffiliatePayout = { id: uid("apx"), affiliateId, amount: money(amount), status: "pending", note: note?.trim() || null, createdAt: new Date().toISOString(), paidAt: null };
      db.affiliatePayouts.unshift(p);
      audit("affiliate.payout_created", affiliateRef(a), [{ field: "amount", from: null, to: String(amount) }]);
      return p;
    }),
    markPayoutPaid: (id: string) => guard<AffiliatePayout>(() => {
      requirePerm("marketing.manage");
      const p = find(db.affiliatePayouts, id, "payout");
      if (p.status === "paid") return p;
      p.status = "paid";
      p.paidAt = new Date().toISOString();
      audit("affiliate.payout_paid", affiliateRef(find(db.affiliates, p.affiliateId, "affiliate")), [{ field: "amount", from: null, to: String(p.amount.amount) }]);
      return p;
    }),
    /** Simulated click — tracks a storefront referral landing (honest counter). */
    trackClick: (code: string) => guard<{ ok: true }>(() => {
      const a = db.affiliates.find((x) => x.code.toLowerCase() === code.trim().toLowerCase() && x.status === "active");
      if (a) a.stats.clicks += 1;
      return { ok: true as const };
    }),
  },
  priceLists: {
    list: () => guard<PriceList[]>(() => { requirePerm("products.read"); return db.priceLists; }),
    get: (id: string) => guard<PriceList>(() => { requirePerm("products.read"); return find(db.priceLists, id, "price_list"); }),
    save: (input: PriceListInput) => guard<PriceList>(() => {
      requirePerm("products.manage");
      if (!input.name.ar.trim()) throw new Error("name");
      const rules = input.rules.map((r, i) => ({
        id: r.id ?? uid(`plr${i}`), variantId: r.variantId,
        percentOff: r.fixedPrice == null ? r.percentOff : null,
        fixedPrice: r.fixedPrice == null ? null : money(r.fixedPrice),
      }));
      if (!rules.length) throw new Error("rules");
      rules.forEach((r) => {
        if (r.percentOff != null && (r.percentOff <= 0 || r.percentOff > 100)) throw new Error("percent");
        if (r.fixedPrice != null && r.fixedPrice.amount < 0) throw new Error("price");
      });
      input.customerIds.forEach((id) => find(db.customers, id, "customer"));
      if (input.id) {
        const l = find(db.priceLists, input.id, "price_list");
        Object.assign(l, { name: input.name, customerIds: input.customerIds, rules });
        audit("price_list.updated", { type: "product", id: l.id, label: l.name.ar });
        return l;
      }
      const l: PriceList = { id: uid("pl"), name: input.name, status: "active", customerIds: input.customerIds, rules, createdAt: new Date().toISOString() };
      db.priceLists.unshift(l);
      audit("price_list.created", { type: "product", id: l.id, label: l.name.ar });
      return l;
    }),
    setStatus: (id: string, status: PriceList["status"]) => guard<PriceList>(() => {
      requirePerm("products.manage");
      const l = find(db.priceLists, id, "price_list");
      l.status = status;
      audit("price_list.status", { type: "product", id: l.id, label: l.name.ar }, [{ field: "status", to: status, from: null }]);
      return l;
    }),
    remove: (id: string) => guard<{ ok: true }>(() => {
      requirePerm("products.manage");
      const l = find(db.priceLists, id, "price_list");
      db.priceLists = db.priceLists.filter((x) => x.id !== id);
      audit("price_list.deleted", { type: "product", id, label: l.name.ar });
      return { ok: true };
    }),
    /** Same precedence the manual-order screen relies on — exposed so UIs can
     * preview the resolved price before submitting. */
    resolvePrice: (customerId: string, variantId: string) =>
      respond<{ price: number; listId: string } | null>(
        (() => {
          const v = db.products.flatMap((p) => p.variants).find((x) => x.id === variantId);
          return v ? resolvePrice(customerId, variantId, v.price.amount) : null;
        })(),
      ),
  },
};
