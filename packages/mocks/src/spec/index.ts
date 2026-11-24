import type { Coupon as CouponT } from "@repo/contracts";
import type {
  AbandonedCart, ActorRef, Address, AdminNotification, AgentApproval, App, AppInstallation, AuditLog, BackInStockSubscription, Brand, CartSource, Category, Collection, Conversation,
  CopilotConversation, CopilotSettings, CopilotTask,
  ConversationStatus, Customer, CustomerSegment, FulfillmentStatus, ImportJob, InventoryLevel, InventoryMovement, Invoice, Location, Message,
  HomeAnalytics, Media, Order, OrderChannel, OrderEvent, OrderItem, OrderStatus, Payment, PaymentMethod, PaymentStatus, Product, Promotion, RecoveryTemplate, Refund, Return, ReturnEvent, ReturnPolicySettings, ReturnStatus, Review, Role,
  SaudiCity, Shipment, ShipmentStatus, Staff, Store, Variant,
} from "@repo/contracts";
import { DEFAULT_ROLES, SAUDI_CITIES, money, type DefaultRoleKey } from "@repo/contracts";
import * as seed from "./seed";
import { districts } from "./seed";
import { daysAgo, minutesAgo } from "../data/seed";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const phone = (local: string) => `+966${local.replace(/^0/, "")}`;
const media = (id: string, hue: number, alt: string) => ({ id, url: `placeholder:${hue}`, alt: { ar: alt }, width: 800, height: 800 });
const VAT = 0.15;

/* Store & team */
const nationalAddress = (city: SaudiCity, district: string, name: string, tel: string): Address => ({
  id: "addr_store", label: null, recipientName: name, phone: tel, city, district, street: "طريق الملك فهد", buildingNumber: "7421",
  additionalNumber: "3318", postalCode: "12271", shortAddress: "RRRD7421", location: { lat: 24.7136, lng: 46.6753 }, notes: null, isDefault: true,
});

function makeStore(id: string, slug: string, ar: string, en: string, industry: Store["industry"], plan: string, status: Store["status"]): Store {
  const tel = "+966114567890";
  return {
    id, slug, name: { ar, en }, logo: null, favicon: null, industry, contactPhone: tel, contactEmail: `hello@${slug}.sa`,
    whatsappNumber: "+966555123456", socialLinks: { instagram: `https://instagram.com/${slug}`, x: `https://x.com/${slug}` },
    defaultLanguage: "ar", languages: ["ar", "en"], currency: "SAR", timezone: "Asia/Riyadh",
    commercialRegistration: "1010987654", vatNumber: "310123456700003", legalName: `مؤسسة ${ar} للتجارة`,
    nationalAddress: nationalAddress("الرياض", "العليا", ar, tel), status, plan,
  };
}

export const stores: Store[] = [
  makeStore("store_nakhla", "nakhla", "متجر نخلة", "Nakhla Store", "gifts", "plan_growth", "live"),
  makeStore("store_oud", "daraloud", "دار العود", "Dar Al Oud", "perfumes", "plan_pro", "live"),
  makeStore("store_bloom", "riyadhbloom", "ورد الرياض", "Riyadh Bloom", "gifts", "plan_starter", "draft"),
];
export const store = stores[0] as Store;

/* The 7 built-in roles — permission sets come from DEFAULT_ROLES (contracts)
 * so the editor, the guards and this fixture never drift apart. */
const systemRole = (key: DefaultRoleKey, name: string, description: string): Role =>
  ({ id: `role_${key}`, name, description, permissions: [...DEFAULT_ROLES[key]], isSystem: true });

export const roles: Role[] = [
  systemRole("owner", "المالك", "كل الصلاحيات"),
  systemRole("admin", "مدير المتجر", "كل شيء ما عدا الفوترة والمطورين"),
  systemRole("catalog", "أمين الكتالوج", "المنتجات والمخزون"),
  systemRole("orders", "موظف الطلبات", "الطلبات والشحن والمرتجعات"),
  systemRole("support", "خدمة العملاء", "المحادثات والعملاء والمرتجعات"),
  systemRole("marketing", "التسويق", "الحملات والكوبونات والتقارير"),
  systemRole("readonly", "مشاهد", "قراءة فقط"),
];

export const staff: Staff[] = [
  { id: "stf_khalid", name: "خالد العتيبي", email: "khalid@nakhla.sa", phone: "+966501112233", roleId: "role_owner", status: "active", mfaEnabled: true, lastLoginAt: minutesAgo(5) },
  { id: "stf_reem", name: "ريم الحربي", email: "reem@nakhla.sa", phone: "+966502223344", roleId: "role_admin", status: "active", mfaEnabled: true, lastLoginAt: minutesAgo(90) },
  { id: "stf_sultan", name: "سلطان الدوسري", email: "sultan@nakhla.sa", phone: "+966503334455", roleId: "role_support", status: "active", mfaEnabled: false, lastLoginAt: minutesAgo(30) },
  { id: "stf_hind", name: "هند الزهراني", email: "hind@nakhla.sa", phone: null, roleId: "role_orders", status: "active", mfaEnabled: false, lastLoginAt: daysAgo(1, 10) },
  { id: "stf_majed", name: "ماجد الشمري", email: "majed@nakhla.sa", phone: null, roleId: "role_readonly", status: "invited", mfaEnabled: false, lastLoginAt: null },
];
export const currentStaff = staff[0] as Staff;

const staffActor = (s: Staff = currentStaff): ActorRef => ({ type: "staff", id: s.id, name: s.name });
const SYSTEM: ActorRef = { type: "system", id: "system", name: "النظام" };
const agentActor = (id = "agt_sales", name = "وكيل المبيعات"): ActorRef => ({ type: "agent", id, name });

/* Catalog */
export const categories: Category[] = seed.categories.map((c, i) => ({
  id: c.id, name: c.name, slug: slugify(c.name.en ?? c.id), description: { ar: `تشكيلة ${c.name.ar} المختارة.` }, image: null,
  seo: { title: c.name.ar, description: `تسوق ${c.name.ar} من متجر نخلة.` }, parentId: null, sortOrder: i,
}));

export const locations: Location[] = [
  { id: "loc_riyadh", name: "مستودع الرياض", city: "الرياض", address: "حي السليمانية — طريق الملك عبدالعزيز", isDefault: true, status: "active" },
  { id: "loc_jeddah", name: "مستودع جدة", city: "جدة", address: "حي الروضة — شارع الأمير سلطان", isDefault: false, status: "active" },
];

/* Merchant brands (`/brands`) — `Product.brand` keeps the display name in sync
 * with `name.ar` (see the Brand contract note). */
export const brands: Brand[] = [
  { id: "brn_nakhla", name: { ar: "نخلة", en: "Nakhla" }, slug: "nakhla", description: { ar: "علامة المتجر الخاصة — مختارات نخلة." }, logo: null, website: null, status: "active", createdAt: daysAgo(300, 10) },
  { id: "brn_daraloud", name: { ar: "دار العود", en: "Dar Al Oud" }, slug: "dar-al-oud", description: { ar: "عطور وبخور شرقية فاخرة." }, logo: null, website: "https://daraloud.sa", status: "active", createdAt: daysAgo(280, 11) },
  { id: "brn_khareef", name: { ar: "بن الخريف", en: "Alkhareef Coffee" }, slug: "alkhareef-coffee", description: { ar: "بن مختص محمص محلياً." }, logo: null, website: null, status: "active", createdAt: daysAgo(240, 12) },
  { id: "brn_tamrah", name: { ar: "تمرة", en: "Tamrah" }, slug: "tamrah", description: { ar: "تمور فاخرة من مزارع القصيم." }, logo: null, website: "https://tamrah.sa", status: "active", createdAt: daysAgo(210, 13) },
  { id: "brn_lamsa", name: { ar: "لمسة", en: "Lamsa" }, slug: "lamsa", description: { ar: "هدايا وتغليف بتصاميم محلية." }, logo: null, website: null, status: "active", createdAt: daysAgo(180, 14) },
  { id: "brn_jazeera", name: { ar: "عطور الجزيرة", en: "Jazeera Perfumes" }, slug: "jazeera-perfumes", description: { ar: "عطور خليجية بتركيبات حصرية." }, logo: null, website: "https://jazeeraparfum.sa", status: "active", createdAt: daysAgo(150, 15) },
  { id: "brn_sakhaa", name: { ar: "سخاء", en: "Sakhaa" }, slug: "sakhaa", description: { ar: "أزياء وعبايات بتفاصيل راقية." }, logo: null, website: null, status: "active", createdAt: daysAgo(120, 16) },
  { id: "brn_haramain", name: { ar: "الحرمين", en: "Al Haramain" }, slug: "al-haramain", description: { ar: "دهن عود ومسك بجودة الحرمين." }, logo: null, website: "https://alharamain.sa", status: "archived", createdAt: daysAgo(400, 9) },
];

