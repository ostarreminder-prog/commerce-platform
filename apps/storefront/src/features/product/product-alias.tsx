"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProductList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ProductView } from "./product-view";

const ID_PATTERN = /^prd_/;

/**
 * `/p/[slug]` alias for `/products/[id]`: resolves a product slug via the
 * catalog (products carry slugs); a raw `prd_*` id redirects to the canonical URL.
 */
export function ProductAlias({ slug }: { slug: string }) {
  const t = useTranslations("store");
  const router = useRouter();
  const { data: products = [], isPending } = useProductList();
  const product = products.find((p) => p.slug === slug);
  const looksLikeId = ID_PATTERN.test(slug);

  React.useEffect(() => {
    if (!isPending && !product && looksLikeId) router.replace(`/products/${slug}`);
  }, [isPending, product, looksLikeId, slug, router]);

  if (product) return <ProductView id={product.id} />;
  if (isPending || looksLikeId)
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
}
