"use client";

import Link from "next/link";
import { Crown, Gift, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useGiftCards, useLoyaltyAccount, useLoyaltySettings, useLoyaltyTransactions } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { AccountNav } from "./account-nav";
import { GuestGate } from "./guest-gate";
import { useSession } from "@/components/session-context";

const TIER_ICON = { bronze: Star, silver: Star, gold: Crown } as const;

/** Loyalty points + owned gift cards — real records linked to the session customer. */
export function RewardsView() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { customer, status } = useSession();
  const { data: settings } = useLoyaltySettings();
  const { data: account, isPending: accountPending } = useLoyaltyAccount(customer?.id ?? "");
  const { data: txns = [] } = useLoyaltyTransactions(customer?.id);
  const { data: cards = [] } = useGiftCards();
  const loading = status === "loading" || accountPending;

  const tier = account?.tier ?? "bronze";
  const TierIcon = TIER_ICON[tier] ?? Star;
  const myCards = cards.filter((c) => c.customerId === customer?.id && c.status !== "deactivated");
  const tiers = settings?.tiers ?? [];
  const nextTier = tiers.filter((x) => x.minPoints > (account?.lifetimeEarned ?? 0)).sort((a, b) => a.minPoints - b.minPoints)[0];

  return (
    <div className="container max-w-3xl space-y-6 py-8">
      <GuestGate>
        <AccountNav />
        <h1 className="text-2xl font-bold">{t("rewards.title")}</h1>
        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : settings?.enabled ? (
          <>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-6">
                <span className="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-2xl">
                  <TierIcon className="size-7" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="num text-3xl font-bold">{formatNumber(account?.points ?? 0)}</p>
                  <p className="text-muted-foreground text-sm">{t("rewards.points")} · {t(`rewards.tier.${tier}`)}</p>
                  {nextTier ? <p className="text-muted-foreground num text-xs">{t("rewards.nextTier", { points: formatNumber(nextTier.minPoints - (account?.lifetimeEarned ?? 0)), tier: t(`rewards.tier.${nextTier.key}`) })}</p> : null}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("rewards.history")}</CardTitle>
              </CardHeader>
              <CardContent>
                {txns.length ? (
                  <ul className="divide-y">
                    {txns.slice(0, 10).map((x) => (
                      <li key={x.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{x.note ?? t(`rewards.txn.${x.type}`)}</span>
                          <span className="text-muted-foreground num block text-xs">{formatDate(x.at, locale)}</span>
                        </span>
                        <span className={x.points >= 0 ? "text-success num font-semibold" : "text-destructive num font-semibold"} dir="ltr">
                          {x.points >= 0 ? "+" : ""}
                          {formatNumber(x.points)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">{t("rewards.emptyHistory")}</p>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gift className="text-primary size-5" aria-hidden />
              {t("rewards.giftCards")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {myCards.length ? (
              <ul className="divide-y">
                {myCards.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="num font-mono font-semibold tracking-wider" dir="ltr">
                      {c.code}
                    </span>
                    <span className="num">{formatMoney(c.balance.amount, locale)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <MsgEmptyState
                emptyKey="search"
                params={{ query: t("rewards.giftCards") }}
                action={
                  <Button asChild variant="outline">
                    <Link href="/gift-cards">{t("giftCards.buy", { amount: "" })}</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      </GuestGate>
    </div>
  );
}
