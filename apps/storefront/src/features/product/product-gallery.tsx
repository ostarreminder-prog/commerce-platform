"use client";

import * as React from "react";
import type { StoreProduct } from "@/lib/store-product";
import { ProductImage } from "@repo/ui/components/product-image";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";

/** PDP gallery — main image + three hue-derived thumbs. */
export function ProductGallery({ product: p }: { product: StoreProduct }) {
  const { locale } = useAppLocale();
  const [view, setView] = React.useState(0);
  const hues = [p.imageHue, (p.imageHue + 25) % 360, (p.imageHue + 330) % 360];
  return (
    <div className="space-y-3">
      <ProductImage hue={hues[view] ?? p.imageHue} label={(p.name[locale] ?? p.name.ar)} className="aspect-square w-full rounded-2xl" />
      <div className="flex gap-3">
        {hues.map((h, i) => (
          <button
            key={h}
            type="button"
            onClick={() => setView(i)}
            aria-label={`${(p.name[locale] ?? p.name.ar)} ${i + 1}`}
            aria-pressed={view === i}
            className={cn("focus-visible:ring-ring overflow-hidden rounded-lg ring-offset-2 focus-visible:outline-none focus-visible:ring-2", view === i && "ring-primary ring-2")}
          >
            <ProductImage hue={h} label={(p.name[locale] ?? p.name.ar)} className="size-20" />
          </button>
        ))}
      </div>
    </div>
  );
}
