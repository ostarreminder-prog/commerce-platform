"use client";

import Link from "next/link";
import { PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStoreProduct } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { usePageExperience } from "@/lib/page-experience";
import { ProductDetail } from "./product-detail";
import { ProductEditorial } from "./product-editorial";
import { ProductImmersive } from "./product-immersive";

export function ProductView({ id }: { id: string }) {
  const t = useTranslations("store");
  const { data, isPending, isError } = useStoreProduct(id);
  /* Full-page experience picked in the theme editor (theme.pageExperiences).
   * Layout variants share `useProductDetail` — same data, same actions. */
  const experience = usePageExperience("product");
  if (isPending)
    return (
      <div className="container grid gap-8 py-10 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-24" />
          <Skeleton className="h-12" />
        </div>
      </div>
    );
  if (isError || !data)
    return (
      <div className="container py-16">
        <EmptyState
          icon={PackageX}
          title={t("notFoundTitle")}
          description={t("notFoundText")}
          action={
            <Button asChild variant="outline">
              <Link href="/">{t("backHome")}</Link>
            </Button>
          }
        />
      </div>
    );
  if (experience === "immersive-product") return <ProductImmersive product={data} />;
  if (experience === "editorial-showcase") return <ProductEditorial product={data} />;
  return <ProductDetail product={data} />;
}
