import type { Order } from "@repo/contracts";
import type { SalesPoint } from "@repo/contracts";

export const REPORT_TYPES = ["sales", "products", "customers", "agents", "marketing", "tax"] as const;
export type ReportType = (typeof REPORT_TYPES)[number];
export const isReportType = (v: string): v is ReportType => (REPORT_TYPES as readonly string[]).includes(v);

const DAY = 86_400_000;

/** `iso` falls inside the last `days` days (offset by `offset` periods for previous-period compares). */
export const inRange = (iso: string, days: number, offset = 0) => {
  const d = Date.now() - new Date(iso).getTime();
  return d > offset * DAY && d <= (offset + days) * DAY;
};

/** Change ratio vs previous period for StatCard; undefined when the previous period has no data. */
export const delta = (cur: number, prev: number): number | undefined => (prev > 0 ? (cur - prev) / prev : undefined);

export const sellable = (o: Order) => o.status !== "cancelled";

/** Daily revenue/orders buckets for the last `days` days, sorted ascending (SalesChart input). */
export function dailySeries(orders: Order[], days: number): SalesPoint[] {
  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    if (!sellable(o) || !inRange(o.createdAt, days)) continue;
    const key = o.createdAt.slice(0, 10);
    const b = buckets.get(key) ?? { revenue: 0, orders: 0 };
    b.revenue += o.total.amount;
    b.orders += 1;
    buckets.set(key, b);
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, ...v }));
}
