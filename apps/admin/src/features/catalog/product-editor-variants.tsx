"use client";

import * as React from "react";
import { ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Input } from "@repo/ui/components/input";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber, formatPercent } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { buildVariants, type Draft, type VariantDraft } from "@/features/catalog/product-editor-draft";
import { Field } from "@/features/catalog/product-editor-field";

/** Net margin when price & cost both parse — (price − cost) / price. */
const marginOf = (v: VariantDraft): number | null => {
  const price = Number(v.price);
  const cost = Number(v.cost);
  if (!v.price.trim() || !v.cost.trim() || !Number.isFinite(price) || !Number.isFinite(cost) || price <= 0) return null;
  return (price - cost) / price;
};

/** Variant-image picker — assigns one of the product's own media items (`Variant.imageId` → `MediaRef.id`). */
function VariantImageCell({ v, draft, setVariant }: { v: VariantDraft; draft: Draft; setVariant: (vid: string, patch: Partial<VariantDraft>) => void }) {
  const t = useTranslations("catalog.editor");
  const [open, setOpen] = React.useState(false);
  const img = draft.media.find((m) => m.id === v.imageId);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={t("variantImage")} className="border-border hover:border-primary flex size-9 items-center justify-center overflow-hidden rounded-md border">
          {img ? <MediaThumb url={img.url} label={img.alt.ar} className="size-full" /> : <ImageIcon className="text-muted-foreground size-4" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        <p className="mb-2 text-sm font-medium">{t("variantImage")}</p>
        {draft.media.length ? (
          <div className="grid grid-cols-4 gap-2">
            {draft.media.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setVariant(v.id, { imageId: v.imageId === m.id ? null : m.id }); setOpen(false); }}
                className={cn("overflow-hidden rounded-md border-2", v.imageId === m.id ? "border-primary" : "border-transparent hover:border-border")}
                aria-label={m.alt.ar}
              >
                <MediaThumb url={m.url} label={m.alt.ar} className="aspect-square size-full" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">{t("variantImageEmpty")}</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function OptionsVariantsCard({ draft, set, bulk, setBulk, setVariant, stockFor, isNew, orderedVariantIds }: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  bulk: Set<string>;
  setBulk: (s: Set<string>) => void;
  setVariant: (vid: string, patch: Partial<VariantDraft>) => void;
  stockFor: (v: VariantDraft) => number;
  isNew: boolean;
  orderedVariantIds: Set<string>;
}) {
  const t = useTranslations("catalog.editor");
  const [deleteTarget, setDeleteTarget] = React.useState<VariantDraft | null>(null);

  const removeVariant = (vid: string) => {
    set("variants", draft.variants.filter((v) => v.id !== vid));
    const next = new Set(bulk);
    next.delete(vid);
    setBulk(next);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t("optionsVariants")}</CardTitle>
        {draft.options.length < 3 ? (
          <Button type="button" variant="outline" size="sm" onClick={() => set("options", [...draft.options, { nameAr: "", values: "" }])}><Plus aria-hidden />{t("addOption")}</Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {draft.options.map((o, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label={t("optionName")}><Input value={o.nameAr} placeholder={t("optionNamePlaceholder")} onChange={(e) => set("options", draft.options.map((x, j) => (j === i ? { ...x, nameAr: e.target.value } : x)))} /></Field>
            <Field label={t("optionValues")}><Input value={o.values} placeholder={t("optionValuesPlaceholder")} onChange={(e) => set("options", draft.options.map((x, j) => (j === i ? { ...x, values: e.target.value } : x)))} className="min-w-52" /></Field>
            <Button type="button" variant="ghost" size="icon" onClick={() => set("options", draft.options.filter((_, j) => j !== i))} aria-label={t("removeOption")}><X className="size-4" /></Button>
          </div>
        ))}
        {draft.options.length ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => { set("variants", buildVariants(draft.options, draft.variants)); setBulk(new Set()); }}>
            {t("generateVariants")}
          </Button>
        ) : null}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"><Checkbox aria-label={t("selectAll")} checked={bulk.size === draft.variants.length && draft.variants.length > 0} onCheckedChange={(v) => setBulk(v === true ? new Set(draft.variants.map((x) => x.id)) : new Set())} /></TableHead>
                <TableHead>{t("variantImage")}</TableHead>
                {draft.options.length ? <TableHead>{t("variantOption")}</TableHead> : null}
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("compareAt")}</TableHead>
                <TableHead>{t("fields.cost")}</TableHead>
                <TableHead>{t("margin")}</TableHead>
                <TableHead>{t("sku")}</TableHead>
                <TableHead>{t("fields.barcode")}</TableHead>
                <TableHead>{t("weight")}</TableHead>
                <TableHead>{t("inventory")}</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {draft.variants.map((v) => {
                const margin = marginOf(v);
                return (
                  <TableRow key={v.id}>
                    <TableCell><Checkbox aria-label={t("selectVariant")} checked={bulk.has(v.id)} onCheckedChange={(c) => { const next = new Set(bulk); if (c === true) { next.add(v.id); } else { next.delete(v.id); } setBulk(next); }} /></TableCell>
                    <TableCell><VariantImageCell v={v} draft={draft} setVariant={setVariant} /></TableCell>
                    {draft.options.length ? <TableCell className="whitespace-nowrap text-sm">{v.optionValues.join(" / ")}</TableCell> : null}
                    <TableCell><Input inputMode="decimal" dir="ltr" className="num w-24" value={v.price} onChange={(e) => setVariant(v.id, { price: e.target.value })} aria-label={t("price")} /></TableCell>
                    <TableCell><Input inputMode="decimal" dir="ltr" className="num w-24" value={v.compareAtPrice} onChange={(e) => setVariant(v.id, { compareAtPrice: e.target.value })} aria-label={t("compareAt")} /></TableCell>
                    <TableCell><Input inputMode="decimal" dir="ltr" className="num w-24" value={v.cost} onChange={(e) => setVariant(v.id, { cost: e.target.value })} aria-label={t("fields.cost")} /></TableCell>
                    <TableCell className="whitespace-nowrap">
                      {margin === null ? <span className="text-muted-foreground">—</span> : <span className={cn("num text-sm", margin < 0 && "text-destructive")}>{formatPercent(margin)}</span>}
                    </TableCell>
                    <TableCell><Input dir="ltr" className="num w-32" value={v.sku} onChange={(e) => setVariant(v.id, { sku: e.target.value })} aria-label={t("sku")} /></TableCell>
                    <TableCell><Input dir="ltr" className="num w-32" value={v.barcode} onChange={(e) => setVariant(v.id, { barcode: e.target.value })} aria-label={t("fields.barcode")} /></TableCell>
                    <TableCell><Input inputMode="numeric" dir="ltr" className="num w-20" value={v.weightGrams} onChange={(e) => setVariant(v.id, { weightGrams: e.target.value })} aria-label={t("weight")} /></TableCell>
                    <TableCell>{isNew ? <span className="text-muted-foreground">—</span> : <EntityLink type="variant" id={v.id} label={formatNumber(stockFor(v))} className="num" />}</TableCell>
                    <TableCell>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive size-7" disabled={draft.variants.length <= 1} onClick={() => setDeleteTarget(v)} aria-label={t("deleteVariant")}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {bulk.size ? (
          <div className="bg-accent/40 flex flex-wrap items-center gap-2 rounded-md border p-2 text-sm">
            <span>{t("selected", { count: bulk.size })}</span>
            <Button size="sm" variant="outline" onClick={() => { const price = window.prompt(t("bulkPricePrompt")); if (price && Number(price) > 0) draft.variants.filter((v) => bulk.has(v.id)).forEach((v) => setVariant(v.id, { price })); }}>{t("bulkPrice")}</Button>
            <Button size="sm" variant="outline" onClick={() => { const w = window.prompt(t("bulkWeightPrompt")); if (w && Number(w) >= 0) draft.variants.filter((v) => bulk.has(v.id)).forEach((v) => setVariant(v.id, { weightGrams: w })); }}>{t("bulkWeight")}</Button>
          </div>
        ) : null}
      </CardContent>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title={t("deleteVariantTitle")}
        body={
          <>
            {t("deleteVariantBody")}
            {deleteTarget && orderedVariantIds.has(deleteTarget.id) ? (
              <span className="text-destructive mt-2 block">{t("deleteVariantOrdered")}</span>
            ) : null}
          </>
        }
        confirmLabel={t("deleteVariant")}
        danger
        onConfirm={() => {
          if (deleteTarget) removeVariant(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </Card>
  );
}
