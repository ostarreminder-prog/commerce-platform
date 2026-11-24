"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { StoreProduct } from "@/lib/store-product";
import { Button } from "@repo/ui/components/button";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { useStoreFeatures } from "@/lib/features";

/**
 * Mobile sticky buy bar — appears (md:hidden) once the real add-to-cart
 * button scrolls out of view (IntersectionObserver on `watchRef`).
 */
export function StickyBuyBar({
  product: p,
  price,
  variant,
  disabled,
  watchRef,
  onAdd,
}: {
  product: StoreProduct;
  price?: number;
  variant: string | null;
  disabled: boolean;
  watchRef: React.RefObject<HTMLElement | null>;
  onAdd: () => void;
}) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { on } = useStoreFeatures();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const el = watchRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => setVisible(entries[0] ? !entries[0].isIntersecting : false), { threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [watchRef]);

  if (!on("stickyBuyBar") || !visible) return null;

  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t p-3 backdrop-blur md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="num font-bold">{formatMoney(price ?? p.price, locale)}</p>
          {variant ? <p className="text-muted-foreground truncate text-xs">{variant}</p> : null}
        </div>
        <Button className="flex-1" disabled={disabled} onClick={onAdd}>
          {disabled ? t("outOfStock") : t("addToCart")}
        </Button>
      </div>
    </div>
  );
}
