import type { Order, Return } from "@repo/contracts";

export function itemsOf(r: Return, order: Order | undefined) {
  return r.items.map((line) => ({ line, item: order?.items.find((i) => i.id === line.orderItemId) }));
}

export function lineValue(r: Return, order: Order | undefined) {
  return itemsOf(r, order).reduce((s, { line, item }) => s + (item ? Math.round((item.lineTotal.amount / item.quantity) * line.quantity) : 0), 0);
}
