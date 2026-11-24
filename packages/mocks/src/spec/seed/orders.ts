import type { SeedCustomer, SeedOrder, SeedOrderEvent, SeedOrderItem, SeedOrderStatus, SeedPaymentMethod, SeedPaymentStatus } from "./types";
import { products } from "./catalog";
import { baseCustomers, districts } from "./people";
import { createRandom, daysAgo, NOW } from "../../data/seed";

const random = createRandom(20261122);
const FLOW: SeedOrderStatus[] = ["new", "processing", "ready", "shipped", "delivered"];

const statusWeights = [
  ["new", 7],
  ["processing", 8],
  ["ready", 5],
  ["shipped", 9],
  ["delivered", 16],
  ["cancelled", 3],
  ["returned", 2],
] as const;

const methods = [
  ["mada", 8],
  ["applePay", 7],
  ["visa", 4],
  ["stcPay", 3],
  ["tabby", 3],
  ["tamara", 2],
  ["cod", 3],
] as const;

function timeline(status: SeedOrderStatus, createdAt: string): SeedOrderEvent[] {
  const start = new Date(createdAt).getTime();
  const step = (n: number) => new Date(Math.min(start + n * 7 * 3_600_000, NOW)).toISOString();
  if (status === "cancelled") {
    return [
      { status: "new", at: createdAt, actor: "system" },
      { status: "cancelled", at: step(1), actor: "staff" },
    ];
  }
  const reach = status === "returned" ? FLOW.length : FLOW.indexOf(status) + 1;
  const events: SeedOrderEvent[] = FLOW.slice(0, reach).map((s, i) => ({
    status: s,
    at: i === 0 ? createdAt : step(i),
    actor: i === 0 ? "system" : i === 1 ? "agent" : "staff",
  }));
  if (status === "returned") events.push({ status: "returned", at: step(reach + 2), actor: "staff" });
  return events;
}

function paymentStatus(status: SeedOrderStatus, method: SeedPaymentMethod): SeedPaymentStatus {
  if (status === "returned") return "refunded";
  if (status === "cancelled") return random.next() > 0.5 ? "refunded" : "failed";
  if (method === "cod") return status === "delivered" ? "paid" : "pending";
  return random.next() > 0.92 ? "pending" : "paid";
}

const sellable = products.filter((p) => p.status === "active");

export const orders: SeedOrder[] = Array.from({ length: 50 }, (_, i) => {
  const customer = random.pick(baseCustomers.slice(0, 26));
  const age = Math.floor((i / 50) * 29);
  const createdAt = daysAgo(age, random.int(8, 23), random.int(0, 59));
  const status: SeedOrderStatus =
    age <= 1 && i % 3 !== 0 ? random.pick(["new", "processing"] as const) : random.weighted(statusWeights);
  const method: SeedPaymentMethod = random.weighted(methods);

  const lineCount = random.weighted([
    [1, 5],
    [2, 3],
    [3, 2],
  ] as const);
  const items: SeedOrderItem[] = [];
  for (let l = 0; l < lineCount; l++) {
    const p = random.pick(sellable);
    if (items.some((it) => it.productId === p.id)) continue;
    items.push({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      imageHue: p.imageHue,
      quantity: random.weighted([
        [1, 6],
        [2, 3],
        [3, 1],
      ] as const),
      unitPrice: p.price,
    });
  }

  const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
  const shippingFee = subtotal >= 30000 ? 0 : 2500;
  const discount = i % 6 === 0 ? Math.round(subtotal * 0.1) : 0;
  const total = subtotal + shippingFee - discount;
  const city = customer.city;
  const shipped = ["shipped", "delivered", "returned"].includes(status);

  return {
    id: `ord_${10290 - i}`,
    number: 10290 - i,
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    items,
    subtotal,
    shippingFee,
    discount,
    vat: Math.round((total * 15) / 115),
    total,
    status,
    paymentStatus: paymentStatus(status, method),
    paymentMethod: method,
    carrier: random.pick(["aramex", "smsa", "spl", "redbox"] as const),
    trackingNumber: shipped ? `SA${random.int(100000000, 999999999)}` : null,
    channel: random.weighted([
      ["store", 7],
      ["whatsapp", 2],
      ["instagram", 1],
    ] as const),
    address: {
      city,
      district: random.pick(districts[city] ?? ["حي النزهة", "حي الربوة"]),
      street: `شارع ${random.pick(["الأمير سلطان", "التحلية", "الملك فهد", "عثمان بن عفان", "الستين"])}، مبنى ${random.int(2, 90)}`,
    },
    note: i % 9 === 2 ? "الرجاء التواصل قبل التوصيل" : null,
    createdAt,
    timeline: timeline(status, createdAt),
  };
});

export const customers: SeedCustomer[] = baseCustomers.map((c) => {
  const own = orders.filter((o) => o.customerId === c.id && o.status !== "cancelled");
  const totalSpent = own.reduce((sum, o) => sum + o.total, 0);
  const lastOrderAt = own[0]?.createdAt ?? null;
  const daysSince = lastOrderAt ? (NOW - new Date(lastOrderAt).getTime()) / 86_400_000 : Infinity;
  const segment =
    totalSpent > 150000 || own.length >= 4
      ? "vip"
      : own.length === 0
        ? "new"
        : daysSince > 21
          ? "atRisk"
          : own.length >= 2
            ? "returning"
            : "new";
  return { ...c, ordersCount: own.length, totalSpent, lastOrderAt, segment };
});
