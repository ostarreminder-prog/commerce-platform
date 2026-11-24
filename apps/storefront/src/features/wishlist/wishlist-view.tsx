"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useStoreProducts } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { ProductCard } from "@/components/product-card";
import { useWishlist } from "@/components/wishlist-context";

/** /wishlist — grid of ProductCards for locally-saved ids (guest wishlist). */
export function WishlistView() {
  const t = useTranslations("store");
  const { ids } = useWishlist();
  const { data: products, isPending } = useStoreProducts();

  const saved = ids.flatMap((id) => {
    const p = products?.find((x) => x.id === id && x.status === "active");
    return p ? [p] : [];
  });

  if (isPending) {
    return (
      <div className="container grid grid-cols-2 gap-4 py-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container space-y-6 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Heart className="size-6" aria-hidden />
        {t("wishlist.title")}
      </h1>
      {saved.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {saved.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title={t("wishlist.empty")}
          description={t("wishlist.emptyText")}
          action={
            <Button asChild variant="outline">
              <Link href="/">{t("continue")}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
