"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Copy, Gift, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCheckGiftCardBalance, useIssueGiftCard } from "@repo/api-client";
import type { GiftCard } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { useSession } from "@/components/session-context";

const AMOUNTS = [10_000, 20_000, 30_000, 50_000] as const;

/** Public gift-card purchase — issues a real card row; the payment step is a
 * labeled simulation (no real gateway) so the shopper sees the card instantly. */
export function GiftCardsView() {
  const t = useTranslations("store");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { effective } = useSession();
  const issue = useIssueGiftCard();
  const [amount, setAmount] = React.useState<number>(20_000);
  const [custom, setCustom] = React.useState("");
  const [recipient, setRecipient] = React.useState("");
  const [recipientPhone, setRecipientPhone] = React.useState("");
  const [done, setDone] = React.useState<GiftCard | null>(null);

  const chosen = custom ? Math.round(Number(custom) * 100) : amount;
  const valid = chosen >= 1_000;

  const buy = () =>
    issue.mutate([{ initialBalance: chosen, customerId: effective?.id ?? null, expiresAt: null }], {
      onSuccess: setDone,
      onError: () => mt.error("common.server.error"),
    });

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyLink"));
    }
  };

  if (done)
    return (
      <div className="container max-w-lg py-16 text-center">
        <CheckCircle2 className="text-success mx-auto size-16" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{t("giftCards.doneTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("giftCards.doneText", { name: recipient || t("giftCards.recipientFallback") })}</p>
        <div className="bg-primary/5 border-primary/30 mx-auto mt-6 max-w-xs rounded-2xl border border-dashed p-6">
          <Gift className="text-primary mx-auto size-8" aria-hidden />
          <p className="num mt-2 text-3xl font-bold">{formatMoney(done.initialBalance.amount, locale)}</p>
          <button
            type="button"
            onClick={() => copyCode(done.code)}
            className="num bg-background hover:bg-accent mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-mono text-lg font-semibold tracking-widest"
          >
            {done.code}
            <Copy className="size-4" aria-hidden />
          </button>
        </div>
        {recipientPhone ? (
          <Button variant="outline" className="mt-4" asChild>
            <a
              href={`https://wa.me/${recipientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(t("giftCards.waMessage", { code: done.code, amount: formatMoney(done.initialBalance.amount, locale) }))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("giftCards.sendWhatsapp")}
            </a>
          </Button>
        ) : null}
        <p className="text-muted-foreground mt-4 text-xs">{t("giftCards.simulationNote")}</p>
        <Button variant="outline" className="mt-4" onClick={() => setDone(null)}>
          {t("giftCards.buyAnother")}
        </Button>
      </div>
    );

  return (
    <div className="container max-w-3xl space-y-8 py-8">
      <Breadcrumbs items={[{ label: t("giftCards.title") }]} />
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
          <Gift className="text-primary size-7" aria-hidden />
          {t("giftCards.title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("giftCards.subtitle")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("giftCards.amount")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={custom ? "custom" : String(amount)}
            onValueChange={(v) => (v === "custom" ? setCustom("300") : (setAmount(Number(v)), setCustom("")))}
            className="grid grid-cols-2 gap-3 sm:grid-cols-5"
          >
            {AMOUNTS.map((a) => (
              <label key={a} className={cn("num flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold transition-colors", !custom && amount === a && "border-primary bg-primary/5")}>
                <RadioGroupItem value={String(a)} className="sr-only" />
                {formatMoney(a, locale)}
              </label>
            ))}
            <label className={cn("flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold", custom && "border-primary bg-primary/5")}>
              <RadioGroupItem value="custom" className="sr-only" />
              {t("giftCards.custom")}
            </label>
          </RadioGroup>
          {custom ? (
            <div className="space-y-1.5">
              <Label htmlFor="gc-custom">{t("giftCards.customAmount")}</Label>
              <Input id="gc-custom" dir="ltr" inputMode="numeric" className="num max-w-40" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 6))} />
              {custom && !valid ? <p className="text-destructive text-xs" role="alert">{t("giftCards.minAmount", { amount: formatMoney(1_000, locale) })}</p> : null}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="gc-name">{t("giftCards.recipientName")}</Label>
              <Input id="gc-name" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gc-phone">{t("giftCards.recipientPhone")}</Label>
              <Input id="gc-phone" dir="ltr" inputMode="tel" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} placeholder="05XXXXXXXX" />
            </div>
          </div>
          <Button size="lg" className="w-full" loading={issue.isPending} disabled={!valid} onClick={buy}>
            {t("giftCards.buy", { amount: formatMoney(chosen, locale) })}
          </Button>
          <p className="text-muted-foreground text-center text-xs">{t("giftCards.simulationNote")}</p>
        </CardContent>
      </Card>
      <BalanceChecker />
    </div>
  );
}

/** "Have a card? check its balance" — real checkBalance endpoint. */
function BalanceChecker() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const check = useCheckGiftCardBalance();
  const [code, setCode] = React.useState("");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="text-primary size-5" aria-hidden />
          {t("giftCards.checkTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input id="gc-check" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("giftCards.codePlaceholder")} aria-label={t("giftCards.codePlaceholder")} dir="ltr" className="uppercase" />
          <Button variant="outline" loading={check.isPending} disabled={!code.trim()} onClick={() => check.mutate(code.trim())}>
            {t("giftCards.check")}
          </Button>
        </div>
        {check.data ? (
          <p className="text-sm">
            {check.data.status === "deactivated" || check.data.status === "expired" ? (
              <span className="text-destructive">{t(`giftCards.status.${check.data.status}`)}</span>
            ) : (
              <span>
                {t("giftCards.balance", { amount: formatMoney(check.data.balance, locale) })}
                {check.data.status === "redeemed" ? ` · ${t("giftCards.status.redeemed")}` : ""}
              </span>
            )}
          </p>
        ) : null}
        {check.isError ? (
          <p className="text-destructive text-sm" role="alert">
            {t("giftCards.status.notFound")}
          </p>
        ) : null}
        <p className="text-muted-foreground text-xs">
          {t("giftCards.checkHint")}{" "}
          <Link href="/checkout" className="text-primary hover:underline">
            {t("checkout")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
