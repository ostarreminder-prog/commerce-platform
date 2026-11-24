import type {
  DigitalAsset, DigitalDelivery, GiftCard, GiftCardTransaction,
  LoyaltyAccount, LoyaltySettings, LoyaltyTransaction, Order,
} from "@repo/contracts";
import { money } from "@repo/contracts";
import { audit, db, find, guard, me, requirePerm, respond, uid } from "./db";

/* ============================================================================
 * Growth-suite mock "server" (part 1) — loyalty, gift cards and digital
 * fulfilment. Affiliates and B2B price lists live in growth-b2b.ts.
 * Reads gate on the domain read-perm, mutations on marketing.manage —
 * matching the route permissions of their screens.
 * ========================================================================== */

const cardRef = (c: GiftCard) => ({ type: "coupon" as const, id: c.id, label: c.code });
const orderRef = (o: Order) => ({ type: "order" as const, id: o.id, label: `#${o.number}` });

/* ---- loyalty internals ---- */
export const tierFor = (lifetime: number, s: LoyaltySettings): LoyaltyAccount["tier"] =>
  [...s.tiers].sort((a, b) => b.minPoints - a.minPoints).find((t) => lifetime >= t.minPoints)?.key ?? "bronze";

const accountFor = (customerId: string): LoyaltyAccount => {
  let acc = db.loyaltyAccounts.find((a) => a.customerId === customerId);
  if (!acc) {
    acc = { customerId, points: 0, lifetimeEarned: 0, tier: tierFor(0, db.loyaltySettings), updatedAt: new Date().toISOString() };
    db.loyaltyAccounts.push(acc);
  }
  return acc;
};

const pushLoyaltyTxn = (
  customerId: string, type: LoyaltyTransaction["type"], points: number,
  opts: { note?: string | null; reference?: LoyaltyTransaction["reference"]; actor?: LoyaltyTransaction["actor"] } = {},
): LoyaltyTransaction => {
  const acc = accountFor(customerId);
  acc.points = Math.max(0, acc.points + points);
  if (points > 0) acc.lifetimeEarned += points;
  acc.tier = tierFor(acc.lifetimeEarned, db.loyaltySettings);
  acc.updatedAt = new Date().toISOString();
  const t: LoyaltyTransaction = {
    id: uid("loy"), customerId, type, points, note: opts.note ?? null, reference: opts.reference ?? null,
    actor: opts.actor ?? me(), at: new Date().toISOString(), balanceAfter: acc.points,
  };
  db.loyaltyTransactions.unshift(t);
  return t;
};

/** Awards points for a delivered order — idempotent per order (the earn txn
 * doubles as the marker). Called from the delivered transitions in orders.ts. */
export const awardLoyalty = (o: Order) => {
  const s = db.loyaltySettings;
  if (!s.enabled) return;
  if (db.loyaltyTransactions.some((t) => t.type === "earn" && t.reference?.id === o.id)) return;
  const points = Math.floor((o.total.amount / 100) * s.earnRate);
  if (points <= 0) return;
  pushLoyaltyTxn(o.customerId, "earn", points, { reference: orderRef(o) });
};

/** Burns points as an order discount — throws when the balance can't cover.
 * Called from orders.create before totals are computed. */
export const redeemLoyalty = (customerId: string, points: number, o: Order): number => {
  if (points <= 0) return 0;
  const acc = db.loyaltyAccounts.find((a) => a.customerId === customerId);
  if (!acc || acc.points < points) throw new Error("insufficient_points");
  const value = Math.round(points * db.loyaltySettings.redeemRate);
  pushLoyaltyTxn(customerId, "redeem", -points, { reference: orderRef(o) });
  return value;
};

/* ---- gift card internals ---- */
const cardTxn = (
  cardId: string, type: GiftCardTransaction["type"], amount: number,
  opts: { orderId?: string | null; note?: string | null; actor?: GiftCardTransaction["actor"] } = {},
): GiftCardTransaction => {
  const c = find(db.giftCards, cardId, "gift_card");
  const t: GiftCardTransaction = {
    id: uid("gtx"), cardId, type, amount, orderId: opts.orderId ?? null, note: opts.note ?? null,
    actor: opts.actor ?? me(), at: new Date().toISOString(), balanceAfter: c.balance,
  };
  db.giftCardTransactions.unshift(t);
  return t;
};

