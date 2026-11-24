import type { Customer } from "@repo/contracts";

export function exportCsv(rows: Customer[]) {
  const head = ["name", "phone", "email", "city", "registeredAt", "orders", "totalSpent", "avgOrder", "lastOrderAt", "segment", "source", "tags"];
  const lines = rows.map((c) => [
    c.name ?? "", c.phone, c.email ?? "", c.addresses[0]?.city ?? "", c.createdAt, c.stats.ordersCount,
    (c.stats.totalSpent.amount / 100).toFixed(2), (c.stats.avgOrder.amount / 100).toFixed(2),
    c.stats.lastOrderAt ?? "", c.segment, c.source, c.tags.join("|"),
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const blob = new Blob(["\uFEFF" + [head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "customers.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