const SIZES = ["S", "M", "L", "XL"];
export const products: Product[] = seed.products.map((p, i) => {
  const sized = p.categoryId === "cat_fashion";
  const values = sized ? SIZES : [null];
  const variants: Variant[] = values.map((size, v) => ({
    id: `var_${p.id.slice(4)}${size ? `_${size.toLowerCase()}` : ""}`,
    optionValues: size ? [size] : [], sku: size ? `${p.sku}-${size}` : p.sku, barcode: `628${String(1000000000 + i * 37 + v).slice(0, 10)}`,
    price: money(p.price), compareAtPrice: p.compareAtPrice ? money(p.compareAtPrice) : null, cost: money(p.cost), weightGrams: 250 + (i % 5) * 150,
    dimensionsCm: { l: 20, w: 15, h: 8 }, trackInventory: true, allowBackorder: false, imageId: null,
  }));
  return {
    id: p.id, name: p.name, slug: slugify(p.name.en ?? p.id), description: p.description, shortDescription: { ar: p.description.ar.split("،")[0] ?? p.description.ar },
    type: p.digital ? "digital" : "physical", status: p.status === "active" ? "active" : p.status === "draft" ? "draft" : "archived",
    media: [media(`med_${p.id}`, p.imageHue, p.name.ar)], categoryIds: [p.categoryId],
    collectionIds: [...(i >= 24 ? ["col_new"] : []), ...([0, 3, 7, 10, 16, 20].includes(i) ? ["col_gifts"] : [])],
    /* Every third product carries a brand, cycling the seeded Brand rows so
     * `/brands` shows realistic usage counts. `brand` stays a display string —
     * the catalog API syncs it with `Brand.name.ar` on rename. */
    brand: i % 3 === 0 ? (brands[i % brands.length]?.name.ar ?? null) : null, tags: i % 5 === 0 ? ["هدايا"] : [],
    options: sized ? [{ name: { ar: "المقاس", en: "Size" }, values: SIZES.map((s) => ({ ar: s, en: s })) }] : [],
    variants, seo: { title: p.name.ar, description: p.description.ar.slice(0, 150) }, requiresShipping: !p.digital, taxable: true, aiNotes: "",
    publishedAt: p.status === "active" ? p.createdAt : null,
    stats: { sold30d: Math.round(p.salesCount / 6), revenue30d: money(Math.round(p.salesCount / 6) * p.price), views30d: p.salesCount * 9, conversations30d: Math.round(p.salesCount / 20) },
    rating: p.rating, reviewsCount: p.reviewsCount,
  };
});

/* Media library — seeded with placeholder:<hue> entries matching the product hue scheme. */
export const mediaAssets: Media[] = [
  { id: "med_lib_oud", url: "placeholder:30", altAr: "دهن عود", altEn: "Oud oil", width: 800, height: 800, mime: "image/png", sizeBytes: 182_000, createdAt: daysAgo(60, 12) },
  { id: "med_lib_bakhoor", url: "placeholder:20", altAr: "بخور فاخر", altEn: "Luxury bakhoor", width: 800, height: 800, mime: "image/png", sizeBytes: 164_000, createdAt: daysAgo(58, 10) },
  { id: "med_lib_gift", url: "placeholder:340", altAr: "تغليف هدايا", altEn: "Gift wrap", width: 800, height: 800, mime: "image/png", sizeBytes: 141_000, createdAt: daysAgo(45, 15) },
  { id: "med_lib_coffee", url: "placeholder:25", altAr: "قهوة مختصة", altEn: "Specialty coffee", width: 800, height: 800, mime: "image/png", sizeBytes: 173_000, createdAt: daysAgo(40, 9) },
  { id: "med_lib_fashion", url: "placeholder:265", altAr: "أزياء", altEn: "Fashion", width: 800, height: 800, mime: "image/png", sizeBytes: 198_000, createdAt: daysAgo(32, 14) },
  { id: "med_lib_home", url: "placeholder:160", altAr: "ديكور منزلي", altEn: "Home decor", width: 800, height: 800, mime: "image/png", sizeBytes: 156_000, createdAt: daysAgo(21, 11) },
  { id: "med_lib_care", url: "placeholder:200", altAr: "عناية شخصية", altEn: "Self care", width: 800, height: 800, mime: "image/png", sizeBytes: 149_000, createdAt: daysAgo(12, 16) },
  { id: "med_lib_hero", url: "placeholder:300", altAr: "خلفية واجهة", altEn: "Hero backdrop", width: 1600, height: 900, mime: "image/png", sizeBytes: 240_000, createdAt: daysAgo(5, 13) },
];

export const inventoryLevels: InventoryLevel[] = products.flatMap((p, i) => {
  const lp = seed.products[i];
  const total = lp?.stock ?? 0;
  return p.variants.map((v, vi) => {
    const onHand = p.variants.length > 1 ? Math.max(0, Math.round(total / p.variants.length) - vi) : total;
    const reserved = Math.min(onHand, (i + vi) % 3);
    return { variantId: v.id, locationId: "loc_riyadh", onHand, reserved, available: onHand - reserved, lowStockThreshold: lp?.lowStockThreshold ?? 5 };
  });
});

/* Customers */
const toCity = (c: string): SaudiCity => ((SAUDI_CITIES as readonly string[]).includes(c) ? (c as SaudiCity) : "الرياض");
const segmentMap: Record<string, CustomerSegment> = { vip: "vip", loyal: "returning", returning: "returning", new: "new", atRisk: "at_risk", at_risk: "at_risk" };

export const customers: Customer[] = seed.customers.map((c, i) => {
  const city = toCity(c.city);
  const district = districts[c.city]?.[i % 3] ?? "العليا";
  const address: Address = {
    id: `addr_${c.id.slice(4)}`, label: "المنزل", recipientName: c.name, phone: phone(c.phone), city, district, street: null,
    buildingNumber: String(2000 + i * 13), additionalNumber: null, postalCode: null, shortAddress: null, location: null, notes: null, isDefault: true,
  };
  const avg = c.ordersCount ? Math.round(c.totalSpent / c.ordersCount) : 0;
  return {
    id: c.id, name: c.name, phone: phone(c.phone), email: c.email, gender: i % 2 ? "male" : "female", birthDate: null, addresses: [address],
    tags: c.segment === "vip" ? ["VIP"] : [], notes: "", marketingConsent: { whatsapp: i % 4 !== 0, sms: i % 3 === 0, email: i % 2 === 0, updatedAt: c.createdAt },
    source: i % 5 === 0 ? "whatsapp" : "storefront", createdAt: c.createdAt,
    stats: { ordersCount: c.ordersCount, totalSpent: money(c.totalSpent), avgOrder: money(avg), lastOrderAt: c.lastOrderAt, firstOrderAt: c.createdAt, returnsCount: 0 },
    segment: segmentMap[c.segment] ?? "new",
  };
});
const customerById = new Map(customers.map((c) => [c.id, c]));

/* Orders + derived entities */
const methodMap: Record<string, PaymentMethod> = { mada: "mada", visa: "card", applePay: "apple_pay", stcPay: "stc_pay", tabby: "card", tamara: "card", cod: "cod" };
const channelMap: Record<string, OrderChannel> = { store: "storefront", whatsapp: "whatsapp", instagram: "voice" };
const carrierNames: Record<string, string> = { aramex: "أرامكس", smsa: "سمسا", spl: "سبل", redbox: "ريدبوكس" };
const variantOf = (productId: string) => products.find((p) => p.id === productId)?.variants[0];

export const orders: Order[] = [];
export const shipments: Shipment[] = [];
export const invoices: Invoice[] = [];
export const returns: Return[] = [];
export const payments: Payment[] = [];
export const refunds: Refund[] = [];
export const inventoryMovements: InventoryMovement[] = [];

/* Activity log for seeded returns — mirrors the path the status actually took
 * (info_requested branches off `requested`, received→refunded→closed follow). */
const returnEventsFor = (rn: number, status: ReturnStatus, at: string, customer: string): ReturnEvent[] => {
  const evs: ReturnEvent[] = [{ id: `rev_${rn}_0`, type: "created", actor: { type: "customer", id: "", name: customer }, at, data: {} }];
  const push = (type: ReturnEvent["type"], to: string) => evs.push({ id: `rev_${rn}_${evs.length}`, type, actor: staffActor(staff[1]), at, data: { to: to } });
  if (status === "info_requested") push("info_requested", "info_requested");
  if (status === "approved" || status === "rejected") push("status_changed", status);
  if (["in_transit", "received", "refunded", "closed"].includes(status)) {
    push("status_changed", "approved");
    if (status !== "approved") push("status_changed", "in_transit");
    if (["received", "refunded", "closed"].includes(status)) push("status_changed", "received");
    if (["refunded", "closed"].includes(status)) push("status_changed", "refunded");
    if (status === "closed") push("status_changed", "closed");
  }
  return evs;
};

