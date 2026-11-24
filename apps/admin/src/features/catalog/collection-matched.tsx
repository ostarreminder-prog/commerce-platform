"use client";

import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { MediaThumb } from "@repo/ui/components/media-thumb";

export function MatchedProductsCard({ matched }: { matched: Product[] }) {
  const t = useTranslations("collections.detail");
  const { locale } = useAppLocale();
  return (
    <Card className="sticky top-4">
      <CardHeader><CardTitle className="text-base">{t("matchedTitle", { count: formatNumber(matched.length) })}</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {matched.slice(0, 8).map((p: Product) => (
            <li key={p.id} className="flex items-center gap-2.5 text-sm">
              <MediaThumb url={p.media[0]?.url} label={p.name.ar} className="size-8" />
              <EntityLink type="product" id={p.id} className="min-w-0 flex-1 truncate">{p.name[locale] ?? p.name.ar}</EntityLink>
              <span className="num text-muted-foreground text-xs">{formatMoney(Math.min(...p.variants.map((v) => v.price.amount)), locale)}</span>
            </li>
          ))}
          {!matched.length ? <p className="text-muted-foreground py-3 text-center text-sm">{t("noMatch")}</p> : null}
          {matched.length > 8 ? <p className="text-muted-foreground pt-1 text-center text-xs">{t("andMore", { count: formatNumber(matched.length - 8) })}</p> : null}
        </ul>
      </CardContent>
    </Card>
  );
}
