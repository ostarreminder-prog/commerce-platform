"use client";

import * as React from "react";
import { Download, Import, Package, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCategoryList, useCollectionList, useImportList, useInventoryLevels, useProductList,
} from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, DataTableColumnHeader, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge, useStatusLabel } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { BulkActions } from "@/features/catalog/products-bulk-actions";
import { ExportDialog } from "@/features/catalog/products-export";
import { MoreFilters } from "@/features/catalog/products-filters";
import { ProductsSummary } from "@/features/catalog/products-summary";
import { DEFAULTS, STOCK_FILTERS, matches, priceOf, stockOf, type Filters, type Row } from "@/features/catalog/products-shared";

export function ProductsList() {
  const t = useTranslations("catalog.products");
  const ts = useTranslations("catalog");
  const label = useStatusLabel();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("products.manage");
  const [f, set] = useUrlState(DEFAULTS);
  const products = useProductList();
  const levels = useInventoryLevels();
  const categories = useCategoryList();
  const collections = useCollectionList();
  const imports = useImportList();
  const [exportOpen, setExportOpen] = React.useState(false);
  useScrollRestore(products.isSuccess);
  React.useEffect(() => { rememberListUrl("/products", `/products${window.location.search}`); }, [f]);

  const rows = React.useMemo<Row[]>(
    () => (products.data ?? []).map((product) => ({ product, stock: stockOf(product, levels.data ?? []) })),
    [products.data, levels.data],
  );
  const catName = React.useCallback((id: string) => categories.data?.find((c) => c.id === id)?.name[locale] ?? "", [categories.data, locale]);
  const q = f.q.trim().toLowerCase();
  /* `/products?import=<jobId>` (spec §5.12) — restrict to the products the job created/updated. */
  const importIds = React.useMemo(
    () => (f.import ? new Set(imports.data?.find((j) => j.id === f.import)?.productIds ?? []) : null),
    [f.import, imports.data],
  );
  const visible = rows.filter((r) => matches(r, f, q)).filter((r) => !importIds || importIds.has(r.product.id));
  const hasFilters = Object.entries(f).some(([k, v]) => v !== DEFAULTS[k as keyof Filters]);
  const reset = () => set({ ...DEFAULTS });

  const columns = React.useMemo<ColumnDef<Row, unknown>[]>(() => [
    {
      id: "name",
      accessorFn: (r) => r.product.name.ar,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.name")} />,
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <MediaThumb url={row.original.product.media[0]?.url} label={row.original.product.name.ar} className="size-10" />
          <div className="min-w-0">
            <EntityLink type="product" id={row.original.product.id} className="block truncate">{row.original.product.name[locale] ?? row.original.product.name.ar}</EntityLink>
            <span className="text-muted-foreground num block text-xs" dir="ltr">{row.original.product.variants[0]?.sku ?? "—"}</span>
          </div>
        </div>
      ),
    },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="product" value={row.original.product.status} /> },
    {
      id: "stock",
      accessorFn: (r) => r.stock.available,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.stock")} />,
      cell: ({ row }) => (
        <span className={cn("num whitespace-nowrap", (row.original.stock.low || row.original.stock.out) && "text-destructive font-medium")}>
          {formatNumber(row.original.stock.available)}
          {row.original.stock.out ? <span className="ms-1 text-xs">({t("stockOut")})</span> : row.original.stock.low ? <span className="ms-1 text-xs">({t("stockLow")})</span> : null}
        </span>
      ),
    },
    {
      id: "price",
      accessorFn: (r) => priceOf(r.product).min,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.price")} />,
      cell: ({ row }) => {
        const { min, max } = priceOf(row.original.product);
        return <span className="num whitespace-nowrap">{min === max ? formatMoney(min, locale) : `${formatMoney(min, locale)} – ${formatMoney(max, locale)}`}</span>;
      },
    },
    {
      id: "categories",
      header: t("cols.categories"),
      cell: ({ row }) => (
        <span className="flex max-w-48 flex-wrap gap-1">
          {row.original.product.categoryIds.map((id) => (
            <EntityLink key={id} type="category" id={id} label={catName(id)} className="text-xs" />
          ))}
        </span>
      ),
    },
    {
      id: "sold",
      accessorFn: (r) => r.product.stats.sold30d,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.sold")} />,
      cell: ({ row }) => <span className="num whitespace-nowrap">{formatNumber(row.original.product.stats.sold30d)}</span>,
    },
    {
      id: "conversations",
      header: t("cols.conversations"),
      cell: ({ row }) => <span className="num whitespace-nowrap">{formatNumber(row.original.product.stats.conversations30d)}</span>,
    },
  ], [t, locale, catName]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/imports"><Import aria-hidden />{t("import")}</Link>
            </Button>
            <Button variant="outline" onClick={() => setExportOpen(true)}><Download aria-hidden />{t("bulk.export")}</Button>
            {canManage ? (
              <Button asChild>
                <Link href="/products/new"><Plus aria-hidden />{t("newProduct")}</Link>
              </Button>
            ) : null}
          </>
        }
      />
      {rows.length ? <ProductsSummary rows={rows} /> : null}
      <DataState
        state={products}
        loading={<div className="space-y-4"><Skeleton className="h-10 w-full max-w-2xl" /><TableSkeleton rows={10} columns={7} /></div>}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <MsgEmptyState
              emptyKey="products"
              icon={Package}
              action={canManage ? <Button asChild><Link href="/products/new"><Plus aria-hidden />{t("newProduct")}</Link></Button> : undefined}
            />
          </Card>
        }
      >
        {() => (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <Select value={f.status} onValueChange={(v) => set({ status: v })}>
                  <SelectTrigger className="sm:w-36" aria-label={t("filters.status")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                    {(["active", "draft", "archived"] as const).map((s) => <SelectItem key={s} value={s}>{label("product", "status", s)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={f.category} onValueChange={(v) => set({ category: v })}>
                  <SelectTrigger className="sm:w-40" aria-label={t("filters.category")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
                    {(categories.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name[locale] ?? c.name.ar}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={f.collection} onValueChange={(v) => set({ collection: v })}>
                  <SelectTrigger className="sm:w-40" aria-label={t("filters.collection")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allCollections")}</SelectItem>
                    {(collections.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name[locale] ?? c.name.ar}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={f.stock} onValueChange={(v) => set({ stock: v })}>
                  <SelectTrigger className="sm:w-36" aria-label={t("filters.stock")}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStock")}</SelectItem>
                    {STOCK_FILTERS.map((s) => <SelectItem key={s} value={s}>{ts(`stock.${s}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
                <MoreFilters f={f} set={set} />
              </div>
              {f.import ? (
                <Button variant="secondary" size="sm" onClick={() => set({ import: "" })} className="self-start lg:self-auto">
                  {t("fromImport", { id: f.import })}<X aria-hidden />
                </Button>
              ) : null}
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={reset} className="self-start lg:self-auto"><X aria-hidden />{t("resetFilters")}</Button>
              ) : null}
              <span className="text-muted-foreground text-sm lg:ms-auto">{t("results", { count: visible.length })}</span>
            </div>
            {visible.length === 0 ? (
              <Card>
                <EmptyState icon={Search} title={t("emptyTitle")} description={t("emptyDescription")} action={<Button variant="outline" onClick={reset}>{t("resetFilters")}</Button>} />
              </Card>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {visible.slice(0, 30).map((r) => (
                    <Link key={r.product.id} href={`/products/${r.product.id}`} className="bg-card hover:bg-accent/40 block rounded-lg border p-4">
                      <div className="flex items-start gap-3">
                        <MediaThumb url={r.product.media[0]?.url} label={r.product.name.ar} className="size-12" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{r.product.name[locale] ?? r.product.name.ar}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <StatusBadge entity="product" value={r.product.status} />
                            <span className={cn("num text-xs", (r.stock.low || r.stock.out) && "text-destructive")}>{formatNumber(r.stock.available)}</span>
                          </div>
                        </div>
                        <span className="num text-sm font-semibold">{formatMoney(priceOf(r.product).min, locale)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="hidden md:block">
                  <DataTable
                    columns={columns}
                    data={visible}
                    getRowId={(r) => r.product.id}
                    enableRowSelection
                    pageSize={15}
                    onRowClick={(r) => router.push(`/products/${r.product.id}`)}
                    bulkActions={(sel, clear) => <BulkActions rows={sel} clear={clear} categories={categories.data ?? []} collections={collections.data ?? []} />}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </DataState>
      <ExportDialog rows={visible} categories={categories.data ?? []} levels={levels.data ?? []} open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
