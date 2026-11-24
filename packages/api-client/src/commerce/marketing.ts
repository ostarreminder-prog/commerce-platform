import type {
  Coupon, Promotion,
} from "@repo/contracts";
import { money } from "@repo/contracts";
import type {
  CouponInput, PromotionInput,
} from "./types";
import { db, find, guard, me, respond, uid } from "./db";

export const marketingApi = {
  coupons: {
    list: () => respond<Coupon[]>(db.coupons),
    get: (id: string) => guard<Coupon>(() => find(db.coupons, id, "coupon")),
    save: (input: CouponInput) => guard(() => {
      if (!/^[A-Z0-9]+$/.test(input.code)) throw new Error("code");
      if (db.coupons.some((c) => c.code === input.code && c.id !== input.id)) throw new Error("taken");
      const status = (c?: Coupon): Coupon["status"] => {
        const now = Date.now();
        if (c?.status === "disabled") return "disabled";
        if (input.endsAt && new Date(input.endsAt).getTime() < now) return "expired";
        if (new Date(input.startsAt).getTime() > now) return "scheduled";
        return "active";
      };
      if (input.id) {
        const c = find(db.coupons, input.id, "coupon");
        Object.assign(c, { ...input, maxDiscount: input.maxDiscount == null ? null : money(input.maxDiscount), minOrderAmount: input.minOrderAmount == null ? null : money(input.minOrderAmount), status: status(c) });
        return c;
      }
      const c: Coupon = {
        id: uid("cpn"), ...input, maxDiscount: input.maxDiscount == null ? null : money(input.maxDiscount),
        minOrderAmount: input.minOrderAmount == null ? null : money(input.minOrderAmount), status: "active",
        stats: { uses: 0, revenue: money(0), discountGiven: money(0) },
        usages: [],
        createdBy: me(),
      };
      c.status = status(c);
      db.coupons.unshift(c);
      return c;
    }),
    setStatus: (id: string, disabled: boolean) => guard(() => {
      const c = find(db.coupons, id, "coupon");
      c.status = disabled ? "disabled" : new Date(c.startsAt).getTime() > Date.now() ? "scheduled" : c.endsAt && new Date(c.endsAt).getTime() < Date.now() ? "expired" : "active";
      return c;
    }),
    remove: (id: string) => guard(() => {
      db.coupons = db.coupons.filter((c) => c.id !== id);
      return { ok: true as const };
    }),
  },
  promotions: {
    list: () => respond<Promotion[]>(db.promotions),
    save: (input: PromotionInput) => guard(() => {
      const promoStatus = (c?: Promotion): Promotion["status"] => {
        const now = Date.now();
        if (c?.status === "disabled") return "disabled";
        if (input.endsAt && new Date(input.endsAt).getTime() < now) return "expired";
        if (new Date(input.startsAt).getTime() > now) return "scheduled";
        return "active";
      };
      if (input.id) {
        const p = find(db.promotions, input.id, "promotion");
        Object.assign(p, input, { status: promoStatus(p) });
        return p;
      }
      const p: Promotion = { id: uid("prm"), ...input, status: promoStatus(), stats: { orders: 0, revenue: money(0) }, createdBy: me() };
      db.promotions.unshift(p);
      return p;
    }),
    setStatus: (id: string, disabled: boolean) => guard(() => {
      const p = find(db.promotions, id, "promotion");
      p.status = disabled ? "disabled" : new Date(p.startsAt).getTime() > Date.now() ? "scheduled" : p.endsAt && new Date(p.endsAt).getTime() < Date.now() ? "expired" : "active";
      return p;
    }),
    remove: (id: string) => guard(() => {
      db.promotions = db.promotions.filter((p) => p.id !== id);
      return { ok: true as const };
    }),
  },
};
