import type { InventoryLevel, Product } from "@repo/contracts";
import { toHalalas } from "@repo/ui/lib/money";

export const DEFAULTS = { status: "all", category: "all", collection: "all", stock: "all", tag: "", brand: "", min: "", max: "", q: "", import: "" };
export type Filters = typeof DEFAULTS;
export const STOCK_FILTERS = ["in_stock", "low", "out_of_stock"] as const;

export interface Row {
  product: Product;
  stock: { onHand: number; reserved: number; available: number; low: boolean; out: boolean };
}

export const priceOf = (p: Product) => {
  const prices = p.variants.map((v) => v.price.amount);
  return { min: Math.min(...prices), max: Math.max(...prices) };
};

export function stockOf(p: Product, levels: InventoryLevel[]): Row["stock"] {
  const mine = levels.filter((l) => p.variants.some((v) => v.id === l.variantId));
  const onHand = mine.reduce((s, l) => s + l.onHand, 0);
  const reserved = mine.reduce((s, l) => s + l.reserved, 0);
  const available = onHand - reserved;
  const low = mine.some((l) => l.available > 0 && l.available <= l.lowStockThreshold);
  const out = p.variants.every((v) => v.trackInventory) && available <= 0;
  return { onHand, reserved, available, low, out };
}

export function matches(r: Row, f: Filters, q: string) {
  const p = r.product;
  if (f.status !== "all" && p.status !== f.status) return false;
  if (f.category !== "all" && !p.categoryIds.includes(f.category)) return false;
  if (f.collection !== "all" && !p.collectionIds.includes(f.collection)) return false;
  if (f.stock === "in_stock" && r.stock.available <= 0) return false;
  if (f.stock === "low" && !(r.stock.low || (r.stock.available > 0 && r.stock.out))) return false;
  if (f.stock === "out_of_stock" && !r.stock.out) return false;
  const { min, max } = priceOf(p);
  if (f.min && min < toHalalas(f.min)) return false;
  if (f.max && max > toHalalas(f.max)) return false;
  if (f.tag && !p.tags.includes(f.tag)) return false;
  if (f.brand && p.brand !== f.brand) return false;
  if (!q) return true;
  return (
    p.name.ar.toLowerCase().includes(q) ||
    (p.name.en ?? "").toLowerCase().includes(q) ||
    p.variants.some((v) => v.sku.toLowerCase().includes(q) || (v.barcode ?? "").includes(q))
  );
}

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const downloadCsv = (name: string, head: string[], lines: (string | number)[][]) => {
  const blob = new Blob(["\uFEFF" + [head, ...lines].map((l) => l.map(csvCell).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};

