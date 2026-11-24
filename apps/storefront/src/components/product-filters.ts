"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCategoryList } from "@repo/api-client";
import type { StoreProduct } from "@/lib/store-product";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { useStoreFeatures } from "@/lib/features";

/**
 * URL-persisted catalog filters (spec §8.13): categories / price range /
 * in-stock / min rating. Selected values render as removable chips with a
 * "مسح الكل" action; every option shows its count against the base list.
 * Gated by the `quickFilters` theme feature — when off the base list passes
 * through untouched. UI pieces live in `filters-ui.tsx`.
 */

export interface ActiveChip {
  id: string;
  label: string;
  remove: () => void;
}

export interface ProductFilters {
  enabled: boolean;
  filtered: StoreProduct[];
  hasActive: boolean;
  activeCount: number;
  chips: ActiveChip[];
  clearAll: () => void;
  /* panel props */
  showCategories: boolean;
  cats: { id: string; label: string; count: number }[];
  selectedCats: string[];
  toggleCat: (id: string) => void;
  min: string;
  max: string;
  setMin: (v: string) => void;
  setMax: (v: string) => void;
  inStock: boolean;
  setInStock: (v: boolean) => void;
  inStockCount: number;
  rate: string;
  setRate: (v: string) => void;
  ratingCounts: Record<string, number>;
}

export const RATING_STEPS = ["4", "3", "2", "1"] as const;
const FILTER_KEYS = ["cat", "min", "max", "in", "rate"] as const;

export function useProductFilters(base: StoreProduct[], opts?: { showCategories?: boolean }): ProductFilters {
  const { on } = useStoreFeatures();
  const { locale } = useAppLocale();
  const t = useTranslations("store.filters");
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const enabled = on("quickFilters");
  const showCategories = opts?.showCategories ?? false;
  const { data: categories = [] } = useCategoryList();

  const get = React.useCallback((k: string) => (enabled ? (params.get(k) ?? "") : ""), [enabled, params]);
  const catCsv = get("cat");
  const min = get("min");
  const max = get("max");
  const inStock = get("in") === "1";
  const rate = get("rate");

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const selectedCats = React.useMemo(() => (showCategories && catCsv ? catCsv.split(",").filter(Boolean) : []), [catCsv, showCategories]);
  const toggleCat = React.useCallback(
    (id: string) => {
      const next = selectedCats.includes(id) ? selectedCats.filter((c) => c !== id) : [...selectedCats, id];
      setParam("cat", next.length ? next.join(",") : null);
    },
    [selectedCats, setParam],
  );

  const filtered = React.useMemo(() => {
    if (!enabled) return base;
    const minHalalas = min ? Number(min) * 100 : null;
    const maxHalalas = max ? Number(max) * 100 : null;
    const minRate = rate ? Number(rate) : null;
    return base.filter(
      (p) =>
        (!selectedCats.length || selectedCats.includes(p.categoryId)) &&
        (minHalalas === null || p.price >= minHalalas) &&
        (maxHalalas === null || p.price <= maxHalalas) &&
        (!inStock || p.stock > 0) &&
        (minRate === null || p.rating >= minRate),
    );
  }, [enabled, base, selectedCats, min, max, inStock, rate]);

  const cats = React.useMemo(
    () =>
      showCategories
        ? categories.map((c) => ({ id: c.id, label: c.name[locale] ?? c.name.ar, count: base.filter((p) => p.categoryId === c.id).length }))
        : [],
    [showCategories, categories, base, locale],
  );
  const inStockCount = React.useMemo(() => base.filter((p) => p.stock > 0).length, [base]);
  const ratingCounts = React.useMemo(
    () => Object.fromEntries(RATING_STEPS.map((n) => [n, base.filter((p) => p.rating >= Number(n)).length])),
    [base],
  );

  const chips = React.useMemo<ActiveChip[]>(() => {
    const list: ActiveChip[] = [];
    for (const id of selectedCats) {
      const label = cats.find((c) => c.id === id)?.label ?? id;
      list.push({ id: `cat:${id}`, label, remove: () => toggleCat(id) });
    }
    if (min) list.push({ id: "min", label: `${t("priceFrom")} ${min}`, remove: () => setParam("min", null) });
    if (max) list.push({ id: "max", label: `${t("priceTo")} ${max}`, remove: () => setParam("max", null) });
    if (inStock) list.push({ id: "in", label: t("inStock"), remove: () => setParam("in", null) });
    if (rate) list.push({ id: "rate", label: t("ratingUp", { count: formatNumber(Number(rate)) }), remove: () => setParam("rate", null) });
    return list;
  }, [selectedCats, cats, min, max, inStock, rate, toggleCat, setParam, t]);

  const clearAll = React.useCallback(() => {
    const next = new URLSearchParams(params.toString());
    for (const k of FILTER_KEYS) next.delete(k);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return {
    enabled, filtered, hasActive: chips.length > 0, activeCount: chips.length, chips, clearAll,
    showCategories, cats, selectedCats, toggleCat, min, max, setMin: (v) => setParam("min", v), setMax: (v) => setParam("max", v),
    inStock, setInStock: (v) => setParam("in", v ? "1" : null), inStockCount, rate, setRate: (v) => setParam("rate", v === rate ? null : v), ratingCounts,
  };
}
