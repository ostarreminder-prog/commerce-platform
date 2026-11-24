"use client";

import * as React from "react";
import { ExternalLink, Layers, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  resolveCollectionProducts, useCollectionList, useInventoryLevels, useProductList,
} from "@repo/api-client";
import type { Collection } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import Link from "@/components/store-link";

export { CollectionDetail } from "@/features/catalog/collection-detail";

export function CollectionsList() {
  const t = useTranslations("catalog.collections");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("products.manage");
  const [f, set] = useUrlState({ type: "all", q: "" });
  const collections = useCollectionList();
  const levels = useInventoryLevels();
  const products = useProductList();
  useScrollRestore(collections.isSuccess);
  React.useEffect(() => { rememberListUrl("/collections", `/collections${window.location.search}`); }, [f]);

  const countFor = React.useCallback(
    (c: Collection) => resolveCollectionProducts(c, products.data ?? [], levels.data ?? []).length,
    [products.data, levels.data],
  );
  const q = f.q.trim().toLowerCase();
  const visible = (collections.data ?? []).filter((c) => (f.type === "all" || c.type === f.type) && (!q || c.name.ar.toLowerCase().includes(q) || (c.name.en ?? "").toLowerCase().includes(q)));

  const columns = React.useMemo<ColumnDef<Collection, unknown>[]>(() => [
    {
      id: "name",
      header: t("cols.name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <MediaThumb url={row.original.image?.url} label={row.original.name.ar} className="size-9" />
          <EntityLink type="collection" id={row.original.id}>{row.original.name[locale] ?? row.original.name.ar}</EntityLink>
        </div>
      ),
    },
    { id: "type", header: t("cols.type"), cell: ({ row }) => <StatusBadge entity="collection" field="type" value={row.original.type} /> },
    { id: "products", header: t("cols.products"), cell: ({ row }) => <Link href={`/collections/${row.original.id}`} className="num text-muted-foreground hover:text-primary">{formatNumber(countFor(row.original))}</Link> },
    {
      id: "view",
      header: "",
      cell: ({ row }) => (
        <a href={`http://localhost:3001/c/${row.original.slug}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-primary inline-flex" aria-label={t("viewInStore")}>
          <ExternalLink className="size-4" />
        </a>
      ),
    },
  ], [t, locale, countFor]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={canManage ? <Button asChild><Link href="/collections/new"><Plus aria-hidden />{t("newCollection")}</Link></Button> : undefined}
      />
      <DataState
        state={collections}
        loading={<TableSkeleton rows={6} columns={4} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={Layers} title={t("noneTitle")} description={t("noneDescription")} /></Card>}
      >
        {() => (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 sm:max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
              </div>
              <Select value={f.type} onValueChange={(v) => set({ type: v })}>
                <SelectTrigger className="w-40" aria-label={t("filters.type")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                  <SelectItem value="manual">{t("types.manual")}</SelectItem>
                  <SelectItem value="automatic">{t("types.automatic")}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-muted-foreground ms-auto text-sm">{t("results", { count: visible.length })}</span>
            </div>
            <div className="hidden md:block">
              <DataTable columns={columns} data={visible} getRowId={(c) => c.id} pageSize={15} onRowClick={(c) => router.push(`/collections/${c.id}`)} />
            </div>
            <div className="space-y-3 md:hidden">
              {visible.map((c) => (
                <Link key={c.id} href={`/collections/${c.id}`} className="bg-card hover:bg-accent/40 flex items-center gap-3 rounded-lg border p-4">
                  <MediaThumb url={c.image?.url} label={c.name.ar} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name[locale] ?? c.name.ar}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge entity="collection" field="type" value={c.type} />
                      <span className="num text-muted-foreground text-xs">{formatNumber(countFor(c))}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}