seed.orders.forEach((o, idx) => {
  const customer = customerById.get(o.customerId);
  const method = methodMap[o.paymentMethod] ?? "card";
  const cod = method === "cod";
  const ls = o.status;
  const fulfillment: FulfillmentStatus =
    ls === "new" ? "unfulfilled" : ls === "processing" || ls === "ready" ? "processing" : ls === "shipped" ? "shipped" : ls === "delivered" ? "delivered" : ls === "returned" ? "returned" : "cancelled";
  let paymentStatus: PaymentStatus =
    o.paymentStatus === "paid" ? "paid" : o.paymentStatus === "refunded" ? "refunded" : o.paymentStatus === "failed" ? "failed" : "pending";
  if (cod && paymentStatus === "pending") paymentStatus = fulfillment === "delivered" ? "cod_collected" : "cod_pending";
  if (cod && fulfillment === "delivered") paymentStatus = "cod_collected";
  const status: OrderStatus =
    fulfillment === "cancelled" ? "cancelled" : fulfillment === "delivered" || fulfillment === "returned" ? "completed" : fulfillment === "unfulfilled" || paymentStatus === "failed" ? "needs_action" : "in_progress";
  const channel = channelMap[o.channel] ?? "storefront";
  const agentId = channel === "storefront" ? null : channel === "voice" ? "agt_main" : "agt_sales";
  const items: OrderItem[] = o.items.map((it, n) => {
    const line = it.unitPrice * it.quantity;
    const tax = Math.round(line - line / (1 + VAT));
    return {
      id: `oi_${o.number}_${n + 1}`, variantId: variantOf(it.productId)?.id ?? `var_${it.productId.slice(4)}`, productId: it.productId, productName: it.name,
      variantLabel: null, sku: it.sku, image: media(`med_${it.productId}`, it.imageHue, it.name.ar), quantity: it.quantity, unitPrice: money(it.unitPrice),
      discount: money(0), tax: money(tax), lineTotal: money(line), fulfilledQty: ["shipped", "delivered", "returned"].includes(fulfillment) ? it.quantity : 0,
      returnedQty: fulfillment === "returned" ? it.quantity : 0,
      refundedQty: fulfillment === "returned" || paymentStatus === "refunded" ? it.quantity : 0,
    };
  });
  const shippingAddress: Address = customer?.addresses[0]
    ? { ...customer.addresses[0], district: o.address.district, street: o.address.street, city: toCity(o.address.city) }
    : { id: `addr_o${o.number}`, label: null, recipientName: o.customerName, phone: phone(o.customerPhone), city: toCity(o.address.city), district: o.address.district, street: o.address.street, buildingNumber: null, additionalNumber: null, postalCode: null, shortAddress: null, location: null, notes: null, isDefault: false };
  const id = o.id;
  const createdBy: ActorRef = channel === "storefront" ? { type: "customer", id: o.customerId, name: o.customerName } : agentActor(agentId ?? undefined);
  const events: OrderEvent[] = [{ id: `ev_${o.number}_1`, type: "created", actor: createdBy, at: o.createdAt, data: { channel }, link: null }];
  const paid = ["paid", "refunded", "cod_collected", "partially_refunded"].includes(paymentStatus);
  const paidAt = paid ? new Date(new Date(o.createdAt).getTime() + (cod ? 3 * 86_400_000 : 120_000)).toISOString() : null;
  const conv = seed.conversations.find((c) => c.orderId === id);
  const order: Order = {
    id, number: o.number, customerId: o.customerId, channel, agentId, conversationId: conv?.id ?? null,
    /* Seeded affiliate attributions — match affiliateConversions in growth.ts. */
    affiliateCode: ({ 10285: "NOURA10", 10288: "NOURA10", 10290: "TECH5", 10280: "OUD15" } as Record<number, string>)[o.number] ?? null,
    locationId: "loc_riyadh", items, shippingAddress,
    /* Every 5th order carries an explicit billing address (B2B buyer paying to a
     * different HQ address); `null` = "same as shipping" on the rest. */
    billingAddress: idx % 5 === 0 ? { ...shippingAddress, id: `addr_b${o.number}`, city: "جدة" as SaudiCity, district: "حي الروضة", street: null } : null,
    shippingMethod: { carrier: carrierNames[o.carrier] ?? o.carrier, service: "توصيل عادي", price: money(o.shippingFee), etaDays: 3 },
    couponCode: o.discount > 0 ? "WATAN20" : null, subtotal: money(o.subtotal), discountTotal: money(o.discount), shippingTotal: money(o.shippingFee),
    taxTotal: money(o.vat), total: money(o.total), pricesIncludeTax: true, paymentMethod: method, paymentStatus, fulfillmentStatus: fulfillment, status,
    customerNote: o.note, internalNotes: idx % 7 === 0 ? [{ text: "العميل طلب تغليف هدية", actor: staffActor(staff[1]), at: o.createdAt }] : [],
    tags: o.total > 100_000 ? ["قيمة عالية"] : [], invoiceId: null, shipmentIds: [], returnIds: [], events, createdAt: o.createdAt, paidAt,
    cancelledAt: null, cancelReason: null,
  };

  payments.push({
    id: `pay_${o.number}`, orderId: id, amount: order.total, method, status: paymentStatus === "failed" ? "failed" : paid ? "captured" : "pending",
    provider: cod ? "cod" : "moyasar", providerRef: `mys_${(o.number * 7919).toString(36)}`, cardBrand: method === "card" ? "Visa" : method === "mada" ? "mada" : null,
    cardLast4: ["card", "mada"].includes(method) ? String(1000 + ((o.number * 37) % 9000)) : null, failureReason: paymentStatus === "failed" ? "رفض البنك المُصدر" : null,
    webhookEventId: null, createdAt: o.createdAt,
  });
  if (paymentStatus === "failed") events.push({ id: `ev_${o.number}_pf`, type: "payment_failed", actor: SYSTEM, at: o.createdAt, data: { reason: "رفض البنك المُصدر" }, link: null });
  if (paidAt && !cod) events.push({ id: `ev_${o.number}_paid`, type: "paid", actor: SYSTEM, at: paidAt, data: { method }, link: null });

  if (paid || fulfillment !== "unfulfilled") {
    const inv: Invoice = {
      id: `inv_${o.number}`, number: `INV-2026-${String(o.number).padStart(6, "0")}`, type: "simplified", orderId: id, returnId: null, customerId: o.customerId,
      customer: { name: o.customerName, vatNumber: null },
      lines: items.map((it) => ({ description: it.productName.ar, quantity: it.quantity, unitPrice: it.unitPrice, vat: it.tax, total: it.lineTotal })),
      subtotal: money(o.total - o.vat), vatAmount: money(o.vat), total: money(o.total), issuedAt: paidAt ?? o.createdAt, qrCode: `zatca:${o.number}`, pdfUrl: "#",
      zatcaStatus: idx === 3 ? "rejected" : idx % 6 === 0 ? "pending" : "reported", zatcaErrors: idx === 3 ? ["رقم التسجيل الضريبي للمشتري غير صالح"] : [], relatedInvoiceId: null,
    };
    if (fulfillment !== "cancelled" || paid) {
      invoices.push(inv);
      order.invoiceId = inv.id;
      events.push({ id: `ev_${o.number}_inv`, type: "invoice_issued", actor: SYSTEM, at: inv.issuedAt, data: { number: inv.number }, link: { type: "invoice", id: inv.id, label: inv.number } });
    }
  }

  o.timeline.forEach((t, n) => {
    if (n === 0) return;
    events.push({ id: `ev_${o.number}_s${n}`, type: t.status === "cancelled" ? "cancelled" : "status_changed", actor: t.actor === "agent" ? agentActor() : t.actor === "staff" ? staffActor(staff[n % 2 ? 3 : 1]) : SYSTEM, at: t.at, data: { to: t.status }, link: null });
  });

  if (["shipped", "delivered", "returned"].includes(fulfillment)) {
    const shippedAt = o.timeline.find((t) => t.status === "shipped")?.at ?? o.createdAt;
    const st: ShipmentStatus = fulfillment === "shipped" ? (idx % 4 === 0 ? "out_for_delivery" : idx % 9 === 0 ? "failed_attempt" : "in_transit") : "delivered";
    const shp: Shipment = {
      id: `shp_${o.number}`, orderId: id, customerId: o.customerId, type: "outbound", carrier: carrierNames[o.carrier] ?? o.carrier, service: "توصيل عادي",
      trackingNumber: o.trackingNumber ?? `TRK${o.number}SA`, trackingUrl: "#", labelUrl: "#", items: items.map((it) => ({ orderItemId: it.id, quantity: it.quantity })),
      packages: [{ weightGrams: 900, dimensionsCm: { l: 30, w: 20, h: 12 } }], codAmount: cod ? order.total : null, status: st,
      labelNumber: `LBL${o.number}SA`,
      events: [
        { status: "label_created", location: "الرياض", description: "تم إنشاء البوليصة", at: shippedAt },
        { status: "picked_up", location: "الرياض", description: "استلمت شركة الشحن الشحنة", at: shippedAt },
        { status: "in_transit", location: shippingAddress.city, description: "الشحنة في الطريق", at: shippedAt },
        ...(st === "delivered" || st === "out_for_delivery" || st === "failed_attempt" ? [{ status: st, location: shippingAddress.city, description: st === "delivered" ? "تم التسليم" : st === "failed_attempt" ? "تعذر التسليم: العميل لا يرد" : "خرجت للتوصيل", at: o.timeline.at(-1)?.at ?? shippedAt }] : []),
      ],
      estimatedDelivery: daysAgo(-2).slice(0, 10), cost: money(2_500),
    };
    shipments.push(shp);
    order.shipmentIds.push(shp.id);
    events.push({ id: `ev_${o.number}_shp`, type: "shipment_created", actor: staffActor(staff[3]), at: shippedAt, data: { carrier: shp.carrier, tracking: shp.trackingNumber ?? "" }, link: { type: "shipment", id: shp.id } });
    if (fulfillment !== "shipped") events.push({ id: `ev_${o.number}_dl`, type: "delivered", actor: SYSTEM, at: o.timeline.at(-1)?.at ?? shippedAt, data: {}, link: { type: "shipment", id: shp.id } });
  }

  if (fulfillment === "returned" || paymentStatus === "refunded") {
    const rn = 5000 + returns.length + 1;
    const ret: Return = {
      id: `ret_${rn}`, number: rn, orderId: id, customerId: o.customerId, items: items.map((it) => ({ orderItemId: it.id, quantity: it.quantity, reason: "damaged" })),
      reason: returns.length % 2 ? "size_issue" : "damaged", customerNote: "وصل المنتج والعلبة متضررة", photos: [], status: paymentStatus === "refunded" ? "refunded" : "received",
      resolution: "refund", refundAmount: order.total, restock: true, returnShipmentId: null, rejectionReason: null, creditNoteId: null,
      refundId: paymentStatus === "refunded" ? `rfd_${o.number}` : null, inspectionStatus: "passed",
      restockedAt: o.timeline.at(-1)?.at ?? o.createdAt,
      events: returnEventsFor(rn, paymentStatus === "refunded" ? "refunded" : "received", o.timeline.at(-1)?.at ?? o.createdAt, o.customerName),
      createdAt: o.timeline.at(-1)?.at ?? o.createdAt,
    };
    returns.push(ret);
    order.returnIds.push(ret.id);
    events.push({ id: `ev_${o.number}_ret`, type: "return_requested", actor: { type: "customer", id: o.customerId, name: o.customerName }, at: ret.createdAt, data: { number: rn }, link: { type: "return", id: ret.id } });
    if (paymentStatus === "refunded") {
      refunds.push({
        id: `rfd_${o.number}`, paymentId: `pay_${o.number}`, orderId: id, amount: order.total, reason: "مرتجع", status: "succeeded",
        items: ret.items.map((i) => ({ orderItemId: i.orderItemId, quantity: i.quantity })), restock: true,
        gatewayRef: `re_${(o.number * 104729).toString(36)}`, idempotencyKey: null, returnId: ret.id,
        actor: staffActor(staff[1]), approvedBy: staffActor(), createdAt: ret.createdAt,
      });
      events.push({ id: `ev_${o.number}_rfd`, type: "refunded", actor: staffActor(staff[1]), at: ret.createdAt, data: { amount: order.total.amount }, link: null });
    }
  }
  if (fulfillment === "cancelled") {
    order.cancelledAt = o.timeline.at(-1)?.at ?? o.createdAt;
    order.cancelReason = { code: idx % 2 ? "customer_request" : "out_of_stock", text: idx % 2 ? "طلب العميل الإلغاء" : "نفاد الكمية" };
  }
  order.internalNotes.forEach((n, k) => events.push({ id: `ev_${o.number}_n${k}`, type: "note_added", actor: n.actor, at: n.at, data: { text: n.text }, link: null }));
  events.sort((a, b) => a.at.localeCompare(b.at));
  orders.push(order);

  items.forEach((it, n) =>
    inventoryMovements.push({
      id: `mov_${o.number}_${n}`, variantId: it.variantId, delta: -it.quantity, reason: "sale", note: null, reference: { type: "order", id, label: `#${o.number}` },
      actor: SYSTEM, at: o.createdAt, balanceAfter: inventoryLevels.find((l) => l.variantId === it.variantId)?.onHand ?? 0,
    }),
  );
});

