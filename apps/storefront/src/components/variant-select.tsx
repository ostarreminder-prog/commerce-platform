"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { StoreProduct, StoreVariant } from "@/lib/store-product";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";

/**
 * Option-value chips driven by the commerce product (options/variants).
 * Emits the matching StoreVariant once every option has a picked value —
 * `null` while the selection is incomplete. Out-of-stock values are disabled.
 */
export function VariantSelect({
  product: p,
  value,
  onSelect,
}: {
  product: StoreProduct;
  value: StoreVariant | null;
  onSelect: (variant: StoreVariant | null) => void;
}) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const options = p.product.options;
  /* Per-option picked labels — derived from the selected variant so the two
   * never disagree; an incomplete variant selection shows as nothing picked. */
  const picked = value?.optionValues ?? options.map(() => null);

  if (!options.length) return null;

  const pick = (optionIndex: number, label: string | null) => {
    const next = options.map((_, i) => (i === optionIndex ? label : (picked[i] ?? null)));
    if (next.every((v) => v !== null)) {
      onSelect(p.variants.find((v) => v.optionValues.length === next.length && v.optionValues.every((x, i) => x === next[i])) ?? null);
    } else {
      onSelect(null);
    }
  };

  /* A value is unavailable when every variant matching it (under the current
   * picks for the other options) is out of stock. */
  const valueStock = (optionIndex: number, label: string) =>
    p.variants
      .filter((v) => v.optionValues[optionIndex] === label)
      .filter((v) => v.optionValues.every((x, i) => i === optionIndex || picked[i] === null || picked[i] === x))
      .reduce((s, v) => s + v.stock, 0);

  return (
    <div className="space-y-3">
      {options.map((option, oi) => (
        <fieldset key={oi} className="space-y-2">
          <legend className="text-sm font-medium">{t("selectOption", { name: option.name[locale] ?? option.name.ar })}</legend>
          <div className="flex flex-wrap gap-2">
            {option.values.map((v, vi) => {
              const label = v[locale] ?? v.ar;
              const active = picked[oi] === label || picked[oi] === (v.ar ?? label);
              const optionOut = valueStock(oi, v.ar ?? label) <= 0 && valueStock(oi, label) <= 0;
              return (
                <button
                  key={vi}
                  type="button"
                  aria-pressed={active}
                  disabled={optionOut}
                  onClick={() => pick(oi, active ? null : (v.ar ?? label))}
                  className={cn(
                    "min-w-10 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/50",
                    optionOut && "text-muted-foreground line-through opacity-50",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
