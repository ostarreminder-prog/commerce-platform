"use client";

import * as React from "react";
import { Check, Gift, Lock, TicketPercent, Users, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { FREE_SHIPPING_FROM } from "@/components/cart-context";
import { Choice } from "./checkout-choice";
import { COD_FEE, PAYMENTS, SHIPPING, STEPS, type PaymentMethod, type ShippingId, type Step } from "./checkout-constants";

export function StepsBar({ step }: { step: Step }) {
  const t = useTranslations("store");
  const stepIndex = STEPS.indexOf(step);
  return (
    <ol className="flex items-center gap-2 text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span
            className={cn(
              "num flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              i < stepIndex ? "bg-primary text-primary-foreground" : i === stepIndex ? "border-primary text-primary border-2" : "bg-muted text-muted-foreground",
            )}
          >
            {i < stepIndex ? <Check className="size-4" aria-hidden /> : formatNumber(i + 1)}
          </span>
          <span className={cn("hidden sm:inline", i === stepIndex ? "font-medium" : "text-muted-foreground")}>{t(`steps.${s}`)}</span>
          {i < STEPS.length - 1 ? <span className={cn("h-px flex-1", i < stepIndex ? "bg-primary" : "bg-border")} /> : null}
        </li>
      ))}
    </ol>
  );
}