/* One deterministic "requested" return — every other seeded return is already
 * received/refunded, which leaves the approve flow unreachable in dev and e2e.
 * Pinned to the first delivered order without an existing return. */
{
  const host = orders.find((o) => o.fulfillmentStatus === "delivered" && o.returnIds.length === 0);
  if (host) {
    const rn = 5000 + returns.length + 1;
    const ret: Return = {
      id: `ret_${rn}`, number: rn, orderId: host.id, customerId: host.customerId,
      items: [{ orderItemId: host.items[0]?.id ?? "", quantity: 1, reason: "size_issue" }],
      reason: "size_issue", customerNote: "المقاس غير مناسب — أرغب بالاستبدال أو الاسترداد", photos: [], status: "requested",
      resolution: null, refundAmount: null, restock: true, returnShipmentId: null, rejectionReason: null, creditNoteId: null,
      refundId: null, inspectionStatus: null, restockedAt: null,
      events: [{ id: `rev_${rn}_0`, type: "created", actor: { type: "customer", id: host.customerId, name: customerById.get(host.customerId)?.name ?? "" }, at: daysAgo(1, 14), data: {} }],
      createdAt: daysAgo(1, 14),
    };
    returns.push(ret);
    host.returnIds.push(ret.id);
    host.events.push({ id: `ev_${host.number}_ret`, type: "return_requested", actor: { type: "customer", id: host.customerId, name: customerById.get(host.customerId)?.name ?? "" }, at: ret.createdAt, data: { number: rn }, link: { type: "return", id: ret.id } });
  }
}

/* Pad the fixture to a realistic spread (≥12 returns) — one return per status
 * so every review action/filter is reachable in dev and e2e. Hosts are
 * delivered orders without returns; each gets internally-consistent data
 * (return shipment once the parcel is moving, refund+credit note once refunded). */
{
  const extraStatuses: ReturnStatus[] = ["info_requested", "approved", "in_transit", "received", "rejected", "refunded", "closed", "requested", "approved", "info_requested"];
  const hosts = orders.filter((o) => o.fulfillmentStatus === "delivered" && o.returnIds.length === 0);
  const extraReasons: Return["reason"][] = ["damaged", "wrong_item", "not_as_described", "size_issue", "changed_mind"];
  extraStatuses.forEach((status, i) => {
    const host = hosts[i];
    if (!host) return;
    const rn = 5000 + returns.length + 1;
    const at = daysAgo(2 + i, 10 + (i % 6));
    const reason = extraReasons[i % extraReasons.length] as Return["reason"];
    const decided = !["requested", "info_requested"].includes(status);
    const refunded = status === "refunded" || status === "closed";
    const line = host.items[0];
    const items = [{ orderItemId: line?.id ?? "", quantity: 1, reason }];
    const amount = line ? Math.round(line.lineTotal.amount / line.quantity) : 0;
    const ret: Return = {
      id: `ret_${rn}`, number: rn, orderId: host.id, customerId: host.customerId, items,
      reason, customerNote: i % 2 ? null : "أرجو سرعة المعالجة — المنتج لا يطابق الوصف", photos: [], status,
      resolution: decided ? (i % 3 === 0 ? "store_credit" : "refund") : null,
      refundAmount: decided ? money(amount) : null,
      restock: i % 3 !== 1, returnShipmentId: null,
      rejectionReason: status === "rejected" ? "تجاوزت فترة الإرجاع المسموحة" : null,
      creditNoteId: null, refundId: null,
      inspectionStatus: ["received", "refunded", "closed"].includes(status) ? "passed" : null,
      restockedAt: ["received", "refunded", "closed"].includes(status) ? at : null,
      events: returnEventsFor(rn, status, at, customerById.get(host.customerId)?.name ?? ""),
      createdAt: at,
    };
    if (["in_transit", "received", "refunded", "closed"].includes(status)) {
      const shp: Shipment = {
        id: `shp_ret_${rn}`, orderId: host.id, customerId: host.customerId, type: "return", carrier: "أرامكس", service: "استرجاع",
        trackingNumber: `RTN${rn}SA`, trackingUrl: "#", labelUrl: "#", labelNumber: `RLB${rn}SA`, items,
        packages: [{ weightGrams: 1_000, dimensionsCm: { l: 30, w: 20, h: 12 } }], codAmount: null,
        status: status === "in_transit" ? "in_transit" : "delivered",
        events: [{ status: "label_created", location: host.shippingAddress.city, description: "تم إنشاء بوليصة الإرجاع", at }],
        estimatedDelivery: null, cost: money(2_000),
      };
      shipments.push(shp);
      ret.returnShipmentId = shp.id;
    }
    if (["received", "refunded", "closed"].includes(status) && line) line.returnedQty = Math.min(line.quantity, line.returnedQty + 1);
    if (refunded) {
      const rfd: Refund = {
        id: `rfd_${rn}`, paymentId: `pay_${host.number}`, orderId: host.id, amount: money(amount), reason: `مرتجع #${rn}`, status: "succeeded",
        items: items.map((x) => ({ orderItemId: x.orderItemId, quantity: x.quantity })), restock: true,
        gatewayRef: `re_${(rn * 104729).toString(36)}`, idempotencyKey: null, returnId: `ret_${rn}`,
        actor: staffActor(staff[1]), approvedBy: staffActor(), createdAt: at,
      };
      refunds.push(rfd);
      ret.refundId = rfd.id;
      if (host.paymentStatus === "paid" || host.paymentStatus === "cod_collected") host.paymentStatus = "partially_refunded";
      const cn: Invoice = {
        id: `inv_cn_${rn}`, number: `CN-${rn}`, type: "credit_note", orderId: host.id, returnId: ret.id, customerId: host.customerId,
        customer: { name: customerById.get(host.customerId)?.name ?? "", vatNumber: null },
        lines: [{ description: `مرتجع #${rn}`, quantity: 1, unitPrice: money(amount - Math.round(amount - amount / 1.15)), vat: money(Math.round(amount - amount / 1.15)), total: money(amount) }],
        subtotal: money(amount - Math.round(amount - amount / 1.15)), vatAmount: money(Math.round(amount - amount / 1.15)), total: money(amount),
        issuedAt: at, qrCode: `zatca:cn${rn}`, pdfUrl: "#", zatcaStatus: "reported", zatcaErrors: [], relatedInvoiceId: host.invoiceId,
      };
      invoices.push(cn);
      ret.creditNoteId = cn.id;
    }
    returns.push(ret);
    host.returnIds.push(ret.id);
    host.events.push({ id: `ev_${host.number}_r${i}`, type: "return_requested", actor: { type: "customer", id: host.customerId, name: customerById.get(host.customerId)?.name ?? "" }, at, data: { number: rn }, link: { type: "return", id: ret.id } });
  });
}

returns.forEach((r) => {
  const c = customerById.get(r.customerId);
  if (c) c.stats.returnsCount += 1;
});
inventoryLevels.slice(0, 6).forEach((l, i) =>
  inventoryMovements.push({ id: `mov_adj_${i}`, variantId: l.variantId, delta: 20 + i * 5, reason: i % 2 ? "import" : "adjustment", note: i % 2 ? null : "جرد شهري", reference: null, actor: staffActor(staff[3]), at: daysAgo(10 + i, 11), balanceAfter: l.onHand }),
);
inventoryMovements.sort((a, b) => b.at.localeCompare(a.at));

/* Conversations */
const convStatus = (c: (typeof seed.conversations)[number]): ConversationStatus =>
  c.status === "resolved" ? "resolved" : c.status === "waiting" ? "waiting_human" : c.handledBy === "staff" ? "open_human" : "open_ai";

