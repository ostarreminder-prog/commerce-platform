"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, InventoryLevel } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { downloadCsv, type Row } from "@/features/catalog/products-shared";

/** Exportable columns — labels come from catalog.products.export.cols.* */
export const EXPORT_COLS = ["name", "sku", "barcode", "status", "price", "compareAt", "cost", "stock", "sold30d", "categories"] as const;
export type ExportCol = (typeof EXPORT_COLS)[number];

function lineFor(row: Row, cols: ExportCol[], perVariant: boolean, levels: InventoryLevel[], catName: (id: string) => string): (string | number)[][] {
  const p = row.product;
  const cats = p.categoryIds.map(catName).filter(Boolean).join(" | ");
  const variantLines = (perVariant ? p.variants : p.variants.slice(0, 1)).map((v) => {
    const vStock = levels.filter((l) => l.variantId === v.id).reduce((s, l) => s + l.available, 0);
    return cols.map((c) => {
      switch (c) {
        case "name": return p.name.ar + (perVariant && v.optionValues.length ? ` — ${v.optionValues.join(" / ")}` : "");
        case "sku": return v.sku;
        case "barcode": return v.barcode ?? "";
        case "status": return p.status;
        case "price": return (v.price.amount / 100).toFixed(2);
        case "compareAt": return v.compareAtPrice ? (v.compareAtPrice.amount / 100).toFixed(2) : "";
        case "cost": return v.cost ? (v.cost.amount / 100).toFixed(2) : "";
        case "stock": return perVariant ? vStock : row.stock.available;
        case "sold30d": return p.stats.sold30d;
        case "categories": return cats;
      }
    });
  });
  return variantLines;
}

/** Column-picker export dialog — exports the rows handed to it (filtered list view or bulk selection). */
export function ExportDialog({ rows, categories, levels, open, onOpenChange }: {
  rows: Row[];
  categories: Category[];
  levels: InventoryLevel[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("catalog.products.export");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const [cols, setCols] = React.useState<Set<ExportCol>>(new Set(["name", "sku", "status", "price", "stock"]));
  const [perVariant, setPerVariant] = React.useState(false);
  const catName = React.useCallback((id: string) => categories.find((c) => c.id === id)?.name[locale] ?? "", [categories, locale]);

  const toggle = (c: ExportCol) =>
    setCols((s) => {
      const next = new Set(s);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });

  const run = () => {
    const ordered = EXPORT_COLS.filter((c) => cols.has(c));
    if (!ordered.length) { toast.error(t("pickCols")); return; }
    const lines = rows.flatMap((r) => lineFor(r, ordered, perVariant, levels, catName));
    downloadCsv(perVariant ? "variants.csv" : "products.csv", ordered.map((c) => t(`cols.${c}`)), lines);
    toast.success(t("done", { count: lines.length }));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { count: rows.length })}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {EXPORT_COLS.map((c) => (
            <Label key={c} className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm">
              <Checkbox checked={cols.has(c)} onCheckedChange={() => toggle(c)} />
              {t(`cols.${c}`)}
            </Label>
          ))}
        </div>
        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="exp-variants" className="font-normal">{t("perVariant")}</Label>
          <Switch id="exp-variants" checked={perVariant} onCheckedChange={setPerVariant} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={run} disabled={!rows.length}><Download aria-hidden />{t("download")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
