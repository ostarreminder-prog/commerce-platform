"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { EntityLink } from "@/components/entity/entity-link";
import { MediaThumb } from "@repo/ui/components/media-thumb";

/** Manual collection — pick products, then reorder/remove them (order = storefront display order). */
export function ManualProductsCard({ productIds, setProductIds, products }: {
  productIds: string[];
  setProductIds: (ids: string[]) => void;
  products: Product[];
}) {
  const t = useTranslations("collections.detail");
  const { locale } = useAppLocale();
  const [pickerQ, setPickerQ] = React.useState("");
  const pickerResults = products
    .filter((p) => !productIds.includes(p.id) && (!pickerQ.trim() || p.name.ar.includes(pickerQ.trim()) || (p.name.en ?? "").toLowerCase().includes(pickerQ.trim().toLowerCase())))
    .slice(0, 6);
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= productIds.length) return;
    const next = [...productIds];
    [next[i], next[j]] = [next[j] as string, next[i] as string];
    setProductIds(next);
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("manualProducts")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input value={pickerQ} onChange={(e) => setPickerQ(e.target.value)} placeholder={t("searchProducts")} className="ps-9" />
        </div>
        {pickerResults.length ? (
          <ul className="divide-y rounded-md border">
            {pickerResults.map((p) => (
              <li key={p.id} className="flex items-center gap-3 p-2">
                <MediaThumb url={p.media[0]?.url} label={p.name.ar} className="size-9" />
                <span className="min-w-0 flex-1 truncate text-sm">{p.name[locale] ?? p.name.ar}</span>
                <Button size="sm" variant="outline" onClick={() => setProductIds([...productIds, p.id])}><Plus aria-hidden />{t("add")}</Button>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="space-y-1.5">
          {productIds.map((pid, i) => {
            const p = products.find((x) => x.id === pid);
            if (!p) return null;
            return (
              <li key={pid} className="flex items-center gap-1.5 rounded-md border p-2">
                <MediaThumb url={p.media[0]?.url} label={p.name.ar} className="size-9" />
                <EntityLink type="product" id={p.id} className="min-w-0 flex-1 truncate text-sm">{p.name[locale] ?? p.name.ar}</EntityLink>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t("moveUp")}><ArrowUp className="size-3.5" /></Button>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => move(i, 1)} disabled={i === productIds.length - 1} aria-label={t("moveDown")}><ArrowDown className="size-3.5" /></Button>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => setProductIds(productIds.filter((x) => x !== pid))} aria-label={t("remove")}><X className="size-4" /></Button>
              </li>
            );
          })}
          {!productIds.length ? <p className="text-muted-foreground py-4 text-center text-sm">{t("noProducts")}</p> : null}
        </ul>
      </CardContent>
    </Card>
  );
}
