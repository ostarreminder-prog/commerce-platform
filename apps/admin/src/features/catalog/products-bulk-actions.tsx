"use client";

import * as React from "react";
import { CheckCircle2, Download, FolderInput, Layers, Tag, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useAdjustPrices, useDeleteProducts, useInventoryLevels, useProductsAddTag,
  useProductsAddToCategory, useProductsAddToCollection, useSetProductStatus,
} from "@repo/api-client";
import type { Category, Collection } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useStatusLabel } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { toHalalas } from "@repo/ui/lib/money";
import { ExportDialog } from "@/features/catalog/products-export";
import type { Row } from "@/features/catalog/products-shared";

function PriceDialog({ rows, open, onOpenChange }: { rows: Row[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("catalog.products.bulk.price");
  const adjust = useAdjustPrices();
  const [mode, setMode] = React.useState<"percent" | "fixed">("percent");
  const [value, setValue] = React.useState("");
  const submit = () => {
    const n = mode === "percent" ? Number(value) : toHalalas(value);
    if (!Number.isFinite(n) || n === 0) return;
    adjust.mutate([rows.map((r) => r.product.id), mode, n], {
      onSuccess: () => { toast.success(t("done", { count: rows.length })); onOpenChange(false); },
      onError: () => toast.error(t("failed")),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { count: rows.length })}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "percent" | "fixed")} className="grid grid-cols-2 gap-2">
          {(["percent", "fixed"] as const).map((m) => (
            <Label key={m} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-3", mode === m && "border-primary bg-primary/5")}>
              <RadioGroupItem value={m} />{t(m)}
            </Label>
          ))}
        </RadioGroup>
        <div className="space-y-1.5">
          <Label htmlFor="price-value">{t("value")}</Label>
          <Input id="price-value" inputMode="decimal" dir="ltr" value={value} onChange={(e) => setValue(e.target.value)} placeholder={mode === "percent" ? "10" : "5.00"} />
          <p className="text-muted-foreground text-xs">{t("valueHint")}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={submit} disabled={adjust.isPending || !value.trim()}>{t("apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddToDialog({ rows, kind, options, open, onOpenChange }: { rows: Row[]; kind: "category" | "collection"; options: { id: string; label: string }[]; open: boolean; onOpenChange: (v: boolean) => void }) {
  const tCat = useTranslations("catalog.products.bulk.category");
  const tCol = useTranslations("catalog.products.bulk.collection");
  const t = kind === "category" ? tCat : tCol;
  const toCategory = useProductsAddToCategory();
  const toCollection = useProductsAddToCollection();
  const mutation = kind === "category" ? toCategory : toCollection;
  const [target, setTarget] = React.useState("");
  const submit = () => {
    if (!target) return;
    mutation.mutate([rows.map((r) => r.product.id), target], {
      onSuccess: () => { toast.success(t("done", { count: rows.length })); onOpenChange(false); },
      onError: () => toast.error(t("failed")),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { count: rows.length })}</DialogDescription>
        </DialogHeader>
        <Select value={target} onValueChange={setTarget}>
          <SelectTrigger><SelectValue placeholder={t("placeholder")} /></SelectTrigger>
          <SelectContent>
            {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={submit} disabled={mutation.isPending || !target}>{t("apply")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BulkActions({ rows, clear, categories, collections }: { rows: Row[]; clear: () => void; categories: Category[]; collections: Collection[] }) {
  const t = useTranslations("catalog.products.bulk");
  const label = useStatusLabel();
  const { locale } = useAppLocale();
  const canManage = useCan("products.manage");
  const setStatus = useSetProductStatus();
  const addTag = useProductsAddTag();
  const del = useDeleteProducts();
  const levels = useInventoryLevels();
  const [dialog, setDialog] = React.useState<"price" | "category" | "collection" | "delete" | "export" | null>(null);
  const [tag, setTag] = React.useState("");
  const ids = () => rows.map((r) => r.product.id);
  const done = (key: Parameters<typeof t>[0]) => { toast.success(t(key, { count: rows.length })); clear(); };
  const cats = categories.map((c) => ({ id: c.id, label: c.name[locale] ?? c.name.ar }));
  const cols = collections.filter((c) => c.type === "manual").map((c) => ({ id: c.id, label: c.name[locale] ?? c.name.ar }));

  if (!canManage) return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setDialog("export")}><Download aria-hidden />{t("export")}</Button>
      <ExportDialog rows={rows} categories={categories} levels={levels.data ?? []} open={dialog === "export"} onOpenChange={(v) => !v && setDialog(null)} />
    </>
  );
  return (
    <div className="flex flex-wrap gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline"><CheckCircle2 aria-hidden />{t("setStatus")}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(["active", "draft", "archived"] as const).map((s) => (
            <DropdownMenuItem key={s} onSelect={() => setStatus.mutate([ids(), s], { onSuccess: () => done("statused") })}>
              {label("product", "status", s)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Button size="sm" variant="outline" onClick={() => setDialog("price")}>{t("adjustPrices")}</Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("category")} disabled={!cats.length}><FolderInput aria-hidden />{t("toCategory")}</Button>
      <Button size="sm" variant="outline" onClick={() => setDialog("collection")} disabled={!cols.length}><Layers aria-hidden />{t("toCollection")}</Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline"><Tag aria-hidden />{t("addTag")}</Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!tag.trim()) return; addTag.mutate([ids(), tag.trim()], { onSuccess: () => { toast.success(t("tagged", { count: rows.length })); setTag(""); clear(); } }); }}>
            <Input value={tag} onChange={(e) => setTag(e.target.value)} aria-label={t("addTag")} placeholder={t("tagPlaceholder")} />
            <Button type="submit" size="sm">{t("apply")}</Button>
          </form>
        </PopoverContent>
      </Popover>
      <Button size="sm" variant="ghost" onClick={() => setDialog("export")}><Download aria-hidden />{t("export")}</Button>
      <Button size="sm" variant="destructive" onClick={() => setDialog("delete")}><Trash2 aria-hidden />{t("delete")}</Button>

      <ExportDialog rows={rows} categories={categories} levels={levels.data ?? []} open={dialog === "export"} onOpenChange={(v) => !v && setDialog(null)} />

      <PriceDialog rows={rows} open={dialog === "price"} onOpenChange={(v) => !v && setDialog(null)} />
      <AddToDialog rows={rows} kind="category" options={cats} open={dialog === "category"} onOpenChange={(v) => !v && setDialog(null)} />
      <AddToDialog rows={rows} kind="collection" options={cols} open={dialog === "collection"} onOpenChange={(v) => !v && setDialog(null)} />
      <Dialog open={dialog === "delete"} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>{t("deleteDescription", { count: rows.length })}</DialogDescription>
          </DialogHeader>
          <Alert variant="destructive"><AlertDescription>{t("deleteWarning")}</AlertDescription></Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>{t("cancel")}</Button>
            <Button variant="destructive" disabled={del.isPending} onClick={() => del.mutate([ids()], { onSuccess: () => { toast.success(t("deleted", { count: rows.length })); setDialog(null); clear(); } })}>
              {t("confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
