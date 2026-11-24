"use client";

import Link from "next/link";
import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBrandList } from "@repo/api-client";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { ProductImage } from "@repo/ui/components/product-image";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { placeholderHue } from "@repo/ui/lib/media";
import { formatNumber } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useStoreProducts } from "@/lib/store-product";

/** Brand directory — merchant-managed brands (admin /brands) with live product counts. */
export function BrandsView() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { data: brands = [], isPending: brandsPending } = useBrandList();
  const { data: products = [], isPending: productsPending } = useStoreProducts();
  const isPending = brandsPending || productsPending;

  if (isPending)
    return (
      <div className="container space-y-6 py-10">
        <Skeleton className="h-10 w-56" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    );

  const visible = brands.filter((b) => b.status === "active");
  const countFor = (b: (typeof brands)[number]) => products.filter((p) => p.status === "active" && p.product.brand === b.name.ar).length;

  return (
    <div className="container space-y-8 py-8">
      <Breadcrumbs items={[{ label: t("brands.title") }]} />
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{t("brands.title")}</h1>
        <p className="text-muted-foreground text-sm">{t("brands.subtitle")}</p>
      </div>
      {visible.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visible.map((b) => {
            const count = countFor(b);
            return (
              <Link
                key={b.id}
                href={`/brands/${b.id}`}
                className="group bg-card hover:border-primary/40 flex flex-col items-center gap-3 rounded-2xl border p-6 text-center transition-colors"
              >
                {b.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary merchant media url
                  <img src={b.logo.url} alt={(b.name[locale] ?? b.name.ar)} className="size-14 rounded-full object-cover" />
                ) : (
                  <ProductImage hue={placeholderHue(b.slug) ?? 200} label={(b.name[locale] ?? b.name.ar)} className="size-14 rounded-full" />
                )}
                <span className="font-semibold group-hover:text-primary transition-colors">{(b.name[locale] ?? b.name.ar)}</span>
                <span className="text-muted-foreground num text-xs">{t("brands.productsCount", { count: formatNumber(count) })}</span>
              </Link>
            );
          })}
        </div>
      ) : (
        <MsgEmptyState emptyKey="search" params={{ query: t("brands.title") }} />
      )}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Award className="size-3.5" aria-hidden />
        {t("brands.note")}
      </p>
    </div>
  );
}
