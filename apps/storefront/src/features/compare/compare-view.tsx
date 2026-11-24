"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Scale, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCategoryList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ProductImage } from "@repo/ui/components/product-image";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { useCart } from "@/components/cart-context";
import { useCompare } from "@/components/compare-context";

/** /compare — spec table for the picked products (image/price/rating/stock/category/description rows). */
export function CompareView() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { items, remove, clear } = useCompare();
  const { add } = useCart();
  const { data: categories = [] } = useCategoryList();

  if (!items.length) {
    return (
      <div className="container py-10">
        <EmptyState
          icon={Scale}
          title={t("compare.empty")}
          description={t("compare.emptyText")}
          action={
            <Button asChild variant="outline">
              <Link href="/">{t("continue")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const rows: { label: string; render: (p: (typeof items)[number]) => ReactNode }[] = [
    {
      label: t("compare.rows.price"),
      render: (p) => (
        <div>
          <span className="num font-semibold">{formatMoney(p.price, locale)}</span>
          {p.compareAtPrice && p.compareAtPrice > p.price ? (
            <span className="text-muted-foreground num ms-2 text-xs line-through">{formatMoney(p.compareAtPrice, locale)}</span>
          ) : null}
        </div>
      ),
    },
    {
      label: t("compare.rows.rating"),
      render: (p) => (
        <span className="flex items-center gap-1">
          <Star className="size-4 fill-warning text-warning" aria-hidden />
          <span className="num">{formatNumber(p.rating, { maximumFractionDigits: 1 })}</span>
          <span className="text-muted-foreground num text-xs">({formatNumber(p.reviewsCount)})</span>
        </span>
      ),
    },
    {
      label: t("compare.rows.stock"),
      render: (p) => (
        <span className={cn("text-sm font-medium", p.stock <= 0 ? "text-destructive" : p.stock <= p.lowStockThreshold ? "text-warning" : "text-success")}>
          {p.stock <= 0 ? t("outOfStock") : p.stock <= p.lowStockThreshold ? t("lowStock", { count: formatNumber(p.stock) }) : t("inStock")}
        </span>
      ),
    },
    { label: t("compare.rows.category"), render: (p) => categories.find((c) => c.id === p.categoryId)?.name[locale] ?? "—" },
    { label: t("compare.rows.description"), render: (p) => <p className="text-muted-foreground line-clamp-3 text-sm">{(p.description[locale] ?? p.description.ar)}</p> },
  ];

  return (
    <div className="container space-y-6 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Scale className="size-6" aria-hidden />
          {t("compare.title")}
        </h1>
        <Button variant="outline" size="sm" onClick={clear}>
          {t("compare.clear")}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-muted-foreground w-32 p-3 text-start font-medium">{t("compare.rows.product")}</th>
              {items.map((p) => (
                <th key={p.id} className="min-w-48 p-3 align-top">
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={`${t("remove")}: ${(p.name[locale] ?? p.name.ar)}`}
                      onClick={() => remove(p.id)}
                      className="bg-muted hover:bg-destructive hover:text-destructive-foreground absolute -top-1 end-0 z-10 flex size-6 items-center justify-center rounded-full"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                    <Link href={`/products/${p.id}`}>
                      <ProductImage hue={p.imageHue} label={(p.name[locale] ?? p.name.ar)} className="aspect-square w-full rounded-lg" />
                    </Link>
                    <Link href={`/products/${p.id}`} className="mt-2 line-clamp-2 block text-start font-medium hover:underline">
                      {(p.name[locale] ?? p.name.ar)}
                    </Link>
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      disabled={p.stock <= 0}
                      onClick={() => {
                        add(p.id);
                        toast.success(t("added"), { description: (p.name[locale] ?? p.name.ar) });
                      }}
                    >
                      {t("addToCart")}
                    </Button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t">
                <th className="text-muted-foreground p-3 text-start font-medium">{row.label}</th>
                {items.map((p) => (
                  <td key={p.id} className="p-3 align-top">
                    {row.render(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
