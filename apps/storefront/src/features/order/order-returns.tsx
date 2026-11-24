"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useReturnList } from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatNumber } from "@repo/ui/lib/format";

/** Return requests filed against this order — status chip per request. */
export function OrderReturnsCard({ order: o }: { order: Order }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { data: returns = [] } = useReturnList();
  const mine = returns.filter((r) => o.returnIds.includes(r.id));
  if (!mine.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <RotateCcw className="text-primary size-4" aria-hidden />
          {t("order.returnsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {mine.map((r) => {
          const count = r.items.reduce((s, i) => s + i.quantity, 0);
          return (
            <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="num font-medium">{t("order.returnNumber", { number: formatNumber(r.number) })}</p>
                <p className="text-muted-foreground num text-xs">
                  {formatDate(r.createdAt, locale)} · {t("order.itemsCount", { count: formatNumber(count) })}
                </p>
              </div>
              <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium">{t(`returnStatus.${r.status}`)}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
