"use client";

import * as React from "react";
import { Tag, TicketPercent } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePromotionList } from "@repo/api-client";
import type { Promotion } from "@repo/contracts";
import { Card, CardContent } from "@repo/ui/components/card";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber, formatPercent } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductCard } from "@/components/product-card";
import { useStoreProducts, type StoreProduct } from "@/lib/store-product";

const DISCOUNT_STEPS = [0, 10, 25, 50] as const;

const saleOf = (p: StoreProduct) => (p.compareAtPrice && p.compareAtPrice > p.price ? 1 - p.price / p.compareAtPrice : 0);

/** Live countdown for a promotion end date — ticks every second below a week. */
function useCountdown(endsAt: string | null) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return Math.max(0, +new Date(endsAt ?? 0) - now);
}

function PromoCard({ promo }: { promo: Promotion }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const left = useCountdown(promo.endsAt);
  const secs = Math.floor(left / 1000);
  const d = Math.floor(secs / 86_400);
  const h = Math.floor((secs % 86_400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <TicketPercent className="text-primary size-8 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{(promo.name[locale] ?? promo.name.ar)}</p>
            <p className="text-muted-foreground text-sm">{t(`offers.promo.${promo.benefit.kind}`, { value: formatNumber(promo.benefit.value ?? 0), buy: formatNumber(promo.config?.buy ?? 0), get: formatNumber(promo.config?.get ?? 0) })}</p>
          </div>
        </div>
        {promo.endsAt && left > 0 ? (
          <p className="bg-background num rounded-lg border px-3 py-1.5 text-sm font-semibold" dir="ltr">
            {d > 0 ? `${d}d ` : ""}
            {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function OffersView() {
  const t = useTranslations("store");
  const { data: all = [], isPending } = useStoreProducts();
  const { data: promotions = [] } = usePromotionList();
  const [minSale, setMinSale] = React.useState<number>(0);

  const active = promotions.filter((p) => p.status === "active");
  const discounted = all
    .filter((p) => p.status === "active" && saleOf(p) > 0 && saleOf(p) * 100 >= minSale)
    .sort((a, b) => saleOf(b) - saleOf(a));
  const discountedTotal = all.filter((p) => p.status === "active" && saleOf(p) > 0).length;

  if (isPending)
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

  return (
    <div className="container space-y-8 py-8">
      <Breadcrumbs items={[{ label: t("offers.title") }]} />
      <div className="flex items-center gap-3">
        <Tag className="text-primary size-7" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">{t("offers.title")}</h1>
          <p className="text-muted-foreground num text-sm">{t("offers.count", { count: formatNumber(discountedTotal) })}</p>
        </div>
      </div>
      {active.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {active.map((p) => (
            <PromoCard key={p.id} promo={p} />
          ))}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("offers.filterLabel")}>
        {DISCOUNT_STEPS.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={minSale === n}
            onClick={() => setMinSale(n)}
            className={cn(
              "num rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              minSale === n ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent",
            )}
          >
            {n === 0 ? t("offers.all") : t("offers.minDiscount", { percent: formatPercent(n / 100, 0) })}
          </button>
        ))}
      </div>
      {discounted.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {discounted.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <MsgEmptyState emptyKey="search" params={{ query: t("offers.title") }} />
      )}
    </div>
  );
}