export const conversations: Conversation[] = seed.conversations.map((c, i) => {
  const cust = customerById.get(c.customerId);
  const status = convStatus(c);
  const agentId = c.intent === "return" || c.intent === "complaint" ? "agt_care" : c.intent === "orderStatus" ? "agt_care_track" : "agt_sales";
  const messages: Message[] = c.messages.map((m) => ({
    id: m.id, type: "text", content: m.text, attachments: [], toolCalls: [], deliveryStatus: m.sender === "customer" ? null : "read", ref: null, at: m.at,
    from: m.sender === "customer" ? { type: "customer", id: c.customerId, name: c.customerName } : m.sender === "agent" ? agentActor(agentId, "وكيل نخلة") : staffActor(staff[2]),
  }));
  if (c.orderId) messages.splice(Math.min(2, messages.length), 0, { id: `${c.id}_card`, type: "order_card", content: "", attachments: [], toolCalls: [{ tool: "lookup_order", input: c.orderId, output: "ok" }], deliveryStatus: "read", ref: { type: "order", id: c.orderId }, at: messages[1]?.at ?? c.lastMessageAt, from: agentActor(agentId, "وكيل نخلة") });
  /* A few threads carry the non-text message types the inbox renders (§5.14). */
  if (i % 4 === 1) messages.push({ id: `${c.id}_pc`, type: "product_card", content: "", attachments: [], toolCalls: [{ tool: "productSearch", input: c.messages[0]?.text.slice(0, 30) ?? "", output: "1 منتج" }], deliveryStatus: "read", ref: { type: "product", id: products[(i * 5) % products.length]?.id ?? "" }, at: c.lastMessageAt, from: agentActor(agentId, "وكيل نخلة") });
  if (i % 5 === 2) messages.push({ id: `${c.id}_nt`, type: "internal_note", content: "العميل من كبار العملاء — يفضّل التواصل بعد المغرب.", attachments: [], toolCalls: [], deliveryStatus: null, ref: null, at: c.lastMessageAt, from: staffActor(staff[2]) });
  if (status === "open_human" || status === "waiting_human") messages.push({ id: `${c.id}_sys`, type: "system", content: "handoff_to_human", attachments: [], toolCalls: [], deliveryStatus: null, ref: null, at: c.lastMessageAt, from: SYSTEM });
  if (i % 6 === 3) messages.push({ id: `${c.id}_pl`, type: "payment_link", content: "", attachments: [], toolCalls: [{ tool: "paymentLink", input: "cart", output: "nakhla.sa/pay/8F2K" }], deliveryStatus: "delivered", ref: c.orderId ? { type: "order", id: c.orderId } : null, at: c.lastMessageAt, from: agentActor(agentId, "وكيل نخلة") });
  messages.sort((a, b) => a.at.localeCompare(b.at));
  return {
    id: c.id, channel: c.channel, customerId: c.customerId, contact: { phone: cust?.phone ?? "+966500000000", name: c.customerName }, status,
    currentAgentId: status === "open_ai" ? agentId : null, agentPath: ["agt_main", agentId], assigneeId: status === "open_human" ? "stf_sultan" : null,
    priority: c.intent === "complaint" ? "high" : status === "waiting_human" ? "urgent" : "normal", tags: [], sentiment: c.intent === "complaint" ? "negative" : i % 3 ? "neutral" : "positive",
    aiSummary: `العميل يسأل عن ${c.intent === "orderStatus" ? "حالة طلبه" : c.intent === "return" ? "إرجاع منتج" : c.intent === "complaint" ? "مشكلة في الطلب" : "منتج"}.`,
    relatedOrderIds: c.orderId ? [c.orderId] : [], waitingSince: status === "waiting_human" ? c.lastMessageAt : null, rating: status === "resolved" ? 4 + (i % 2) : null,
    messages, updatedAt: c.lastMessageAt,
  };
});

/* Approvals */
const firstOpenOrder = orders.find((o) => o.status === "in_progress") ?? orders[0];
export const approvals: AgentApproval[] = [
  /* apr_1 must target an order that actually holds a refundable balance —
   * deciding executes the refund for real and rejects when nothing is paid. */
  { id: "apr_1", agentId: "agt_care_returns", conversationId: conversations[0]?.id ?? "", action: "refund", target: { type: "order", id: (orders.find((o) => o.paymentStatus === "paid" || o.paymentStatus === "cod_collected") ?? orders[2])?.id ?? "" }, amount: money(18_900), reason: "المنتج وصل تالف والعميل أرسل صورة", status: "pending", decidedBy: null, decidedAt: null, expiresAt: minutesAgo(-45), createdAt: minutesAgo(15) },
  { id: "apr_2", agentId: "agt_sales", conversationId: conversations[1]?.id ?? "", action: "discount_above_limit", target: { type: "order", id: firstOpenOrder?.id ?? "" }, amount: money(5_000), reason: "عميل VIP يطلب خصم 25% على طلب كبير", status: "pending", decidedBy: null, decidedAt: null, expiresAt: minutesAgo(-120), createdAt: minutesAgo(40) },
  { id: "apr_3", agentId: "agt_care", conversationId: conversations[2]?.id ?? "", action: "cancel_order", target: { type: "order", id: orders[0]?.id ?? "" }, amount: null, reason: "العميل طلب الإلغاء قبل الشحن", status: "pending", decidedBy: null, decidedAt: null, expiresAt: minutesAgo(-20), createdAt: minutesAgo(8) },
  { id: "apr_4", agentId: "agt_care_returns", conversationId: conversations[3]?.id ?? "", action: "refund", target: { type: "order", id: orders[5]?.id ?? "" }, amount: money(9_900), reason: "مقاس غير مناسب", status: "approved", decidedBy: "stf_reem", decidedAt: daysAgo(1, 14), expiresAt: daysAgo(1, 16), createdAt: daysAgo(1, 13) },
  { id: "apr_5", agentId: "agt_sales", conversationId: conversations[4]?.id ?? "", action: "discount_above_limit", target: { type: "order", id: orders[8]?.id ?? "" }, amount: money(7_500), reason: "طلب خصم إضافي", status: "rejected", decidedBy: "stf_khalid", decidedAt: daysAgo(2, 10), expiresAt: daysAgo(2, 12), createdAt: daysAgo(2, 9) },
];

/* Abandoned carts — 16 carts covering every recovery status: fresh ones
 * (below the send threshold), messaged (opened/not), recovered (linked order),
 * lost, and guests without a customer record. */
const CART_SOURCES: CartSource[] = ["storefront", "instagram", "google", "whatsapp", "direct"];
const CART_STATUSES: AbandonedCart["recoveryStatus"][] = [
  "not_contacted", "message_sent", "recovered", "lost", "message_sent", "not_contacted", "recovered", "message_sent",
  "not_contacted", "lost", "message_sent", "recovered", "not_contacted", "message_sent", "lost", "not_contacted",
];
export const abandonedCarts: AbandonedCart[] = Array.from({ length: 16 }, (_, i) => {
  const c = customers[(i * 3) % customers.length] as Customer;
  const p1 = products[(i * 4) % products.length] as Product;
  const p2 = products[(i * 4 + 7) % products.length] as Product;
  const p3 = products[(i * 4 + 13) % products.length] as Product;
  const lines = [p1, ...(i % 2 ? [p2] : []), ...(i % 5 === 2 ? [p3] : [])].map((p, n) => ({ variantId: p.variants[0]?.id ?? "", productId: p.id, name: p.name, image: p.media[0] ?? null, quantity: n + 1, price: p.variants[0]?.price ?? money(0) }));
  const status = CART_STATUSES[i % CART_STATUSES.length] ?? "not_contacted";
  const recovered = status === "recovered" ? orders.find((o) => o.customerId === c.id)?.id ?? null : null;
  const attempts: AbandonedCart["recoveryAttempts"] =
    status === "not_contacted"
      ? []
      : [
          { channel: "whatsapp" as const, at: daysAgo(Math.min(i + 1, 20), 21), agentId: "agt_sales", opened: i % 2 === 0, templateId: "tpl_recovery_1", message: null },
          ...(i % 3 === 0 ? [{ channel: "whatsapp" as const, at: daysAgo(Math.min(i, 19), 16), agentId: "agt_sales", opened: i % 4 === 0, templateId: null, message: "خصم 10% لو أكملت طلبك اليوم 🎁" }] : []),
        ];
  return {
    id: `cart_${101 + i}`, customerId: i === 9 || i === 14 ? null : c.id, phone: c.phone, items: lines,
    total: money(lines.reduce((s, l) => s + l.price.amount * l.quantity, 0)),
    abandonedAt: i < 4 ? minutesAgo(30 + i * 40) : daysAgo(Math.min(i, 20), 20), source: CART_SOURCES[i % CART_SOURCES.length] ?? "storefront",
    recoveryStatus: (recovered || status !== "recovered" ? status : "message_sent") as AbandonedCart["recoveryStatus"],
    recoveryAttempts: attempts,
    recoveredOrderId: recovered,
  };
});

