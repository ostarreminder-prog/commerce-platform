"use client";

import * as React from "react";
import { Archive, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCustomerList, useDeletePriceList, usePriceLists, useProductList, useSavePriceList, useSetPriceListStatus,
} from "@repo/api-client";
import type { PriceList } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";

interface RuleDraft { id?: string; variantId: string; percentOff: string; fixedPrice: string }
interface ListDraft { id?: string; nameAr: string; nameEn: string; customerIds: string[]; rules: RuleDraft[] }

const blank = (): ListDraft => ({ nameAr: "", nameEn: "", customerIds: [], rules: [{ variantId: "all", percentOff: "10", fixedPrice: "" }] });

/** `/products/price-lists` — B2B/wholesale pricing (spec §5.19). */
export function PriceListsScreen() {
  const t = useTranslations("catalog.priceLists");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const lists = usePriceLists();
  const products = useProductList();
  const customers = useCustomerList();
  const save = useSavePriceList();
  const setStatus = useSetPriceListStatus();
  const del = useDeletePriceList();
  const [draft, setDraft] = React.useState<ListDraft | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const variants = React.useMemo(() => (products.data ?? []).flatMap((p) => p.variants.map((v) => ({
    id: v.id,
    label: `${p.name[locale] ?? p.name.ar}${v.optionValues.length ? ` — ${v.optionValues.join(" / ")}` : ""} (${v.sku})`,
  }))), [products.data, locale]);

  const openEdit = (l: PriceList) => setDraft({
    id: l.id, nameAr: l.name.ar, nameEn: l.name.en ?? "", customerIds: [...l.customerIds],
    rules: l.rules.map((r) => ({ id: r.id, variantId: r.variantId ?? "all", percentOff: r.percentOff == null ? "" : String(r.percentOff), fixedPrice: r.fixedPrice == null ? "" : String(r.fixedPrice.amount / 100) })),
  });

  const submit = () => {
    const d = draft;
    if (!d) return;
    if (!d.nameAr.trim()) { toast.error(t("nameRequired")); return; }
    const rules = d.rules.map((r) => {
      const pct = r.percentOff.trim() === "" ? null : Number(r.percentOff);
      const fixed = r.fixedPrice.trim() === "" ? null : Math.round(Number(r.fixedPrice) * 100);
      return { id: r.id, variantId: r.variantId === "all" ? null : r.variantId, percentOff: pct, fixedPrice: fixed };
    });
    save.mutate([{ id: d.id, name: { ar: d.nameAr.trim(), en: d.nameEn.trim() || undefined }, customerIds: d.customerIds, rules }], {
      onSuccess: () => { mt.success("priceLists.saved"); setDraft(null); },
      onError: (e) => mt.error(e.message === "rules" ? "priceLists.rulesRequired" : e.message === "percent" ? "priceLists.percentInvalid" : "common.save.error"),
    });
  };

  const columns: ColumnDef<PriceList, unknown>[] = [
    { id: "name", accessorKey: "name.ar", header: t("cols.name"), cell: ({ row }) => <span className="font-medium">{row.original.name[locale] ?? row.original.name.ar}</span> },
    { id: "customers", header: t("cols.customers"), cell: ({ row }) => <span className="num text-muted-foreground">{formatNumber(row.original.customerIds.length)}</span> },
    { id: "rules", header: t("cols.rules"), cell: ({ row }) => <span className="num text-muted-foreground">{formatNumber(row.original.rules.length)}</span> },
    { id: "status", accessorKey: "status", header: t("cols.status"), cell: ({ row }) => <Badge variant={row.original.status === "active" ? "success" : "secondary"}>{t(`status.${row.original.status}`)}</Badge> },
    {
      id: "actions", header: "", cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(row.original)}><Pencil className="size-3.5" aria-hidden /> {t("edit")}</Button>
          <Button variant="ghost" size="sm" onClick={() => setStatus.mutate([row.original.id, row.original.status === "active" ? "archived" : "active"], { onSuccess: () => mt.success("priceLists.saved") })}>
            <Archive className="size-3.5" aria-hidden /> {row.original.status === "active" ? t("archive") : t("restore")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteId(row.original.id)}><Trash2 className="size-3.5" aria-hidden /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<Button onClick={() => setDraft(blank())}><Plus aria-hidden /> {t("new")}</Button>} />
      <DataState
        state={lists}
        loading={<TableSkeleton rows={5} columns={5} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={Wallet} title={t("noneTitle")} description={t("noneDescription")} action={<Button onClick={() => setDraft(blank())}><Plus aria-hidden /> {t("new")}</Button>} /></Card>}
      >
        {(data) => <Card className="p-0"><DataTable columns={columns} data={data} getRowId={(l) => l.id} pageSize={15} /></Card>}
      </DataState>

      <Dialog open={Boolean(draft)} onOpenChange={(o) => { if (!o) setDraft(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{draft?.id ? t("editTitle") : t("newTitle")}</DialogTitle></DialogHeader>
          {draft ? (
            <div className="max-h-[70vh] space-y-5 overflow-y-auto pe-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pl-name-ar">{t("form.nameAr")}</Label>
                  <Input id="pl-name-ar" value={draft.nameAr} onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pl-name-en">{t("form.nameEn")}</Label>
                  <Input id="pl-name-en" dir="ltr" value={draft.nameEn} onChange={(e) => setDraft({ ...draft, nameEn: e.target.value })} />
                </div>
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t("customersTitle")}</h3>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {(customers.data ?? []).map((c) => (
                    <label key={c.id} htmlFor={`pl-c-${c.id}`} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <Checkbox
                        id={`pl-c-${c.id}`}
                        checked={draft.customerIds.includes(c.id)}
                        onCheckedChange={(v) => setDraft({ ...draft, customerIds: v === true ? [...draft.customerIds, c.id] : draft.customerIds.filter((x) => x !== c.id) })}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">{t("customersHint")}</p>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">{t("rulesTitle")}</h3>
                  <Button variant="outline" size="sm" onClick={() => setDraft({ ...draft, rules: [...draft.rules, { variantId: "all", percentOff: "", fixedPrice: "" }] })}>
                    <Plus className="size-3.5" aria-hidden /> {t("addRule")}
                  </Button>
                </div>
                {draft.rules.map((r, i) => (
                  <div key={i} className="grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_7rem_7rem_2rem]">
                    <div className="space-y-1">
                      <Label className="text-xs">{t("ruleVariant")}</Label>
                      <Select value={r.variantId} onValueChange={(v) => setDraft({ ...draft, rules: draft.rules.map((x, j) => (j === i ? { ...x, variantId: v } : x)) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("allVariants")}</SelectItem>
                          {variants.map((v) => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("percentOff")}</Label>
                      <Input dir="ltr" className="num" inputMode="decimal" value={r.percentOff} disabled={r.fixedPrice.trim() !== ""} onChange={(e) => setDraft({ ...draft, rules: draft.rules.map((x, j) => (j === i ? { ...x, percentOff: e.target.value } : x)) })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t("fixedPrice")}</Label>
                      <Input dir="ltr" className="num" inputMode="decimal" value={r.fixedPrice} disabled={r.percentOff.trim() !== ""} onChange={(e) => setDraft({ ...draft, rules: draft.rules.map((x, j) => (j === i ? { ...x, fixedPrice: e.target.value } : x)) })} />
                    </div>
                    <Button variant="ghost" size="icon" aria-label={t("removeRule")} onClick={() => setDraft({ ...draft, rules: draft.rules.filter((_, j) => j !== i) })}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                <p className="text-muted-foreground text-xs">{t("rulesHint")}</p>
              </section>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>{tc("cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending}>{tc("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        titleKey="priceLists.deleteTitle"
        bodyKey="priceLists.deleteBody"
        confirmLabel={t("delete")}
        danger
        pending={del.isPending}
        onConfirm={() => { if (deleteId) del.mutate([deleteId], { onSuccess: () => { mt.success("common.deleted"); setDeleteId(null); } }); }}
      />
    </div>
  );
}
