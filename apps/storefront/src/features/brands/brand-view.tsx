"use client";

import Link from "next/link";
import { Award, FolderX, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBrandById } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { ProductImage } from "@repo/ui/components/product-image";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { placeholderHue } from "@repo/ui/lib/media";
import { formatNumber } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FiltersSide, FiltersToolbar } from "@/components/filters-ui";
import { ProductCard } from "@/components/product-card";
import { useProductFilters } from "@/components/product-filters";
import { useStoreProducts } from "@/lib/store-product";

/** Brand detail — merchant brand info + the catalog products carrying it. */
export function BrandView({ id }: { id: string }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { data: brand, isPending: brandPending } = useBrandById(id);
  const { data: all = [], isPending: productsPending } = useStoreProducts();
  const base = all.filter((p) => p.status === "active" && brand && p.product.brand === brand.name.ar);
  const filters = useProductFilters(base);
  const products = filters.filtered;

  if (brandPending || productsPending)
    return (
      <div className="container space-y-6 py-10">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>
    );

  if (!brand || brand.status !== "active")
    return (
      <div className="container py-16">
        <EmptyState
          icon={FolderX}
          title={t("brands.notFoundTitle")}
          description={t("brands.notFoundText")}
          action={
            <Button asChild variant="outline">
              <Link href="/brands">{t("brands.backToBrands")}</Link>
            </Button>
          }
        />
      </div>
    );

  const name = brand.name[locale] ?? brand.name.ar;

  return (
    <div className="container space-y-8 py-6">
      <Breadcrumbs items={[{ label: t("brands.title"), href: "/brands" }, { label: name }]} />
      <div className="bg-muted/40 flex flex-wrap items-center gap-5 rounded-2xl px-6 py-8">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary merchant media url
          <img src={brand.logo.url} alt={name} className="size-16 rounded-2xl object-cover" />
        ) : (
          <ProductImage hue={placeholderHue(brand.slug) ?? 200} label={name} className="size-16 rounded-2xl" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Award className="text-primary size-6 shrink-0" aria-hidden />
            {name}
          </h1>
          {(brand.description[locale] ?? brand.description.ar) ? <p className="text-muted-foreground max-w-2xl leading-relaxed">{(brand.description[locale] ?? brand.description.ar)}</p> : null}
          <p className="text-muted-foreground num text-sm">{t("brands.productsCount", { count: formatNumber(products.length) })}</p>
        </div>
        {brand.website ? (
          <Button variant="outline" size="sm" asChild>
            <a href={brand.website} target="_blank" rel="noopener noreferrer">
              <Globe className="size-4" aria-hidden />
              {t("brands.website")}
            </a>
          </Button>
        ) : null}
      </div>
      <div className="flex gap-8">
        <FiltersSide f={filters} />
        <div className="flex-1 space-y-4">
          <FiltersToolbar f={filters} />
          {products.length ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <MsgEmptyState emptyKey="search" params={{ query: name }} />
          )}
        </div>
      </div>
    </div>
  );
}