/* Notifications */
const lowStock = inventoryLevels.find((l) => l.available <= l.lowStockThreshold);
const waiting = conversations.find((c) => c.status === "waiting_human");
const rejected = invoices.find((i) => i.zatcaStatus === "rejected");
const failedPay = orders.find((o) => o.paymentStatus === "failed");
export const adminNotifications: AdminNotification[] = [
  { id: "ntf_1", event: "order_created", params: { number: orders[0]?.number ?? 0, total: orders[0]?.total.amount ?? 0 }, href: `/orders/${orders[0]?.id}`, ref: orders[0] ? { type: "order", id: orders[0].id } : null, at: minutesAgo(4), read: false, archived: false },
  { id: "ntf_2", event: "approval_requested", params: { agent: "وكيل الاسترجاع", action: "refund" }, href: "/approvals", ref: { type: "approval", id: "apr_1" }, at: minutesAgo(15), read: false, archived: false },
  ...(waiting ? [{ id: "ntf_3", event: "conversation_waiting" as const, params: { customer: waiting.contact.name ?? "" }, href: `/inbox/${waiting.id}`, ref: { type: "conversation" as const, id: waiting.id }, at: minutesAgo(22), read: false, archived: false }] : []),
  ...(failedPay ? [{ id: "ntf_4", event: "payment_failed" as const, params: { number: failedPay.number }, href: `/orders/${failedPay.id}`, ref: { type: "order" as const, id: failedPay.id }, at: minutesAgo(70), read: false, archived: false }] : []),
  ...(lowStock ? [{ id: "ntf_5", event: "low_stock" as const, params: { product: products.find((p) => p.variants.some((v) => v.id === lowStock.variantId))?.name.ar ?? "" }, href: `/inventory/${lowStock.variantId}`, ref: { type: "variant" as const, id: lowStock.variantId }, at: minutesAgo(130), read: true, archived: false }] : []),
  { id: "ntf_6", event: "shipments_delayed", params: { count: shipments.filter((s) => s.status === "failed_attempt").length }, href: "/shipments?status=failed_attempt", ref: null, at: minutesAgo(300), read: true, archived: false },
  ...(rejected ? [{ id: "ntf_7", event: "invoice_rejected" as const, params: { number: rejected.number }, href: `/invoices/${rejected.id}`, ref: { type: "invoice" as const, id: rejected.id }, at: daysAgo(1, 9), read: true, archived: false }] : []),
  ...(returns[0] ? [{ id: "ntf_8", event: "return_requested" as const, params: { number: returns[0].number }, href: `/returns/${returns[0].id}`, ref: { type: "return" as const, id: returns[0].id }, at: daysAgo(1, 8), read: true, archived: true }] : []),
  /* Older rows — history depth for the /notifications list + archived view. */
  ...(orders[3] ? [{ id: "ntf_9", event: "order_created" as const, params: { number: orders[3].number, total: orders[3].total.amount }, href: `/orders/${orders[3].id}`, ref: { type: "order" as const, id: orders[3].id }, at: daysAgo(1, 15), read: true, archived: false }] : []),
  { id: "ntf_10", event: "app_installed", params: { app: "SMSA Express" }, href: "/apps/ins_smsa", ref: { type: "installation", id: "ins_smsa" }, at: daysAgo(2, 11), read: true, archived: false },
  { id: "ntf_11", event: "usage_limit", params: { metric: "محادثات الوكلاء" }, href: "/settings/billing", ref: null, at: daysAgo(2, 18), read: true, archived: false },
  ...(orders[5] ? [{ id: "ntf_12", event: "order_created" as const, params: { number: orders[5].number, total: orders[5].total.amount }, href: `/orders/${orders[5].id}`, ref: { type: "order" as const, id: orders[5].id }, at: daysAgo(3, 10), read: true, archived: true }] : []),
  ...(orders[6] ? [{ id: "ntf_13", event: "payment_failed" as const, params: { number: orders[6].number }, href: `/orders/${orders[6].id}`, ref: { type: "order" as const, id: orders[6].id }, at: daysAgo(3, 14), read: true, archived: true }] : []),
  { id: "ntf_14", event: "conversation_waiting", params: { customer: "عميل جديد" }, href: "/inbox", ref: null, at: daysAgo(4, 12), read: true, archived: true },
];

/* Coupons (used by orders, abandoned-cart incentives) */
const couponUses = (code: string) => orders.filter((o) => o.couponCode === code);
const couponUsages = (code: string): CouponT["usages"] =>
  couponUses(code).map((o) => ({ orderId: o.id, customerId: o.customerId, at: o.createdAt, discount: o.discountTotal, orderTotal: o.total }));
const couponStats = (code: string) => {
  const used = couponUses(code);
  return { uses: used.length, revenue: money(used.reduce((s, o) => s + o.total.amount, 0)), discountGiven: money(used.reduce((s, o) => s + o.discountTotal.amount, 0)) };
};
export const coupons: CouponT[] = [
  { id: "cpn_watan20", code: "WATAN20", type: "percentage", value: 20, maxDiscount: money(10_000), minOrderAmount: money(15_000), appliesTo: { type: "all", ids: [] }, excludeSaleItems: true, usageLimit: 500, usageLimitPerCustomer: 1, customerEligibility: { type: "all", customerIds: [] }, startsAt: daysAgo(20, 0), endsAt: daysAgo(-5, 0), status: "active", stats: couponStats("WATAN20"), usages: couponUsages("WATAN20"), createdBy: staffActor(staff[0]) },
  { id: "cpn_back10", code: "BACK10", type: "percentage", value: 10, maxDiscount: money(5_000), minOrderAmount: null, appliesTo: { type: "all", ids: [] }, excludeSaleItems: false, usageLimit: null, usageLimitPerCustomer: 1, customerEligibility: { type: "all", customerIds: [] }, startsAt: daysAgo(60, 0), endsAt: null, status: "active", stats: couponStats("BACK10"), usages: couponUsages("BACK10"), createdBy: staffActor(staff[0]) },
  { id: "cpn_freeship", code: "FREESHIP", type: "free_shipping", value: 0, maxDiscount: null, minOrderAmount: money(20_000), appliesTo: { type: "all", ids: [] }, excludeSaleItems: false, usageLimit: 200, usageLimitPerCustomer: null, customerEligibility: { type: "all", customerIds: [] }, startsAt: daysAgo(10, 0), endsAt: daysAgo(-20, 0), status: "active", stats: couponStats("FREESHIP"), usages: couponUsages("FREESHIP"), createdBy: staffActor(staff[1]) },
  { id: "cpn_eid50", code: "EID50", type: "fixed", value: 5_000, maxDiscount: null, minOrderAmount: money(30_000), appliesTo: { type: "all", ids: [] }, excludeSaleItems: true, usageLimit: 300, usageLimitPerCustomer: 1, customerEligibility: { type: "all", customerIds: [] }, startsAt: daysAgo(90, 0), endsAt: daysAgo(40, 0), status: "expired", stats: couponStats("EID50"), usages: couponUsages("EID50"), createdBy: staffActor(staff[1]) },
];

/* Collections (§4.4) — manual lists reference products; automatic ones resolve via rules in the api layer. */
export const collections: Collection[] = [
  { id: "col_new", name: { ar: "وصل حديثاً", en: "New Arrivals" }, slug: "new-arrivals", description: { ar: "أحدث المنتجات المضافة للمتجر." }, image: media("med_col_new", 200, "وصل حديثاً"), seo: { title: "وصل حديثاً", description: "تسوق أحدث منتجات نخلة." }, type: "manual", productIds: products.slice(24, 30).map((p) => p.id), rules: [], match: "all" },
  { id: "col_gifts", name: { ar: "أفكار الهدايا", en: "Gift Ideas" }, slug: "gift-ideas", description: { ar: "مختارات تناسب الإهداء مع تغليف مجاني." }, image: media("med_col_gifts", 340, "أفكار الهدايا"), seo: { title: "أفكار الهدايا", description: "هدايا مختارة بعناية." }, type: "manual", productIds: ["prd_001", "prd_004", "prd_008", "prd_011", "prd_017", "prd_021"], rules: [], match: "all" },
  { id: "col_under100", name: { ar: "بأقل من 100 ر.س", en: "Under 100 SAR" }, slug: "under-100", description: { ar: "منتجات بأسعار اقتصادية." }, image: null, seo: { title: "بأقل من 100 ر.س", description: "تسوق منتجات بأقل من 100 ريال." }, type: "automatic", productIds: [], rules: [{ field: "price", op: "lt", value: "10000" }], match: "all" },
  { id: "col_perfumes", name: { ar: "ركن العطور", en: "Perfume Corner" }, slug: "perfume-corner", description: { ar: "كل العطور والبخور في مكان واحد." }, image: null, seo: { title: "ركن العطور", description: "تشكيلة العطور والبخور." }, type: "automatic", productIds: [], rules: [{ field: "category", op: "eq", value: "cat_perfume" }], match: "all" },
  { id: "col_lowstock", name: { ar: "كميات محدودة", en: "Almost Gone" }, slug: "almost-gone", description: { ar: "منتجات قاربت تنفذ." }, image: null, seo: { title: "كميات محدودة", description: "اطلبها قبل نفاد الكمية." }, type: "automatic", productIds: [], rules: [{ field: "stock", op: "lt", value: "10" }], match: "all" },
];

/* Imports (§5.11) */
export const importJobs: ImportJob[] = [
  { id: "imp_1", type: "products", source: "salla", fileName: "salla-products.csv", status: "completed", rowsSucceeded: 28, rowsFailed: 2, errorFileUrl: "#", actor: staffActor(staff[0]), at: daysAgo(6, 13) },
  { id: "imp_2", type: "customers", source: "file", fileName: "customers-vip.xlsx", status: "completed", rowsSucceeded: 140, rowsFailed: 0, errorFileUrl: null, actor: staffActor(staff[1]), at: daysAgo(12, 10) },
  { id: "imp_3", type: "inventory", source: "file", fileName: "stock-count.csv", status: "failed", rowsSucceeded: 41, rowsFailed: 9, errorFileUrl: "#", actor: staffActor(staff[3]), at: daysAgo(2, 16) },
  { id: "imp_4", type: "products", source: "zid", fileName: "zid-export.csv", status: "processing", rowsSucceeded: 0, rowsFailed: 0, errorFileUrl: null, actor: staffActor(staff[0]), at: minutesAgo(25) },
];

/* Promotions (§4.13) */
export const promotions: Promotion[] = [
  { id: "prm_1", name: { ar: "اشترِ عطرين وخذ الثالث مجاناً", en: "Buy 2 perfumes, get 1 free" }, type: "buy_x_get_y", status: "active", benefit: { kind: "buy_x_get_y", value: null }, config: { buy: 2, get: 1 }, startsAt: daysAgo(15, 9), endsAt: daysAgo(-15, 9), stats: { orders: 34, revenue: money(612_000) }, createdBy: staffActor(staff[0]) },
  { id: "prm_2", name: { ar: "خصم 15% على القهوة", en: "15% off coffee" }, type: "percentage", status: "active", benefit: { kind: "percentage", value: 15 }, config: null, startsAt: daysAgo(8, 0), endsAt: daysAgo(-8, 0), stats: { orders: 51, revenue: money(408_500) }, createdBy: staffActor(staff[0]) },
  { id: "prm_3", name: { ar: "شحن مجاني للطلبات فوق 300", en: "Free shipping over 300" }, type: "free_shipping", status: "scheduled", benefit: { kind: "free_shipping", value: null }, config: null, startsAt: daysAgo(-3, 0), endsAt: daysAgo(-30, 0), stats: { orders: 0, revenue: money(0) }, createdBy: staffActor(staff[1]) },
  { id: "prm_4", name: { ar: "عرض اليوم الوطني: خصم 50 ر.س", en: "National Day: 50 SAR off" }, type: "fixed_amount", status: "expired", benefit: { kind: "amount", value: 5_000 }, config: null, startsAt: daysAgo(120, 0), endsAt: daysAgo(95, 0), stats: { orders: 96, revenue: money(1_920_000) }, createdBy: staffActor(staff[1]) },
];

