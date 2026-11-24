import { inPeriod } from "@repo/api-client";
import type { Customer, Order, Shipment } from "@repo/contracts";

/** Flattened row the table/filters work on — order + customer resolved once. */
export interface Row {
  shipment: Shipment;
  order: Order | null;
  customerName: string;
  phone: string;
  city: string;
  createdAt: string | null;
  lastUpdate: string | null;
  delayed: boolean;
  /** Open shipment with no carrier scan in the last 3 days. */
  stale: boolean;
}

/** URL-persisted filter state — defaults drop out of the query string. */
type FilterKey = "q" | "status" | "carrier" | "service" | "date" | "delayed" | "cod" | "stale";
export const DEFAULTS: Record<FilterKey, string> = {
  q: "",
  status: "all",
  carrier: "all",
  service: "all",
  date: "all",
  delayed: "",
  cod: "",
  stale: "",
};
export type Filters = typeof DEFAULTS;

const STALE_MS = 3 * 86_400_000;
const OPEN: string[] = ["label_created", "picked_up", "in_transit", "out_for_delivery", "failed_attempt"];

export function buildRows(shipments: Shipment[], orders: Order[], customers: Customer[]): Row[] {
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const customerById = new Map(customers.map((c) => [c.id, c]));
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  return shipments.map((s) => {
    const order = orderById.get(s.orderId) ?? null;
    const open = OPEN.includes(s.status);
    const lastUpdate = s.events.at(-1)?.at ?? null;
    const customer = customerById.get(s.customerId);
    return {
      shipment: s,
      order,
      customerName: customer?.name ?? order?.shippingAddress.recipientName ?? "",
      phone: customer?.phone ?? order?.shippingAddress.phone ?? "",
      city: order?.shippingAddress.city ?? "",
      createdAt: s.events[0]?.at ?? null,
      lastUpdate,
      delayed: open && Boolean(s.estimatedDelivery && s.estimatedDelivery < today),
      stale: open && (!lastUpdate || now - new Date(lastUpdate).getTime() > STALE_MS),
    };
  });
}

export function filterRows(rows: Row[], f: Filters): Row[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (f.status === "all" || r.shipment.status === f.status) &&
      (f.carrier === "all" || r.shipment.carrier === f.carrier) &&
      (f.service === "all" || r.shipment.service === f.service) &&
      (f.date === "all" || (r.createdAt ? inPeriod(r.createdAt, f.date) : false)) &&
      (f.delayed !== "1" || r.delayed) &&
      (f.cod !== "1" || Boolean(r.shipment.codAmount)) &&
      (f.stale !== "1" || r.stale) &&
      (q === "" ||
        (r.shipment.trackingNumber ?? "").toLowerCase().includes(q) ||
        String(r.order?.number ?? "").includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))),
  );
}

export const hasFilters = (f: Filters) => Object.entries(f).some(([k, v]) => v !== DEFAULTS[k as keyof Filters]);

/** Label eligibility — the carrier must have issued a label + tracking pair. */
export const labelEligible = (r: Row): boolean => Boolean(r.shipment.trackingNumber) && Boolean(r.shipment.labelNumber) && Boolean(r.order);
