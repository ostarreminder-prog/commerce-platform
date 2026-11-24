"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProductList } from "@repo/api-client";
import type { Product } from "@repo/contracts";
import { Input } from "@repo/ui/components/input";
import { Popover, PopoverAnchor, PopoverContent } from "@repo/ui/components/popover";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { MediaThumb } from "@repo/ui/components/media-thumb";

export function ProductPicker({ onAdd }: { onAdd: (p: Product, variantId: string) => void }) {
  const t = useTranslations("sales.newOrder");
  const { locale } = useAppLocale();
  const products = useProductList();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const needle = q.trim().toLowerCase();
  const hits = needle
    ? (products.data ?? []).filter((p) => p.status === "active").flatMap((p) => p.variants.map((v) => ({ p, v })))
        .filter(({ p, v }) => (p.name[locale] ?? p.name.ar).toLowerCase().includes(needle) || v.sku.toLowerCase().includes(needle)).slice(0, 8)
    : [];
  return (
    <Popover open={open && hits.length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={t("searchProduct")} aria-label={t("searchProduct")} className="ps-9" />
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        {hits.map(({ p, v }) => {
          const name = p.name[locale] ?? p.name.ar;
          return (
            <button key={v.id} type="button" className="hover:bg-accent flex w-full items-center gap-3 rounded-sm px-2 py-1.5 text-start text-sm" onClick={() => { onAdd(p, v.id); setQ(""); setOpen(false); }}>
              <MediaThumb url={p.media[0]?.url} label={name} className="size-8" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{name}{v.optionValues.length ? ` · ${v.optionValues.join(" / ")}` : ""}</span>
                <span className="num text-muted-foreground block text-xs" dir="ltr">{v.sku}</span>
              </span>
              <span className="num text-xs font-medium">{formatMoney(v.price.amount, locale)}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