export function ShippingStep({
  shippingId,
  onSelect,
  subtotal,
  discount,
  freeShipCoupon,
  onBack,
  onNext,
}: {
  shippingId: ShippingId;
  onSelect: (id: ShippingId) => void;
  subtotal: number;
  discount: number;
  freeShipCoupon: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  return (
    <section className="space-y-4">
      <h2 className="font-semibold">{t("shippingMethod")}</h2>
      <div className="space-y-3" role="radiogroup" aria-label={t("shippingMethod")}>
        {SHIPPING.map((s) => (
          <Choice
            key={s.id}
            checked={shippingId === s.id}
            onSelect={() => onSelect(s.id)}
            title={t(`methods.${s.id}`)}
            hint={t(`methodsText.${s.id}`)}
            price={s.fee === 0 || freeShipCoupon || (s.id === "standard" && subtotal - discount >= FREE_SHIPPING_FROM) ? t("free") : formatMoney(s.fee, locale)}
          />
        ))}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          {t("back")}
        </Button>
        <Button size="lg" onClick={onNext}>
          {t("next")}
        </Button>
      </div>
    </section>
  );
}

/** Gift card / affiliate / loyalty extras shown under the payment methods. */
export interface PaymentExtras {
  gift: { code: string; balance: number } | null;
  giftInput: string;
  onGiftInput: (v: string) => void;
  onGiftApply: () => void;
  onGiftRemove: () => void;
  giftFail: string | null;
  giftPending: boolean;
  affiliate: string | null;
  affiliateInput: string;
  onAffiliateInput: (v: string) => void;
  onAffiliateApply: () => void;
  onAffiliateRemove: () => void;
  affiliateFail: string | null;
  loyalty: { balance: number; usePoints: boolean; pointsToUse: number; pointsValue: number; onToggle: (v: boolean) => void } | null;
}

export function PaymentStep({
  payment,
  onSelect,
  card,
  onCardChange,
  cardError,
  placing,
  total,
  payable,
  extras,
  onBack,
  onPlace,
}: {
  payment: PaymentMethod;
  onSelect: (payment: PaymentMethod) => void;
  card: string;
  onCardChange: (value: string) => void;
  cardError: string | null;
  placing: boolean;
  total: number;
  payable: number;
  extras: PaymentExtras;
  onBack: () => void;
  onPlace: () => void;
}) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  return (
    <section className="space-y-4">
      <h2 className="font-semibold">{t("paymentMethod")}</h2>
      <div className="space-y-3" role="radiogroup" aria-label={t("paymentMethod")}>
        {PAYMENTS.map((p) => (
          <Choice
            key={p}
            checked={payment === p}
            onSelect={() => onSelect(p)}
            title={t(`payments.${p}`)}
            hint={p === "cod" ? t("codFee", { amount: formatMoney(COD_FEE, locale) }) : p === "tabby" ? t("tabby", { amount: formatMoney(Math.round(payable / 4), locale) }) : undefined}
          />
        ))}
      </div>
      {payment === "mada" ? (
        <div className="bg-muted/40 grid gap-4 rounded-lg border p-4 sm:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="card">{t("cardNumber")}</Label>
            <Input
              id="card"
              dir="ltr"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              className="num"
              value={card}
              aria-invalid={Boolean(cardError)}
              onChange={(e) => onCardChange(e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 "))}
            />
            {cardError ? (
              <p className="text-destructive text-xs" role="alert">
                {cardError}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="exp">{t("expiry")}</Label>
            <Input id="exp" dir="ltr" placeholder="MM/YY" className="num" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cvv">{t("cvv")}</Label>
            <Input id="cvv" dir="ltr" placeholder="123" inputMode="numeric" className="num" />
          </div>
        </div>
      ) : null}
      <div className="space-y-3 rounded-lg border p-4">
        <p className="flex items-center gap-2 text-sm font-medium">
          <TicketPercent className="text-primary size-4" aria-hidden />
          {t("extras")}
        </p>
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={extras.giftInput}
              onChange={(e) => extras.onGiftInput(e.target.value)}
              placeholder={t("giftCard")}
              aria-label={t("giftCard")}
              dir="ltr"
              className="uppercase"
              disabled={Boolean(extras.gift)}
            />
            {extras.gift ? (
              <Button type="button" variant="outline" onClick={extras.onGiftRemove}>
                <X aria-hidden />
                {t("couponRemove")}
              </Button>
            ) : (
              <Button type="button" variant="outline" loading={extras.giftPending} onClick={extras.onGiftApply} disabled={!extras.giftInput.trim()}>
                {t("apply")}
              </Button>
            )}
          </div>
          {extras.gift ? (
            <p className="text-success flex items-center gap-1.5 text-xs">
              <Gift className="size-3.5" aria-hidden />
              {t("giftCardApplied", { amount: formatMoney(Math.min(extras.gift.balance, total), locale) })}
            </p>
          ) : null}
          {extras.giftFail ? (
            <p className="text-destructive text-xs" role="alert">
              {extras.giftFail}
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Input
              value={extras.affiliateInput}
              onChange={(e) => extras.onAffiliateInput(e.target.value)}
              placeholder={t("affiliate")}
              aria-label={t("affiliate")}
              dir="ltr"
              className="uppercase"
              disabled={Boolean(extras.affiliate)}
            />
            {extras.affiliate ? (
              <Button type="button" variant="outline" onClick={extras.onAffiliateRemove}>
                <X aria-hidden />
                {t("couponRemove")}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={extras.onAffiliateApply} disabled={!extras.affiliateInput.trim()}>
                {t("apply")}
              </Button>
            )}
          </div>
          {extras.affiliate ? (
            <p className="text-success flex items-center gap-1.5 text-xs">
              <Users className="size-3.5" aria-hidden />
              {t("affiliateApplied", { code: extras.affiliate })}
            </p>
          ) : null}
          {extras.affiliateFail ? (
            <p className="text-destructive text-xs" role="alert">
              {extras.affiliateFail}
            </p>
          ) : null}
        </div>
        {extras.loyalty && extras.loyalty.balance > 0 ? (
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>
              {t("loyaltyUse")}
              <span className="text-muted-foreground num block text-xs">
                {t("loyaltyRedeem", { points: formatNumber(extras.loyalty.pointsToUse), amount: formatMoney(extras.loyalty.pointsValue, locale) })}
              </span>
            </span>
            <Switch checked={extras.loyalty.usePoints} onCheckedChange={extras.loyalty.onToggle} aria-label={t("loyaltyUse")} />
          </label>
        ) : null}
      </div>
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Lock className="size-3.5" aria-hidden />
        {t("secureNote")}
      </p>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          {t("back")}
        </Button>
        <Button size="lg" loading={placing} onClick={onPlace}>
          {t("placeOrder", { amount: formatMoney(payable, locale) })}
        </Button>
      </div>
    </section>
  );
}
