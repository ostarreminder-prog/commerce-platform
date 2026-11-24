"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStoreProducts } from "@/lib/store-product";
import type { StoreProduct } from "@/lib/store-product";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

/**
 * Prev/next product navigation (spec §8.14) — walks the `useProducts` order
 * within the same category (active products only).
 */
export function ProductSiblings({ product: p }: { product: StoreProduct }) {
  const t = useTranslations("store");
  const { locale, dir } = useAppLocale();
  const { data: all = [] } = useStoreProducts();
  const siblings = all.filter((x) => x.categoryId === p.categoryId && x.status === "active");
  const index = siblings.findIndex((x) => x.id === p.id);
  const prev = index > 0 ? siblings[index - 1] : undefined;
  const next = index >= 0 ? siblings[index + 1] : undefined;
  if (!prev && !next) return null;

  /* prev = earlier in the list → start side in the reading direction. */
  const PrevIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <nav aria-label={t("related")} className="flex items-stretch justify-between gap-3">
      {prev ? (
        <Link
          href={`/products/${prev.id}`}
          className="group hover:border-primary flex min-w-0 flex-1 items-center gap-2 rounded-xl border p-3 transition-colors"
          aria-label={`${t("prevProduct")}: ${(prev.name[locale] ?? prev.name.ar)}`}
        >
          <PrevIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <span className="min-w-0">
            <span className="text-muted-foreground block text-xs">{t("prevProduct")}</span>
            <span className="block truncate text-sm font-medium group-hover:underline">{(prev.name[locale] ?? prev.name.ar)}</span>
          </span>
        </Link>
      ) : (
        <span className="flex-1" aria-hidden />
      )}
      {next ? (
        <Link
          href={`/products/${next.id}`}
          className="group hover:border-primary flex min-w-0 flex-1 items-center justify-end gap-2 rounded-xl border p-3 text-end transition-colors"
          aria-label={`${t("nextProduct")}: ${(next.name[locale] ?? next.name.ar)}`}
        >
          <span className="min-w-0">
            <span className="text-muted-foreground block text-xs">{t("nextProduct")}</span>
            <span className="block truncate text-sm font-medium group-hover:underline">{(next.name[locale] ?? next.name.ar)}</span>
          </span>
          <NextIcon className="text-muted-foreground size-4 shrink-0" aria-hidden />
        </Link>
      ) : (
        <span className="flex-1" aria-hidden />
      )}
    </nav>
  );
}
