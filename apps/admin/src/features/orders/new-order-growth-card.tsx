"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCheckGiftCardBalance, useLocations, useLoyaltyAccount, useLoyaltySettings } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";

export interface GrowthFields {
  locationId: string;
  affiliateCode: string;
  giftCardCode: string;
  loyaltyPoints: string;
}

/** Fulfilment + growth extras for manual orders: source warehouse, referral
 * attribution, gift-card part-payment and loyalty redemption. */
export function NewOrderGrowthCard({ customerId, fields, set }: {
  customerId: string | null;
  fields: GrowthFields;
  set: (patch: Partial<GrowthFields>) => void;
}) {
  const t = useTranslations("sales.newOrder");
  const { locale } = useAppLocale();
  const locations = useLocations();
  const account = useLoyaltyAccount(customerId ?? "");
  const settings = useLoyaltySettings();
  const check = useCheckGiftCardBalance();
  const [cardInfo, setCardInfo] = React.useState<{ balance: number; status: string } | null>(null);

  const redeemable = settings.data?.enabled && account.data ? Math.min(account.data.points, Math.floor((Number(fields.loyaltyPoints) || 0))) : 0;
  const pointsValue = account.data && settings.data ? Math.floor(redeemable * settings.data.redeemRate * 100) : 0;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("growthTitle")}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="no-location">{t("location")}</Label>
          <Select value={fields.locationId} onValueChange={(v) => set({ locationId: v })}>
            <SelectTrigger id="no-location"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(locations.data ?? []).filter((l) => l.status === "active").map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <p className="text-muted-foreground text-xs">{t("locationHint")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="no-affiliate">{t("affiliateCode")}</Label>
          <Input id="no-affiliate" dir="ltr" className="font-mono uppercase" value={fields.affiliateCode} onChange={(e) => set({ affiliateCode: e.target.value.toUpperCase() })} placeholder={t("affiliateHint")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="no-giftcard">{t("giftCard")}</Label>
          <div className="flex gap-2">
            <Input id="no-giftcard" dir="ltr" className="font-mono uppercase" value={fields.giftCardCode} onChange={(e) => { set({ giftCardCode: e.target.value.toUpperCase() }); setCardInfo(null); }} />
            <Button
              type="button"
              variant="outline"
              disabled={!fields.giftCardCode.trim() || check.isPending}
              onClick={() => check.mutate(fields.giftCardCode.trim(), {
                onSuccess: (c) => setCardInfo({ balance: c.balance, status: c.status }),
                onError: () => setCardInfo({ balance: 0, status: "unknown" }),
              })}
            >
              {t("checkBalance")}
            </Button>
          </div>
          {cardInfo ? (
            <p className="text-xs">
              {cardInfo.status === "active" || cardInfo.status === "partially_used" ? (
                <Badge variant="success">{t("cardBalance", { amount: formatMoney(cardInfo.balance, locale) })}</Badge>
              ) : <Badge variant="destructive">{t(`cardInvalid`)}</Badge>}
            </p>
          ) : <p className="text-muted-foreground text-xs">{t("giftCardHint")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="no-points">{t("loyaltyPoints")}</Label>
          <Input
            id="no-points"
            dir="ltr"
            className="num"
            inputMode="numeric"
            value={fields.loyaltyPoints}
            onChange={(e) => set({ loyaltyPoints: e.target.value })}
            disabled={!customerId || !settings.data?.enabled}
          />
          <p className="text-muted-foreground text-xs">
            {account.data ? t("loyaltyHint", { points: formatNumber(account.data.points), amount: formatMoney(pointsValue, locale) }) : t("loyaltyNone")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