/* Home screen aggregates (traffic/setup have no entity of their own) —
 * `...seed.dashboardSummary` adds the KPI + salesSeries fields the
 * reports screens need (was `legacyApi.dashboard.summary`). */
export const homeAnalytics: HomeAnalytics = {
  ...seed.dashboardSummary,
  visitors: { today: 164, yesterday: 141 },
  setup: { products: true, payments: true, shipping: true, whatsapp: true, domain: false, published: false },
};

/* Recovery cadence: `delay` is the first reminder (also the abandonment
 * threshold + dedupe window), `secondReminder` schedules the follow-up.
 * Exclusions: `excludeRecentOrdersDays` skips customers who ordered recently
 * (0 = off); `excludeOptedOut` skips phones without WhatsApp consent. */
export const cartRecoverySettings = {
  autoRecovery: true,
  delay: "1h" as "1h" | "24h",
  secondReminder: "24h" as "24h" | "48h" | null,
  agentId: "agt_sales",
  couponId: "cpn_back10" as string | null,
  excludeRecentOrdersDays: 3,
  excludeOptedOut: true,
};

/* Editable cart-recovery message templates (§5.6) — picked in the send dialog
 * or used by the mocked auto-recovery job. */
export const recoveryTemplates: RecoveryTemplate[] = [
  {
    id: "tpl_recovery_1", name: { ar: "تذكير ودّي", en: "Friendly reminder" }, channel: "whatsapp", enabled: true,
    content: {
      ar: "هلا {name} 👋 نسيت شي في سلتك في {store} — كمّل طلبك من هنا: {link}",
      en: "Hey {name} 👋 you left something in your cart at {store} — finish your order here: {link}",
    },
  },
  {
    id: "tpl_recovery_2", name: { ar: "خصم تحفيزي", en: "Incentive discount" }, channel: "whatsapp", enabled: true,
    content: {
      ar: "سلتك بانتظارك! استخدم كود {coupon} واحصل على خصم على طلبك من {store}: {link}",
      en: "Your cart is waiting! Use code {coupon} for a discount on your {store} order: {link}",
    },
  },
  {
    id: "tpl_recovery_3", name: { ar: "رسالة SMS قصيرة", en: "Short SMS" }, channel: "sms", enabled: true,
    content: {
      ar: "{store}: عندك منتجات في السلة — أكمل طلبك: {link}",
      en: "{store}: you have items in your cart — complete your order: {link}",
    },
  },
];

/* Returns policy (§4.21) — enforced by returns.create: window in days from
 * order creation, enabled reasons, and per-product exclusions (the digital
 * gift card can never be returned). */
export const returnPolicy: ReturnPolicySettings = {
  windowDays: 14,
  reasons: ["damaged", "wrong_item", "not_as_described", "size_issue", "changed_mind", "other"],
  nonReturnableProductIds: ["prd_031"],
  allowExchange: true,
  allowStoreCredit: true,
};

/* Apps marketplace (§4.21, §5.22) */
const app = (
  id: string, ar: string, en: string, category: string, shortAr: string, shortEn: string, descAr: string, descEn: string,
  developer: string, scopes: string[], pricing: App["pricing"], rating: number, installs: number, hue: number,
): App => ({
  id, name: { ar, en }, icon: media(`med_${id}`, hue, ar), developer, category,
  shortDescription: { ar: shortAr, en: shortEn }, description: { ar: descAr, en: descEn },
  screenshots: [media(`med_${id}_s1`, hue + 10, ar), media(`med_${id}_s2`, hue + 20, ar)],
  scopes, pricing, rating, installsCount: installs, status: "approved",
  supportEmail: `support@${id.replace(/^app_/, "")}.app`, privacyUrl: "#",
});
const monthly = (price: number): App["pricing"] => ({ type: "monthly", price: money(price) });
export const apps: App[] = [
  app("app_tabby", "تابي", "Tabby", "payments", "قسّم مشترياتك على 4 دفعات بدون فوائد.", "Split purchases into 4 interest-free payments.",
    "اعرض تابي كطريقة دفع في السلة والدفع — يزيد التحويل ومتوسط قيمة الطلب.", "Offer Tabby at checkout to lift conversion and average order value.",
    "Tabby", ["orders.read", "customers.read"], { type: "free", price: null }, 4.8, 12_400, 160),
  app("app_tamara", "تمارا", "Tamara", "payments", "اشترِ الحين وادفع بعدين.", "Buy now, pay later.",
    "تمارا تضيف الدفع بالتقسيط لمتجرك مع تسوية أسبوعية.", "Tamara adds instalment payments to your store with weekly settlement.",
    "Tamara", ["orders.read", "customers.read"], { type: "free", price: null }, 4.7, 9_800, 25),
  app("app_paygate", "بوابة الدفع", "Pay Gateway", "payments", "بوابة دفع محلية تدعم مدى وApple Pay.", "A local gateway supporting mada and Apple Pay.",
    "استقبل مدى وApple Pay والبطاقات من بوابة واحدة.", "Accept mada, Apple Pay and cards from a single gateway.",
    "PayGate", ["orders.read"], { type: "free", price: null }, 4.6, 6_100, 265),
  app("app_smsa", "سمسا", "SMSA", "shipping", "اربط شحنات سمسا واطبع البوالص تلقائياً.", "Connect SMSA shipments and print labels automatically.",
    "أنشئ الشحنات والبوالص من صفحة الطلب مباشرة وتتبع الحالة لحظياً.", "Create shipments and labels from the order page and track status live.",
    "SMSA Express", ["orders.read", "shipments.manage"], { type: "free", price: null }, 4.4, 7_300, 205),
  app("app_torod", "طرود", "Torod", "shipping", "قارن أسعار شركات الشحن واختر الأنسب.", "Compare carrier rates and pick the best.",
    "طرود يقارن أسعار أكثر من 20 شركة شحن ويحجز الأرخص لكل شحنة.", "Torod compares 20+ carriers and books the cheapest per shipment.",
    "Torod", ["orders.read", "shipments.manage", "customers.read"], monthly(4_900), 4.5, 3_900, 190),
  app("app_snap_pixel", "سناب بكسل", "Snap Pixel", "marketing", "تتبّع التحويلات من إعلانات سناب شات.", "Track conversions from Snapchat ads.",
    "اربط بكسل سناب لقياس الحملات والتحويلات بدقة.", "Connect Snap Pixel to measure campaigns and conversions accurately.",
    "Snap Inc.", ["orders.read", "reports.read"], { type: "free", price: null }, 4.3, 5_200, 55),
  app("app_mailchimp", "ميل تشيمب", "Mailchimp", "marketing", "أرسل حملات بريدية لعملائك.", "Send email campaigns to your customers.",
    "زامن عملاءك وشرائحهم مع ميل تشيمب وأرسل نشرات تلقائية.", "Sync customers and segments to Mailchimp and send automated newsletters.",
    "Mailchimp", ["customers.read", "customers.export"], monthly(7_900), 4.2, 4_400, 45),
  app("app_google_shopping", "جوجل للتسوق", "Google Shopping", "marketing", "اعرض منتجاتك في جوجل للتسوق.", "Show your products on Google Shopping.",
    "يولّد خلاصة منتجات محدثة ويربطها بحساب Merchant Center.", "Generates an up-to-date product feed linked to Merchant Center.",
    "Google", ["products.read"], { type: "free", price: null }, 4.6, 8_700, 215),
  app("app_qoyod", "قيود", "Qoyod", "accounting", "مزامنة الفواتير والمبيعات مع قيود.", "Sync invoices and sales with Qoyod.",
    "كل فاتورة تتحول لقيود محاسبية تلقائياً — تقارير ضريبية جاهزة.", "Every invoice becomes an accounting entry automatically — ready tax reports.",
    "Qoyod", ["invoices.read", "orders.read"], monthly(9_900), 4.7, 2_800, 225),
  app("app_daftra", "دفترة", "Daftra", "accounting", "محاسبة ومخزون في مكان واحد.", "Accounting and inventory in one place.",
    "دفترة تزامن مبيعاتك ومخزونك وتطلع تقارير الإيرادات.", "Daftra syncs sales and inventory and produces revenue reports.",
    "Daftra", ["invoices.read", "products.read", "inventory.manage"], monthly(6_900), 4.4, 2_100, 200),
  app("app_ai_photos", "صور ذكية", "AI Photos", "ai", "حسّن صور منتجاتك وشيل الخلفية بضغطة.", "Enhance product photos and remove backgrounds in one click.",
    "ذكاء اصطناعي يحسّن إضاءة الصور ويشيل الخلفية بجودة الاستوديو.", "AI enhances lighting and removes backgrounds with studio quality.",
    "Nakhla Labs", ["products.read", "products.manage"], monthly(2_900), 4.9, 11_200, 290),
  app("app_ai_translate", "مترجم المنتجات", "Product Translator", "ai", "ترجم منتجاتك للإنجليزي تلقائياً.", "Translate your products to English automatically.",
    "ترجمة احترافية لأسماء ووصف المنتجات مع مراجعة قبل النشر.", "Professional translation of product names and descriptions with review before publish.",
    "Nakhla Labs", ["products.read", "products.manage"], monthly(1_900), 4.6, 6_900, 320),
];

export const appInstallations: AppInstallation[] = [
  { id: "ins_tabby", appId: "app_tabby", grantedScopes: ["orders.read", "customers.read"], installedBy: "stf_khalid", installedAt: daysAgo(45, 11), lastActivityAt: minutesAgo(40), status: "active" },
  { id: "ins_smsa", appId: "app_smsa", grantedScopes: ["orders.read", "shipments.manage"], installedBy: "stf_reem", installedAt: daysAgo(30, 15), lastActivityAt: minutesAgo(180), status: "active" },
  { id: "ins_snap", appId: "app_snap_pixel", grantedScopes: ["orders.read", "reports.read"], installedBy: "stf_khalid", installedAt: daysAgo(12, 10), lastActivityAt: daysAgo(2, 14), status: "active" },
  { id: "ins_mailchimp", appId: "app_mailchimp", grantedScopes: ["customers.read", "customers.export"], installedBy: "stf_reem", installedAt: daysAgo(80, 9), lastActivityAt: daysAgo(40, 12), status: "uninstalled" },
];

