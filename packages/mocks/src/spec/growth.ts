import type {
  Affiliate, AffiliateConversion, AffiliatePayout, DigitalAsset, DigitalDelivery, GiftCard, GiftCardTransaction,
  LoyaltyAccount, LoyaltySettings, LoyaltyTransaction, PriceList,
} from "@repo/contracts";
import { money } from "@repo/contracts";
import { daysAgo } from "../data/seed";

/* Growth-suite fixtures — loyalty, gift cards, affiliates, B2B price lists and
 * digital-product assets. Everything is demo data for the mock "server"; the
 * API layer mutates these rows like a real backend would. */

const staff = { type: "staff" as const, id: "stf_khalid", name: "خالد العتيبي" };
const _reem = { type: "staff" as const, id: "stf_reem", name: "ريم الحربي" };

/* ---- Loyalty program ---- */
export const loyaltySettings: LoyaltySettings = {
  enabled: true,
  earnRate: 1 /* 1 point per SAR */,
  redeemRate: 5 /* each point is worth 5 halalas → 20 points = 1 SAR */,
  expiryDays: 365,
  tiers: [
    { key: "bronze", name: { ar: "برونزي", en: "Bronze" }, minPoints: 0, perks: "كسب نقاط على كل طلب" },
    { key: "silver", name: { ar: "فضي", en: "Silver" }, minPoints: 500, perks: "شحن مجاني + نقاط مضاعفة في المناسبات" },
    { key: "gold", name: { ar: "ذهبي", en: "Gold" }, minPoints: 2000, perks: "خصومات حصرية + أولوية الدعم" },
  ],
};

const tierOf = (lifetime: number) => (lifetime >= 2000 ? "gold" : lifetime >= 500 ? "silver" : "bronze");

const account = (customerId: string, points: number, lifetimeEarned: number, at: string): LoyaltyAccount => ({
  customerId, points, lifetimeEarned, tier: tierOf(lifetimeEarned), updatedAt: at,
});

export const loyaltyAccounts: LoyaltyAccount[] = [
  account("cus_002", 1250, 2680, daysAgo(3, 15)),
  account("cus_005", 420, 920, daysAgo(6, 11)),
  account("cus_009", 185, 640, daysAgo(2, 19)),
  account("cus_014", 60, 210, daysAgo(1, 10)),
  account("cus_021", 940, 2140, daysAgo(4, 16)),
];

const ltxn = (
  id: string, customerId: string, type: LoyaltyTransaction["type"], points: number, note: string | null,
  orderNumber: number | null, at: string, balanceAfter: number,
): LoyaltyTransaction => ({
  id, customerId, type, points, note,
  reference: orderNumber ? { type: "order", id: `ord_${orderNumber}`, label: `#${orderNumber}` } : null,
  actor: staff, at, balanceAfter,
});

export const loyaltyTransactions: LoyaltyTransaction[] = [
  ltxn("loy_1", "cus_002", "earn", 480, null, 10287, daysAgo(9, 13), 2200),
  ltxn("loy_2", "cus_002", "redeem", -1000, "خصم على طلب يدوي", 10290, daysAgo(4, 12), 1200),
  ltxn("loy_3", "cus_002", "earn", 50, null, 10291, daysAgo(3, 15), 1250),
  ltxn("loy_4", "cus_005", "earn", 320, null, 10285, daysAgo(8, 10), 400),
  ltxn("loy_5", "cus_005", "adjust", 20, "تعويض عن تأخر شحنة", null, daysAgo(6, 11), 420),
  ltxn("loy_6", "cus_009", "earn", 640, null, 10280, daysAgo(12, 14), 640),
  ltxn("loy_7", "cus_009", "expire", -455, "انتهاء صلاحية النقاط", null, daysAgo(2, 19), 185),
  ltxn("loy_8", "cus_014", "earn", 210, null, 10278, daysAgo(14, 16), 210),
  ltxn("loy_9", "cus_014", "redeem", -150, "خصم على طلب يدوي", null, daysAgo(1, 10), 60),
  ltxn("loy_10", "cus_021", "earn", 740, null, 10284, daysAgo(7, 9), 940),
];

/* ---- Gift cards ---- */
const gcard = (
  id: string, code: string, initial: number, balance: number, customerId: string | null,
  status: GiftCard["status"], expiresAt: string | null, createdAt: string,
): GiftCard => ({ id, code, initialBalance: money(initial), balance: money(balance), customerId, status, expiresAt, issuedBy: staff, createdAt });

export const giftCards: GiftCard[] = [
  gcard("gc_01", "GIFT-NAKHLA-100", 100_00, 100_00, null, "active", daysAgo(-180), daysAgo(20, 10)),
  gcard("gc_02", "GIFT-EID-500", 500_00, 275_00, "cus_002", "partially_used", daysAgo(-90), daysAgo(35, 12)),
  gcard("gc_03", "GIFT-VIP-250", 250_00, 0, "cus_005", "redeemed", daysAgo(-30), daysAgo(60, 9)),
  gcard("gc_04", "GIFT-PROMO-50", 50_00, 50_00, null, "deactivated", null, daysAgo(15, 14)),
];

