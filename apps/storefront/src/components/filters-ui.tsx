"use client";

import { SlidersHorizontal, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@repo/ui/components/sheet";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { RATING_STEPS, type ProductFilters } from "./product-filters";

/** Facet groups — shared by the desktop aside and the mobile sheet. */
export function FiltersPanel({ f }: { f: ProductFilters }) {
  const t = useTranslations("store.filters");
  return (
    <div className="space-y-6">
      {f.showCategories && f.cats.length ? (
        <fieldset className="space-y-2.5">
          <legend className="mb-2 text-sm font-semibold">{t("categories")}</legend>
          {f.cats.map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={f.selectedCats.includes(c.id)} onCheckedChange={() => f.toggleCat(c.id)} aria-label={c.label} />
              <span className="flex-1">{c.label}</span>
              <span className="text-muted-foreground num text-xs">{formatNumber(c.count)}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <fieldset className="space-y-2.5">
        <legend className="mb-2 text-sm font-semibold">{t("price")}</legend>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} inputMode="numeric" placeholder={t("priceFrom")} aria-label={t("priceFrom")} value={f.min} onChange={(e) => f.setMin(e.target.value)} className="num" />
          <span className="text-muted-foreground" aria-hidden>—</span>
          <Input type="number" min={0} inputMode="numeric" placeholder={t("priceTo")} aria-label={t("priceTo")} value={f.max} onChange={(e) => f.setMax(e.target.value)} className="num" />
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={f.inStock} onCheckedChange={(v) => f.setInStock(v === true)} aria-label={t("inStock")} />
        <span className="flex-1">{t("inStock")}</span>
        <span className="text-muted-foreground num text-xs">{formatNumber(f.inStockCount)}</span>
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("rating")}</legend>
        <RadioGroup value={f.rate} onValueChange={f.setRate} className="space-y-2.5">
          {RATING_STEPS.map((n) => (
            <label key={n} className="flex cursor-pointer items-center gap-2 text-sm">
              <RadioGroupItem value={n} id={`rate-${n}`} />
              <Star className="size-3.5 fill-warning text-warning" aria-hidden />
              <span className="flex-1">{t("ratingUp", { count: formatNumber(Number(n)) })}</span>
              <span className="text-muted-foreground num text-xs">{formatNumber(f.ratingCounts[n] ?? 0)}</span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>
    </div>
  );
}

/** Filter sheet trigger + panel — `className` controls visibility (mobile-only in the toolbar, all sizes in visual-discovery). */
export function FiltersSheetButton({ f, className }: { f: ProductFilters; className?: string }) {
  const t = useTranslations("store.filters");
  if (!f.enabled) return null;
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className={cn("gap-2", className)}>
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("title")}
          {f.activeCount > 0 ? <span className="num bg-primary text-primary-foreground rounded-full px-1.5 text-[10px] font-semibold">{formatNumber(f.activeCount)}</span> : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="start">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 overflow-y-auto">
          <FiltersPanel f={f} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Selected-filter chips + "مسح الكل" + the mobile filter sheet trigger. */
export function FiltersToolbar({ f, hideSheetTrigger }: { f: ProductFilters; hideSheetTrigger?: boolean }) {
  const t = useTranslations("store.filters");
  if (!f.enabled) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {hideSheetTrigger ? null : <FiltersSheetButton f={f} className="lg:hidden" />}
      {f.chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={chip.remove}
          className="bg-muted hover:bg-accent flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
        >
          {chip.label}
          <X className="size-3" aria-hidden />
        </button>
      ))}
      {f.hasActive ? (
        <Button variant="ghost" size="sm" onClick={f.clearAll}>
          {t("clear")}
        </Button>
      ) : null}
    </div>
  );
}

/** Desktop sidebar column — hidden below lg (the toolbar sheet covers mobile). */
export function FiltersSide({ f }: { f: ProductFilters }) {
  const t = useTranslations("store.filters");
  if (!f.enabled) return null;
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <div className="sticky top-4 space-y-4 rounded-2xl border p-5">
        <p className="flex items-center gap-2 text-sm font-bold">
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("title")}
        </p>
        <FiltersPanel f={f} />
      </div>
    </aside>
  );
}
