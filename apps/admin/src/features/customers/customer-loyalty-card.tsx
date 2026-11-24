"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLoyaltyAccount, useLoyaltyTransactions } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime, formatNumber } from "@repo/ui/lib/format";

/** Loyalty balance + recent ledger for one customer — rendered on the profile page. */
export function CustomerLoyaltyCard({ customerId }: { customerId: string }) {
  const t = useTranslations("customers.loyalty");
  const { locale } = useAppLocale();
  const account = useLoyaltyAccount(customerId);
  const txns = useLoyaltyTransactions(customerId);
  const a = account.data;
  if (!a) return null;
  const recent = (txns.data ?? []).slice(0, 5);
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base"><Star className="size-4" aria-hidden /> {t("title")}</CardTitle>
        <Badge variant="secondary">{t(`tiers.${a.tier}`)}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <p className="num text-2xl font-semibold">{formatNumber(a.points)}</p>
          <p className="text-muted-foreground text-xs">{t("lifetime", { count: formatNumber(a.lifetimeEarned) })}</p>
        </div>
        {recent.length ? (
          <ul className="space-y-1.5">
            {recent.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground text-xs">{t(`txn.${x.type}`)}</span>
                  {x.note ? <span className="text-muted-foreground block truncate text-xs">{x.note}</span> : null}
                </span>
                <span className="shrink-0 text-end">
                  <span className={cn("num block text-sm font-medium", x.points > 0 ? "text-success" : "text-destructive")}>{x.points > 0 ? "+" : ""}{formatNumber(x.points)}</span>
                  <span className="text-muted-foreground block text-xs">{formatDateTime(x.at, locale)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="text-muted-foreground text-xs">{t("emptyLedger")}</p>}
      </CardContent>
    </Card>
  );
}
