"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, FolderX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCategoryList } from "@repo/api-client";
import { useStoreProducts } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { FiltersSheetButton, FiltersSide, FiltersToolbar } from "@/components/filters-ui";
import { ProductCard } from "@/components/product-card";
import { useProductFilters } from "@/components/product-filters";
import { usePageExperience } from "@/lib/page-experience";

export function CategoryView({ slug }: { slug: string }) {
  const t = useTranslations("store");
  const { locale, dir } = useAppLocale();
  const { data: categories = [], isPending: categoriesPending } = useCategoryList();
  const { data: all = [], isPending: productsPending } = useStoreProducts();
  /* Hooks run before the early returns — `base` is empty until the data lands. */
  const category = categories.find((c) => c.slug === slug || c.id === slug);
  const base = all
    .filter((p) => p.categoryId === category?.id && p.status === "active")
    .sort((a, b) => b.salesCount - a.salesCount);
  const filters = useProductFilters(base);
  const products = filters.filtered;
  /* Full-page PLP experience (theme.pageExperiences.category) — visual-discovery
   * drops the sidebar for an on-demand filter sheet and roomier image tiles. */
  const experience = usePageExperience("category");
  const discovery = experience === "visual-discovery";

  if (categoriesPending || productsPending)
    return (
      <div className="container space-y-6 py-10">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );

  if (!category)
    return (
      <div className="container py-16">
        <EmptyState
          icon={FolderX}
          title={t("category.notFoundTitle")}
          description={t("category.notFoundText")}
          action={
            <Button asChild variant="outline">
              <Link href="/">{t("backHome")}</Link>
            </Button>
          }
        />
      </div>
    );

  const Sep = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="container space-y-8 py-6" data-experience={experience}>
      <nav aria-label="breadcrumb" className="text-muted-foreground flex items-center gap-1 text-sm">
        <Link href="/" className="hover:text-foreground">
          {t("home")}
        </Link>
        <Sep className="size-4" aria-hidden />
        <span className="text-foreground truncate">{(category.name[locale] ?? category.name.ar)}</span>
      </nav>
      <div className="bg-muted/40 space-y-2 rounded-2xl px-6 py-10">
        <h1 className="text-2xl font-bold sm:text-3xl">{(category.name[locale] ?? category.name.ar)}</h1>
        {(category.description[locale] ?? category.description.ar) ? <p className="text-muted-foreground max-w-2xl leading-relaxed">{(category.description[locale] ?? category.description.ar)}</p> : null}
        <p className="text-muted-foreground num text-sm">{t("category.productsCount", { count: formatNumber(products.length) })}</p>
      </div>
      <div className={discovery ? "space-y-4" : "flex gap-8"}>
        {discovery ? null : <FiltersSide f={filters} />}
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {discovery ? <FiltersSheetButton f={filters} /> : null}
            <FiltersToolbar f={filters} hideSheetTrigger={discovery} />
          </div>
          {products.length ? (
            <div className={discovery ? "grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3" : "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <MsgEmptyState
              emptyKey="search"
              params={{ query: category.name[locale] ?? slug }}
              action={
                <Button asChild variant="outline">
                  <Link href="/">{t("continue")}</Link>
                </Button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