const refreshCardStatus = (c: GiftCard) => {
  if (c.status === "deactivated") return;
  if (c.expiresAt && +new Date(c.expiresAt) < Date.now()) { c.status = "expired"; return; }
  c.status = c.balance.amount <= 0 ? "redeemed" : c.balance.amount < c.initialBalance.amount ? "partially_used" : "active";
};

/** Deducts from a gift card for an order — partial redemption keeps the rest.
 * Returns the amount actually applied in halalas. Idempotent by (card,order). */
export const redeemGiftCard = (code: string, o: Order, maxAmount: number): number => {
  const c = db.giftCards.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
  if (!c) throw new Error("gift_card_not_found");
  refreshCardStatus(c);
  if (c.status === "deactivated") throw new Error("gift_card_deactivated");
  if (c.status === "expired") throw new Error("gift_card_expired");
  const existing = db.giftCardTransactions.find((t) => t.cardId === c.id && t.orderId === o.id && t.type === "redeem");
  if (existing) return -existing.amount;
  const applied = Math.min(c.balance.amount, maxAmount);
  if (applied <= 0) throw new Error("gift_card_empty");
  c.balance = money(c.balance.amount - applied);
  cardTxn(c.id, "redeem", -applied, { orderId: o.id, note: `الطلب #${o.number}` });
  refreshCardStatus(c);
  return applied;
};

/** Credits back whatever a card paid toward a cancelled/refunded order —
 * the "adjust" txn restores the balance so the card is reusable. */
export const restoreGiftCard = (o: Order) => {
  db.giftCardTransactions
    .filter((t) => t.orderId === o.id && t.type === "redeem")
    .forEach((t) => {
      const c = db.giftCards.find((x) => x.id === t.cardId);
      if (!c) return;
      const back = -t.amount;
      c.balance = money(c.balance.amount + back);
      cardTxn(c.id, "adjust", back, { orderId: o.id, note: `استرجاع رصيد الطلب #${o.number}` });
      refreshCardStatus(c);
    });
};

export interface GiftCardInput {
  code?: string;
  initialBalance: number;
  customerId: string | null;
  expiresAt: string | null;
}

