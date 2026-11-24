"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { sar, toHalalas } from "@repo/ui/lib/money";
import { ProductPicker } from "@/components/product-picker";
import type { Line } from "./new-order-utils";

export function NewOrderItemsCard({
  lines, addLine, patch, setLines, canEditPrice, error,
}: {
  lines: Line[];
  addLine: (p: Product, variantId: string) => void;
  patch: (variantId: string, p: Partial<Line>) => void;
  setLines: React.Dispatch<React.SetStateAction<Line[]>>;
  canEditPrice: boolean;
  error: React.ReactNode;
}) {
  const t = useTranslations("sales.newOrder");
  const { locale } = useAppLocale();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("products")} *</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <ProductPicker onAdd={addLine} />
        {lines.length ? (
          <ul className="divide-y rounded-md border">
            {lines.map((l) => (
              <li key={l.variantId} className="flex flex-wrap items-center gap-3 p-3">
                <MediaThumb url={l.image} label={l.name} />
                <div className="min-w-0 flex-1">
                  <EntityLink type="product" id={l.productId} label={l.name} className="line-clamp-1 text-sm" />
                  <p className="num text-muted-foreground text-xs" dir="ltr">{l.sku}</p>
                  {l.available !== null && l.quantity > l.available ? <p className="text-warning text-xs">{t("lowStock", { n: l.available })}</p> : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-8" aria-label={t("decrease")} onClick={() => patch(l.variantId, { quantity: Math.max(1, l.quantity - 1) })}><Minus aria-hidden /></Button>
                  <Input className="num h-8 w-14 text-center" inputMode="numeric" value={l.quantity} aria-label={t("quantity")} onChange={(e) => patch(l.variantId, { quantity: Math.max(1, Number(e.target.value) || 1) })} />
                  <Button size="icon" variant="outline" className="size-8" aria-label={t("increase")} onClick={() => patch(l.variantId, { quantity: l.quantity + 1 })}><Plus aria-hidden /></Button>
                </div>
                {canEditPrice ? (
                  <Input className="num h-8 w-24" dir="ltr" inputMode="decimal" aria-label={t("unitPrice")} defaultValue={sar(l.unitPrice)} onBlur={(e) => patch(l.variantId, { unitPrice: Math.max(0, toHalalas(e.target.value || 0)) })} />
                ) : (
                  <span className="num w-24 text-sm">{formatMoney(l.unitPrice, locale)}</span>
                )}
                <span className="num w-24 text-end text-sm font-medium">{formatMoney(l.unitPrice * l.quantity, locale)}</span>
                <Button size="icon" variant="ghost" className="size-8" aria-label={t("remove")} onClick={() => setLines((ls) => ls.filter((x) => x.variantId !== l.variantId))}><Trash2 aria-hidden /></Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">{t("noProducts")}</p>
        )}
        {error}
      </CardContent>
    </Card>
  );
}
