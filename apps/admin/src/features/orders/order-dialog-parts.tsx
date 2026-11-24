"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { Order } from "@repo/contracts";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { MediaThumb } from "@repo/ui/components/media-thumb";

export interface DialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function Check({ id, checked, onChange, children }: { id: string; checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} />
      <Label htmlFor={id} className="font-normal">{children}</Label>
    </div>
  );
}

export function QtyLines({ order, qty, setQty, max }: { order: Order; qty: Record<string, number>; setQty: (id: string, n: number) => void; max: (i: Order["items"][number]) => number }) {
  const { locale } = useAppLocale();
  const t = useTranslations("sales.dialogs");
  return (
    <ul className="divide-y rounded-md border">
      {order.items.map((i) => {
        const name = i.productName[locale] ?? i.productName.ar;
        const m = max(i);
        return (
          <li key={i.id} className="flex items-center gap-3 p-2.5">
            <MediaThumb url={i.image?.url} label={name} className="size-9" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="truncate font-medium">{name}</p>
              <p className="text-muted-foreground num text-xs">{t("ofMax", { max: m })} · {formatMoney(i.unitPrice.amount, locale)}</p>
            </div>
            <Input
              type="number"
              min={0}
              max={m}
              value={qty[i.id] ?? 0}
              disabled={m === 0}
              onChange={(e) => setQty(i.id, Math.max(0, Math.min(m, Number(e.target.value))))}
              className="num w-20"
              aria-label={t("qtyFor", { name })}
            />
          </li>
        );
      })}
    </ul>
  );
}

export const RATES = [
  { carrier: "أرامكس", service: "توصيل عادي", price: 2_500, etaDays: 3 },
  { carrier: "سمسا", service: "توصيل سريع", price: 3_500, etaDays: 1 },
  { carrier: "سبل", service: "توصيل عادي", price: 1_800, etaDays: 4 },
  { carrier: "ريدبوكس", service: "استلام من خزانة", price: 1_500, etaDays: 2 },
];
