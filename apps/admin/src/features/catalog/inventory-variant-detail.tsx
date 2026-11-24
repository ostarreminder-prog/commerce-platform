"use client";

import * as React from "react";
import { Boxes } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  NOW, useInventoryLevels, useLocations, useProductList, useVariantMovements,
} from "@repo/api-client";
import type { InventoryMovement } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime, formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { Actor } from "@/components/entity/actor";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { AdjustDialog, type InventoryRow } from "@/features/catalog/inventory-adjust-dialog";
import { TransferDialog } from "@/features/catalog/inventory-transfer-dialog";

export function InventoryVariantDetail() {
  const t = useTranslations("catalog.inventoryMovements");
  const tInv = useTranslations("catalog.inventory");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("inventory.manage");
  const params = useParams<{ variantId: string }>();
  const products = useProductList();
  const levels = useInventoryLevels();
  const movements = useVariantMovements(params.variantId);
  const locations = useLocations();
  const [adjustRow, setAdjustRow] = React.useState<InventoryRow | null>(null);
  const [transferOpen, setTransferOpen] = React.useState(false);

  const found = React.useMemo(() => {
    for (const p of products.data ?? []) {
      const v = p.variants.find((x) => x.id === params.variantId);
      if (v) return { product: p, variant: v };
    }
    return null;
  }, [products.data, params.variantId]);

  if (products.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-72" /></div>;
  if (!found) {
    return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push(recallListUrl("/inventory"))}>{t("backToList")}</Button>} /></Card>;
  }
  const { product, variant } = found;
  const perLocation = (levels.data ?? []).filter((l) => l.variantId === variant.id);
  const level = perLocation[0];
  const totals = { onHand: perLocation.reduce((s, l) => s + l.onHand, 0), reserved: perLocation.reduce((s, l) => s + l.reserved, 0), available: perLocation.reduce((s, l) => s + l.available, 0) };
  const locationName = (id: string | null | undefined) => (id ? (locations.data?.find((l) => l.id === id)?.name ?? id) : "—");

  const columns: ColumnDef<InventoryMovement, unknown>[] = [
    { id: "at", accessorKey: "at", header: t("cols.date"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap" title={formatRelativeTime(row.original.at, locale, NOW)}>{formatDateTime(row.original.at, locale)}</span> },
    { id: "delta", accessorKey: "delta", header: t("cols.delta"), cell: ({ row }) => <span className={cn("num font-medium", row.original.delta > 0 ? "text-success" : "text-destructive")}>{row.original.delta > 0 ? `+${formatNumber(row.original.delta)}` : formatNumber(row.original.delta)}</span> },
    { id: "reason", header: t("cols.reason"), cell: ({ row }) => t(`reasons.${row.original.reason}`) },
    {
      id: "reference",
      header: t("cols.reference"),
      cell: ({ row }) => {
        const ref = row.original.reference;
        if (!ref) return <span className="text-muted-foreground">—</span>;
        if (ref.type === "order") return <EntityLink type="order" id={ref.id} />;
        if (ref.type === "return") return <EntityLink type="return" id={ref.id} />;
        if (ref.type === "import") return <EntityLink type="import" id={ref.id} />;
        return <span>{ref.label ?? ref.id}</span>;
      },
    },
    { id: "location", header: t("cols.location"), cell: ({ row }) => <span className="text-muted-foreground">{locationName(row.original.locationId)}</span> },
    { id: "actor", header: t("cols.actor"), cell: ({ row }) => <Actor actor={row.original.actor} /> },
    { id: "balance", accessorKey: "balanceAfter", header: t("cols.balance"), cell: ({ row }) => <span className="num font-medium">{formatNumber(row.original.balanceAfter)}</span> },
    { id: "note", header: t("cols.note"), cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.note ?? "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: tInv("title"), href: recallListUrl("/inventory") }, { label: `${product.name[locale] ?? product.name.ar}${variant.optionValues.length ? ` — ${variant.optionValues.join(" / ")}` : ""}` }]} />
      <div className="flex flex-wrap items-center gap-4">
        <MediaThumb url={product.media[0]?.url} label={product.name.ar} className="size-14" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">
            <EntityLink type="product" id={product.id}>{product.name[locale] ?? product.name.ar}</EntityLink>
            {variant.optionValues.length ? <span className="text-muted-foreground font-normal"> — {variant.optionValues.join(" / ")}</span> : null}
          </h1>
          <p className="text-muted-foreground num text-sm" dir="ltr">{variant.sku}</p>
        </div>
        {canManage && level ? (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setTransferOpen(true)} disabled={perLocation.length < 1}>{t("transfer")}</Button>
            <Button variant="outline" onClick={() => setAdjustRow({ level, product, variant, lastAt: null })}>{t("adjust")}</Button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {([
          ["onHand", totals.onHand],
          ["reserved", totals.reserved],
          ["available", totals.available],
          ["threshold", level?.lowStockThreshold],
        ] as const).map(([key, val]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">{tInv(`cols.${key}`)}</p>
              <p className={cn("num mt-1 text-2xl font-semibold", key === "available" && val !== undefined && val <= 0 && "text-destructive")}>{val === undefined ? "—" : formatNumber(val)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {perLocation.length > 1 ? (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("byLocation")}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { id: "location", header: t("cols.location"), cell: ({ row }) => <span className="font-medium">{locationName(row.original.locationId)}</span> },
                { id: "onHand", header: tInv("cols.onHand"), cell: ({ row }) => <span className="num">{formatNumber(row.original.onHand)}</span> },
                { id: "reserved", header: tInv("cols.reserved"), cell: ({ row }) => <span className="num">{formatNumber(row.original.reserved)}</span> },
                { id: "available", header: tInv("cols.available"), cell: ({ row }) => <span className={cn("num font-medium", row.original.available <= 0 && "text-destructive")}>{formatNumber(row.original.available)}</span> },
              ]}
              data={perLocation}
              getRowId={(l) => l.locationId}
            />
          </CardContent>
        </Card>
      ) : level ? <p className="text-muted-foreground text-sm">{t("location", { name: locationName(level.locationId) })}</p> : null}

      <Card>
        <CardHeader><CardTitle className="text-base">{t("movementsTitle")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataState
            state={movements}
            loading={<TableSkeleton rows={5} columns={7} />}
            isEmpty={(d) => d.length === 0}
            empty={<EmptyState icon={Boxes} title={t("noneTitle")} description={t("noneDescription")} />}
          >
            {(data) => <DataTable columns={columns} data={data} getRowId={(m) => m.id} pageSize={15} />}
          </DataState>
        </CardContent>
      </Card>
      <AdjustDialog row={adjustRow} open={adjustRow !== null} onOpenChange={(v) => !v && setAdjustRow(null)} />
      <TransferDialog
        variantId={variant.id}
        variantLabel={`${product.name[locale] ?? product.name.ar}${variant.optionValues.length ? ` — ${variant.optionValues.join(" / ")}` : ""}`}
        open={transferOpen}
        onOpenChange={setTransferOpen}
      />
    </div>
  );
}