export const growthApi = {
  loyalty: {
    settings: () => respond<LoyaltySettings>(db.loyaltySettings),
    saveSettings: (patch: Partial<LoyaltySettings>) => guard<LoyaltySettings>(() => {
      requirePerm("marketing.manage");
      Object.assign(db.loyaltySettings, patch);
      db.loyaltyAccounts.forEach((a) => (a.tier = tierFor(a.lifetimeEarned, db.loyaltySettings)));
      audit("loyalty.settings_updated", null, Object.keys(patch).map((field) => ({ field, from: null, to: "updated" })));
      return db.loyaltySettings;
    }),
    accounts: () => guard<LoyaltyAccount[]>(() => { requirePerm("customers.read"); return db.loyaltyAccounts; }),
    accountFor: (customerId: string) => guard<LoyaltyAccount | null>(() => {
      requirePerm("customers.read");
      return db.loyaltyAccounts.find((a) => a.customerId === customerId) ?? null;
    }),
    transactions: (customerId?: string) => guard<LoyaltyTransaction[]>(() => {
      requirePerm("customers.read");
      return customerId ? db.loyaltyTransactions.filter((t) => t.customerId === customerId) : db.loyaltyTransactions;
    }),
    adjust: (customerId: string, points: number, note: string) => guard<LoyaltyTransaction>(() => {
      requirePerm("marketing.manage");
      find(db.customers, customerId, "customer");
      if (!points) throw new Error("points");
      if (!note.trim()) throw new Error("note");
      const t = pushLoyaltyTxn(customerId, "adjust", points, { note: note.trim() });
      audit("loyalty.adjusted", { type: "customer", id: customerId }, [{ field: "points", from: null, to: String(points) }]);
      return t;
    }),
  },
  giftCards: {
    list: () => guard<GiftCard[]>(() => {
      requirePerm("marketing.manage");
      db.giftCards.forEach(refreshCardStatus);
      return db.giftCards;
    }),
    get: (id: string) => guard<GiftCard>(() => {
      requirePerm("marketing.manage");
      const c = find(db.giftCards, id, "gift_card");
      refreshCardStatus(c);
      return c;
    }),
    transactions: (cardId: string) => guard<GiftCardTransaction[]>(() => {
      requirePerm("marketing.manage");
      return db.giftCardTransactions.filter((t) => t.cardId === cardId);
    }),
    issue: (input: GiftCardInput) => guard<GiftCard>(() => {
      requirePerm("marketing.manage");
      if (input.initialBalance <= 0) throw new Error("amount");
      const code = (input.code?.trim() || `GIFT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`).toUpperCase();
      if (!/^[A-Z0-9-]+$/.test(code)) throw new Error("code");
      if (db.giftCards.some((c) => c.code === code)) throw new Error("taken");
      if (input.customerId) find(db.customers, input.customerId, "customer");
      const c: GiftCard = {
        id: uid("gc"), code, initialBalance: money(input.initialBalance), balance: money(input.initialBalance),
        customerId: input.customerId, status: "active", expiresAt: input.expiresAt, issuedBy: me(), createdAt: new Date().toISOString(),
      };
      db.giftCards.unshift(c);
      cardTxn(c.id, "issue", input.initialBalance, {});
      audit("gift_card.issued", cardRef(c), [{ field: "balance", from: null, to: String(input.initialBalance) }]);
      return c;
    }),
    deactivate: (id: string) => guard<GiftCard>(() => {
      requirePerm("marketing.manage");
      const c = find(db.giftCards, id, "gift_card");
      if (c.status === "deactivated") throw new Error("already");
      c.status = "deactivated";
      cardTxn(c.id, "deactivate", 0, {});
      audit("gift_card.deactivated", cardRef(c));
      return c;
    }),
    /** Public balance check — no manage perm: the storefront checkout and the
     * admin manual-order screen both call it with just the code. */
    checkBalance: (code: string) => guard<{ code: string; balance: number; status: GiftCard["status"] }>(() => {
      const c = db.giftCards.find((x) => x.code.toLowerCase() === code.trim().toLowerCase());
      if (!c) throw new Error("gift_card_not_found");
      refreshCardStatus(c);
      return { code: c.code, balance: c.balance.amount, status: c.status };
    }),
  },
  digital: {
    assetsFor: (productId: string) => respond<DigitalAsset[]>(db.digitalAssets.filter((a) => a.productId === productId)),
    /** Replaces the asset set of a product — editor saves name/kind/url rows. */
    saveAssets: (productId: string, assets: Omit<DigitalAsset, "id" | "productId" | "createdAt">[]) => guard<DigitalAsset[]>(() => {
      requirePerm("products.manage");
      const p = find(db.products, productId, "product");
      if (p.requiresShipping) throw new Error("not_digital");
      assets.forEach((a) => { if (!a.name.trim()) throw new Error("name"); if (a.kind === "link" && !a.url.trim()) throw new Error("url"); });
      const kept = db.digitalAssets.filter((a) => a.productId !== productId);
      const next = assets.map((a) => ({ ...a, id: uid("dga"), productId, createdAt: new Date().toISOString() }));
      db.digitalAssets = [...kept, ...next];
      audit("product.digital_assets", { type: "product", id: productId, label: p.name.ar }, [{ field: "assets", from: null, to: String(next.length) }]);
      return next;
    }),
    deliveriesFor: (orderId: string) => respond<DigitalDelivery[]>(db.digitalDeliveries.filter((d) => d.orderId === orderId)),
    /** Customer-facing: files for one of their orders (storefront account). */
    deliveriesForCustomer: (customerId: string) =>
      respond<DigitalDelivery[]>(
        (() => {
          const orderIds = new Set(db.orders.filter((o) => o.customerId === customerId).map((o) => o.id));
          return db.digitalDeliveries.filter((d) => orderIds.has(d.orderId));
        })(),
      ),
  },
};

/** Creates DigitalDelivery rows for the paid digital lines of an order —
 * idempotent per order item. Called when the order is paid or delivered. */
export const deliverDigital = (o: Order) => {
  o.items.forEach((it) => {
    if (db.digitalDeliveries.some((d) => d.orderId === o.id && d.orderItemId === it.id)) return;
    const assets = db.digitalAssets.filter((a) => a.productId === it.productId && (a.variantId === null || a.variantId === it.variantId));
    if (!assets.length) return;
    assets.forEach((a) => {
      db.digitalDeliveries.push({
        id: uid("dgd"), orderId: o.id, orderItemId: it.id, assetId: a.id, name: a.name,
        url: a.kind === "link" ? a.url : `#file:${a.mediaId ?? a.id}`, deliveredAt: new Date().toISOString(),
      });
    });
  });
};