const gtxn = (
  id: string, cardId: string, type: GiftCardTransaction["type"], amount: number, orderId: string | null,
  note: string | null, at: string, balanceAfter: number,
): GiftCardTransaction => ({ id, cardId, type, amount, orderId, note, actor: staff, at, balanceAfter: money(balanceAfter) });

export const giftCardTransactions: GiftCardTransaction[] = [
  gtxn("gtx_1", "gc_01", "issue", 100_00, null, null, daysAgo(20, 10), 100_00),
  gtxn("gtx_2", "gc_02", "issue", 500_00, null, null, daysAgo(35, 12), 500_00),
  gtxn("gtx_3", "gc_02", "redeem", -225_00, "ord_10288", "استخدام جزئي في الطلب #10288", daysAgo(10, 15), 275_00),
  gtxn("gtx_4", "gc_03", "issue", 250_00, null, null, daysAgo(60, 9), 250_00),
  gtxn("gtx_5", "gc_03", "redeem", -250_00, "ord_10282", "استخدام كامل في الطلب #10282", daysAgo(40, 13), 0),
  gtxn("gtx_6", "gc_04", "issue", 50_00, null, null, daysAgo(15, 14), 50_00),
  gtxn("gtx_7", "gc_04", "deactivate", 0, null, "بطاقة ترويجية منتهية الحملة", daysAgo(5, 11), 50_00),
];

/* ---- Affiliates ---- */
const aff = (id: string, name: string, email: string | null, code: string, status: Affiliate["status"], commissionRate: number,
  clicks: number, orders: number, revenue: number, commission: number, createdAt: string): Affiliate => ({
  id, name, email, code, status, commissionRate,
  stats: { clicks, orders, revenue: money(revenue), commission: money(commission) }, createdAt,
});

export const affiliates: Affiliate[] = [
  aff("aff_01", "نورة للتسويق", "noura@aff.sa", "NOURA10", "active", 10, 1240, 9, 38_400_00 / 100, 3_840_00 / 100, daysAgo(90, 10)),
  aff("aff_02", "متجر التقنية", "tech@aff.sa", "TECH5", "active", 5, 860, 5, 21_250_00 / 100, 1_062_50 / 100, daysAgo(60, 12)),
  aff("aff_03", "مدونة عالم العطور", null, "OUD15", "paused", 15, 320, 2, 9_600_00 / 100, 1_440_00 / 100, daysAgo(120, 14)),
];

export const affiliateConversions: AffiliateConversion[] = [
  { id: "acv_1", affiliateId: "aff_01", orderId: "ord_10285", orderNumber: 10285, total: money(32_000), commission: money(3_200), at: daysAgo(8, 10) },
  { id: "acv_2", affiliateId: "aff_01", orderId: "ord_10288", orderNumber: 10288, total: money(45_000), commission: money(4_500), at: daysAgo(10, 15) },
  { id: "acv_3", affiliateId: "aff_02", orderId: "ord_10290", orderNumber: 10290, total: money(21_250), commission: money(1_062), at: daysAgo(3, 12) },
  { id: "acv_4", affiliateId: "aff_03", orderId: "ord_10280", orderNumber: 10280, total: money(9_600), commission: money(1_440), at: daysAgo(12, 14) },
];

export const affiliatePayouts: AffiliatePayout[] = [
  { id: "apx_1", affiliateId: "aff_01", amount: money(20_000), status: "paid", note: "دفعة شهر شوال", createdAt: daysAgo(20, 10), paidAt: daysAgo(18, 12) },
  { id: "apx_2", affiliateId: "aff_01", amount: money(7_700), status: "pending", note: null, createdAt: daysAgo(4, 11), paidAt: null },
];

/* ---- B2B / wholesale price lists ---- */
export const priceLists: PriceList[] = [
  {
    id: "pl_01", name: { ar: "أسعار الجملة — شركاء", en: "Wholesale — Partners" }, status: "active",
    customerIds: ["cus_002", "cus_021"],
    rules: [{ id: "plr_1", variantId: null, percentOff: 15, fixedPrice: null }],
    createdAt: daysAgo(45, 10),
  },
  {
    id: "pl_02", name: { ar: "سعر خاص — قهوة الهيل", en: "Special price — Cardamom Coffee" }, status: "active",
    customerIds: ["cus_005"],
    rules: [{ id: "plr_2", variantId: "var_001", percentOff: null, fixedPrice: money(55_00) }],
    createdAt: daysAgo(20, 13),
  },
];

/* ---- Digital product deliverables ---- */
export const digitalAssets: DigitalAsset[] = [
  {
    id: "dga_1", productId: "prd_031", variantId: null, name: "بطاقة الهدية — رابط الاستلام",
    kind: "link", mediaId: null, url: "https://gift.nakhla.sa/claim", sizeBytes: null, createdAt: daysAgo(30, 10),
  },
];

export const digitalDeliveries: DigitalDelivery[] = [];
