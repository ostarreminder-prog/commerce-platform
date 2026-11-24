"use client";

import * as React from "react";
import { Boxes, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  NOW, useCategoryList, useInventoryLevels, useInventoryMovements, useLocations, useProductList,
} from "@repo/api-client";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { AdjustDialog, type InventoryRow } from "@/features/catalog/inventory-adjust-dialog";

export { InventoryVariantDetail } from "@/features/catalog/inventory-variant-detail";

const STOCK_TABS = ["all", "in_stock", "low", "out_of_stock"] as const;

export function InventoryList() {
  const t = useTranslations("catalog.inventory");
  const ts = useTranslations("catalog");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("inventory.manage");
  const [f, set] = useUrlState({ stock: "all", category: "all", location: "all", q: "" });
  const levels = useInventoryLevels();
  const locations = useLocations();
  const movements = useInventoryMovements();
  const products = useProductList();
  const categories = useCategoryList();
  const [adjustRow, setAdjustRow] = React.useState<InventoryRow | null>(null);
  useScrollRestore(levels.isSuccess);
  React.useEffect(() => { rememberListUrl("/inventory", `/inventory${window.location.search}`); }, [f]);

  const rows = React.useMemo<InventoryRow[]>(() => {
    const lastMove = new Map<string, string>();
    for (const m of movements.data ?? []) if (!lastMove.has(m.variantId)) lastMove.set(m.variantId, m.at);
    const out: InventoryRow[] = [];
    for (const p of products.data ?? []) {
      for (const v of p.variants) {
        for (const level of (levels.data ?? []).filter((l) => l.variantId === v.id)) {
          out.push({ level, product: p, variant: v, lastAt: lastMove.get(v.id) ?? null });
        }
      }
    }
    return out;
  }, [levels.data, products.data, movements.data]);

  const q = f.q.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (f.stock === "in_stock" && r.level.available <= 0) return false;
    if (f.stock === "low" && !(r.level.available > 0 && r.level.available <= r.level.lowStockThreshold)) return false;
    if (f.stock === "out_of_stock" && r.level.available > 0) return false;
    if (f.category !== "all" && !r.product.categoryIds.includes(f.category)) return false;
    if (f.location !== "all" && r.level.locationId !== f.location) return false;
    if (!q) return true;
    return r.product.name.ar.toLowerCase().includes(q) || (r.product.name.en ?? "").toLowerCase().includes(q) || r.variant.sku.toLowerCase().includes(q) || (r.variant.barcode ?? "").toLowerCase().includes(q);
  });

  const columns = React.useMemo<ColumnDef<InventoryRow, unknown>[]>(() => [
    {
      id: "product",
      header: t("cols.product"),
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <MediaThumb url={row.original.product.media[0]?.url} label={row.original.product.name.ar} className="size-9" />
          <EntityLink type="variant" id={row.original.variant.id} className="truncate">{row.original.product.name[locale] ?? row.original.product.name.ar}</EntityLink>
        </div>
      ),
    },
    { id: "variant", header: t("cols.variant"), cell: ({ row }) => <EntityLink type="variant" id={row.original.variant.id} className="text-sm">{row.original.variant.optionValues.join(" / ") || "—"}</EntityLink> },
    { id: "sku", header: "SKU", cell: ({ row }) => <bdi dir="ltr" className="num text-muted-foreground text-xs">{row.original.variant.sku}</bdi> },
    {
      id: "onHand",
      accessorFn: (r) => r.level.onHand,
      header: t("cols.onHand"),
      cell: ({ row }) => (
        <button
          type="button"
          disabled={!canManage}
          onClick={(e) => { e.stopPropagation(); setAdjustRow(row.original); }}
          className={cn("num rounded px-2 py-0.5 font-medium", canManage && "hover:bg-accent cursor-pointer")}
          title={canManage ? t("adjustHint") : undefined}
        >
          {formatNumber(row.original.level.onHand)}
        </button>
      ),
    },
    { id: "reserved", header: t("cols.reserved"), cell: ({ row }) => <span className="num text-muted-foreground">{formatNumber(row.original.level.reserved)}</span> },
    {
      id: "available",
      accessorFn: (r) => r.level.available,
      header: t("cols.available"),
      cell: ({ row }) => (
        <span className={cn("num font-medium", row.original.level.available <= 0 ? "text-destructive" : row.original.level.available <= row.original.level.lowStockThreshold && "text-warning")}>
          {formatNumber(row.original.level.available)}
        </span>
      ),
    },
    { id: "threshold", header: t("cols.threshold"), cell: ({ row }) => <span className="num text-muted-foreground">{formatNumber(row.original.level.lowStockThreshold)}</span> },
    {
      id: "location",
      header: t("cols.location"),
      cell: ({ row }) => <span className="text-muted-foreground text-sm">{locations.data?.find((l) => l.id === row.original.level.locationId)?.name ?? "—"}</span>,
    },
    { id: "last", header: t("cols.lastMove"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap text-xs">{row.original.lastAt ? formatRelativeTime(row.original.lastAt, locale, NOW) : "—"}</span> },
  ], [t, locale, canManage, locations.data]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataState
        state={levels}
        loading={<TableSkeleton rows={10} columns={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={Boxes} title={t("noneTitle")} description={t("noneDescription")} /></Card>}
      >
        {() => (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
              </div>
              <div className="flex rounded-md border p-0.5">
                {STOCK_TABS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set({ stock: s })}
                    className={cn("rounded px-3 py-1 text-sm", f.stock === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    {ts(`stock.${s}`)}
                  </button>
                ))}
              </div>
              <Select value={f.category} onValueChange={(v) => set({ category: v })}>
                <SelectTrigger className="w-40" aria-label={t("filters.category")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
                  {(categories.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name[locale] ?? c.name.ar}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={f.location} onValueChange={(v) => set({ location: v })}>
                <SelectTrigger className="w-40" aria-label={t("filters.location")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allLocations")}</SelectItem>
                  {(locations.data ?? []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground ms-auto text-sm">{t("results", { count: visible.length })}</span>
            </div>
            <div className="hidden md:block">
              <DataTable columns={columns} data={visible} getRowId={(r) => `${r.variant.id}:${r.level.locationId}`} pageSize={15} onRowClick={(r) => router.push(`/inventory/${r.variant.id}`)} />
            </div>
            <div className="space-y-3 md:hidden">
              {visible.map((r) => (
                <button key={`${r.variant.id}:${r.level.locationId}`} type="button" onClick={() => router.push(`/inventory/${r.variant.id}`)} className="bg-card hover:bg-accent/40 flex w-full items-center gap-3 rounded-lg border p-4 text-start">
                  <MediaThumb url={r.product.media[0]?.url} label={r.product.name.ar} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.product.name[locale] ?? r.product.name.ar}</p>
                    <p className="text-muted-foreground num text-xs" dir="ltr">{r.variant.sku}</p>
                  </div>
                  <span className={cn("num font-semibold", r.level.available <= r.level.lowStockThreshold && "text-destructive")}>{formatNumber(r.level.available)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </DataState>
      <AdjustDialog row={adjustRow} open={adjustRow !== null} onOpenChange={(v) => !v && setAdjustRow(null)} />
    </div>
  );
}
