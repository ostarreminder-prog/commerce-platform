import type { DashboardSummary, SalesPoint } from "@repo/contracts";
import { orders } from "./orders";
import { createRandom, daysAgo } from "../../data/seed";

const random = createRandom(7);

export const salesSeries: SalesPoint[] = Array.from({ length: 30 }, (_, i) => {
  const day = 29 - i;
  const weekend = [4, 5].includes(new Date(daysAgo(day)).getUTCDay());
  const trend = 1 + i / 60;
  const orderCount = Math.round((weekend ? 16 : 11) * trend + random.int(-3, 4));
  return { date: daysAgo(day), orders: orderCount, revenue: orderCount * random.int(15500, 21500) };
});

const sum = (points: SalesPoint[], key: "revenue" | "orders") => points.reduce((s, p) => s + p[key], 0);
const current = salesSeries.slice(-7);
const previous = salesSeries.slice(-14, -7);
const delta = (a: number, b: number) => (b === 0 ? 0 : (a - b) / b);

const revenue = sum(current, "revenue");
const orderCount = sum(current, "orders");
const prevRevenue = sum(previous, "revenue");
const prevOrders = sum(previous, "orders");

export const dashboardSummary: DashboardSummary = {
  revenue,
  revenueDelta: delta(revenue, prevRevenue),
  orders: orderCount,
  ordersDelta: delta(orderCount, prevOrders),
  averageOrderValue: Math.round(revenue / orderCount),
  aovDelta: delta(revenue / orderCount, prevRevenue / prevOrders),
  conversionRate: 0.031,
  conversionDelta: -0.012,
  salesSeries,
  agentActivity: { conversations: 580, resolvedRate: 0.76, recoveredCarts: 23, revenue: 1843500 },
};

export const recentOrders = orders.slice(0, 6);
