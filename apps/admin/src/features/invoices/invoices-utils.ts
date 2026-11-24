import { inPeriod } from "@repo/api-client";
import type { Invoice, Order } from "@repo/contracts";

/** Issue-side status derived from the linked order's payment state — kept
 * separate from `zatcaStatus` (the tax-authority side) on purpose: a fully
 * paid invoice can still be ZATCA-rejected and vice versa. */
export type IssueStatus = "issued" | "paid" | "unpaid" | "partially_refunded" | "refunded" | "cancelled";

export interface Row {
  invoice: Invoice;
  order: Order | null;
  issueStatus: IssueStatus;
  /** For credit notes — the sale invoice they offset. */
  original: Invoice | null;
}

type FilterKey = "q" | "type" | "zatca" | "status" | "date" | "returns";
export const DEFAULTS: Record<FilterKey, string> = {
  q: "",
  type: "all",
  zatca: "all",
  status: "all",
  date: "all",
  returns: "",
};
export type Filters = typeof DEFAULTS;

export function issueStatusOf(invoice: Invoice, order: Order | null): IssueStatus {
  if (invoice.type === "credit_note") return "issued";
  if (order?.status === "cancelled") return "cancelled";
  switch (order?.paymentStatus) {
    case "paid":
    case "cod_collected":
      return "paid";
    case "partially_refunded":
      return "partially_refunded";
    case "refunded":
      return "refunded";
    default:
      return "unpaid";
  }
}

export function buildRows(invoices: Invoice[], orders: Order[]): Row[] {
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const byId = new Map(invoices.map((i) => [i.id, i]));
  return invoices.map((invoice) => {
    const order = orderById.get(invoice.orderId) ?? null;
    return { invoice, order, issueStatus: issueStatusOf(invoice, order), original: invoice.relatedInvoiceId ? (byId.get(invoice.relatedInvoiceId) ?? null) : null };
  });
}

export function filterRows(rows: Row[], f: Filters): Row[] {
  const q = f.q.trim().toLowerCase();
  return rows.filter(
    (r) =>
      (f.type === "all" || r.invoice.type === f.type) &&
      (f.zatca === "all" || r.invoice.zatcaStatus === f.zatca) &&
      (f.status === "all" || r.issueStatus === f.status) &&
      (f.date === "all" || inPeriod(r.invoice.issuedAt, f.date)) &&
      (f.returns !== "1" || r.invoice.type === "credit_note") &&
      (q === "" ||
        r.invoice.number.toLowerCase().includes(q) ||
        String(r.order?.number ?? "").includes(q) ||
        r.invoice.customer.name.toLowerCase().includes(q) ||
        (r.original?.number ?? "").toLowerCase().includes(q)),
  );
}

export const hasFilters = (f: Filters) => Object.entries(f).some(([k, v]) => v !== DEFAULTS[k as keyof Filters]);