/* Audit log (§4.22) — powers settings → سجل العمليات and app activity feeds. */
const audit = (id: string, actor: ActorRef, action: string, target: AuditLog["target"], changes: AuditLog["changes"], at: string): AuditLog =>
  ({ id, actor, action, target, changes, ip: "95.187.44.12", at });
export const auditLog: AuditLog[] = [
  audit("aud_1", staffActor(staff[0]), "app.installed", { type: "installation", id: "ins_tabby", label: "تابي" }, [], daysAgo(45, 11)),
  audit("aud_2", staffActor(staff[1]), "app.installed", { type: "installation", id: "ins_smsa", label: "سمسا" }, [], daysAgo(30, 15)),
  audit("aud_3", staffActor(staff[0]), "app.installed", { type: "installation", id: "ins_snap", label: "سناب بكسل" }, [], daysAgo(12, 10)),
  audit("aud_4", staffActor(staff[1]), "app.uninstalled", { type: "installation", id: "ins_mailchimp", label: "ميل تشيمب" }, [], daysAgo(40, 12)),
  audit("aud_5", { type: "app", id: "app_smsa", name: "سمسا" }, "shipment.created", { type: "shipment", id: shipments[0]?.id ?? "", label: shipments[0]?.trackingNumber ?? "" }, [{ field: "status", from: null, to: "label_created" }], minutesAgo(180)),
  audit("aud_6", { type: "app", id: "app_tabby", name: "تابي" }, "order.paid", { type: "order", id: orders[1]?.id ?? "", label: `#${orders[1]?.number ?? ""}` }, [{ field: "paymentStatus", from: "pending", to: "paid" }], minutesAgo(40)),
  audit("aud_7", { type: "app", id: "app_snap_pixel", name: "سناب بكسل" }, "reports.synced", null, [], daysAgo(2, 14)),
  audit("aud_8", staffActor(staff[1]), "product.updated", { type: "product", id: products[0]?.id ?? "", label: products[0]?.name.ar ?? "" }, [{ field: "price", from: "18900", to: "19900" }], daysAgo(1, 13)),
  audit("aud_9", staffActor(staff[0]), "staff.invited", { type: "staff", id: "stf_majed", label: "ماجد الشمري" }, [], daysAgo(4, 10)),
  audit("aud_10", staffActor(staff[0]), "settings.updated", null, [{ field: "vatNumber", from: null, to: "310123456700003" }], daysAgo(6, 9)),
];

/* Back-in-stock (spec §8.10) — storefront "أعلمني عند التوفر" signups; `notifiedAt: null` = still waiting. */
export const backInStockRequests: BackInStockSubscription[] = [
  { id: "bis_1", productId: "prd_010", phone: "+966501234567", createdAt: daysAgo(2, 14), notifiedAt: null },
  { id: "bis_2", productId: "prd_010", phone: "+966555987654", createdAt: daysAgo(1, 9), notifiedAt: null },
  { id: "bis_3", productId: "prd_016", phone: "+966541112222", createdAt: daysAgo(3, 18), notifiedAt: daysAgo(1, 10) },
];

/* Reviews (spec §8.3) — PDP shows `approved` only; `pending`/`hidden` fill the merchant queue filters. */
export const reviews: Review[] = [
  { id: "rev_01", productId: "prd_001", customerId: "cus_002", rating: 5, text: "قهوة ممتازة والهيل طازج، التحميص واضح انه حديث. طلبتها ثاني مرة.", images: ["placeholder:32", "placeholder:28"], verifiedPurchase: true, status: "approved", createdAt: daysAgo(2, 14) },
  { id: "rev_02", productId: "prd_001", customerId: "cus_005", rating: 4, text: "الطعم قوي ويعجبني، بس التوصيل تأخر يوم عن الموعد.", verifiedPurchase: true, status: "approved", createdAt: daysAgo(5, 18) },
  { id: "rev_03", productId: "prd_001", customerId: "cus_009", rating: 2, text: "وصلتني العبوة مفتوحة جزئياً والقهوة مبعثرة داخل الكرتون.", images: ["placeholder:30"], verifiedPurchase: true, status: "approved", merchantReply: { text: "نعتذر منك، تواصلنا مع شركة الشحن ورفقنا لك عبوة بديلة مع طلبك القادم.", at: daysAgo(6, 11) }, createdAt: daysAgo(7, 20) },
  { id: "rev_04", productId: "prd_001", customerId: "cus_014", rating: 5, text: "أفضل قهوة سعودية جربتها، الريحة تفتح النفس. التغليف فخم ويصلح هدية.", verifiedPurchase: true, status: "pending", createdAt: daysAgo(1, 9) },
  { id: "rev_05", productId: "prd_008", customerId: "cus_003", rating: 5, text: "بخور يريح البيت، الريحة تدوم ساعات بعد الإطفاء.", verifiedPurchase: true, status: "approved", createdAt: daysAgo(3, 21) },
  { id: "rev_06", productId: "prd_008", customerId: "cus_011", rating: 3, text: "الريحة حلوة بس خفيفة شوي على ذوقي، كنت أتوقعها أقوى.", verifiedPurchase: true, status: "approved", createdAt: daysAgo(9, 16) },
  { id: "rev_07", productId: "prd_008", customerId: "cus_018", rating: 1, text: "الكرتون وصل مضروب وكم قطعة مكسورة من الداخل.", images: ["placeholder:20"], verifiedPurchase: true, status: "hidden", createdAt: daysAgo(12, 13) },
  { id: "rev_08", productId: "prd_013", customerId: "cus_006", rating: 5, text: "القماش قطني ومريح، الخياطة نظيفة والمقاس مضبوط.", verifiedPurchase: true, status: "approved", createdAt: daysAgo(4, 15) },
  { id: "rev_09", productId: "prd_013", customerId: "cus_021", rating: 4, text: "جودة ممتازة للسعر، اللون أحمر عميق مثل الصور تماماً.", images: ["placeholder:210"], verifiedPurchase: false, status: "approved", createdAt: daysAgo(8, 19) },
  { id: "rev_10", productId: "prd_013", customerId: "cus_025", rating: 2, text: "المقاس أصغر من المتوقع، نصيحتي اطلبوا مقاس أكبر.", verifiedPurchase: true, status: "pending", createdAt: daysAgo(1, 17) },
  { id: "rev_11", productId: "prd_016", customerId: "cus_008", rating: 5, text: "شغل يدوي واضح والجلد طبيعي، تستاهل كل ريال.", verifiedPurchase: true, status: "approved", createdAt: daysAgo(6, 12) },
  { id: "rev_12", productId: "prd_016", customerId: "cus_023", rating: 4, text: "الحجم مناسب للجامعة والدوام، بس السحاب يحتاج شوي وقت لين يلين.", verifiedPurchase: true, status: "approved", createdAt: daysAgo(11, 14) },
];

/* Copilot (§4.23) — scheduled tasks + alerts seeded for the tasks screen, one
 * saved conversation plus one shared-by-a-colleague thread for the history view. */
export const copilotTasks: CopilotTask[] = [
  {
    id: "cpt_1", storeId: "nakhla", kind: "scheduled", title: "ملخص المبيعات اليومي",
    prompt: "كل يوم 9 الصبح أرسل لي ملخص المبيعات",
    schedule: { hour: 9, minute: 0 }, enabled: true,
    createdAt: daysAgo(6, 9), lastRunAt: daysAgo(0, 9),
  },
  {
    id: "cpt_2", storeId: "nakhla", kind: "alert", title: "تنبيه انخفاض مخزون العطور",
    prompt: "نبهني إذا نزل مخزون أي عطر تحت 5",
    schedule: { hour: 9 }, threshold: 5, enabled: true,
    createdAt: daysAgo(3, 14), lastRunAt: null,
  },
];

export const copilotSettings: CopilotSettings = {
  alwaysConfirm: { write: true, dangerous: true, bulk: true },
  blockedTools: [],
  language: "ar",
  dialect: "gulf",
};

export const copilotConversations: CopilotConversation[] = [
  {
    id: "cvc_1", storeId: "nakhla", title: "أفضل 5 منتجات مبيعاً",
    messages: [
      { id: "cvm_1a", role: "user", text: "وش أفضل 5 منتجات مبيعاً عندي؟", createdAt: daysAgo(1, 21) },
      {
        id: "cvm_1b", role: "assistant", createdAt: daysAgo(1, 21),
        response: { kind: "text", text: "عرضت لك جدول أفضل المنتجات مبيعاً آخر 30 يوم — دهن العود متصدّر." },
      },
    ],
    pinned: true, shared: false, ownerId: currentStaff.id, createdAt: daysAgo(1, 21), updatedAt: daysAgo(1, 21),
  },
  {
    id: "cvc_2", storeId: "nakhla", title: "تحليل انخفاض المبيعات",
    messages: [
      { id: "cvm_2a", role: "user", text: "حلّل لي انخفاض المبيعات هذا الأسبوع", createdAt: daysAgo(2, 15) },
      {
        id: "cvm_2b", role: "assistant", createdAt: daysAgo(2, 15),
        response: { kind: "text", text: "مبيعات الأسبوع أقل من سابقه — راجع السلات المتروكة وسرعة التجهيز." },
      },
    ],
    pinned: false, shared: true, ownerId: staff[1]?.id ?? currentStaff.id, createdAt: daysAgo(2, 15), updatedAt: daysAgo(2, 15),
  },
];

export { themes } from "./themes";
export { pages, menus, domains, seoRedirects, storefrontSeo } from "./storefront";
export * from "./growth";

export * from "./platform";
export * from "./settings";
