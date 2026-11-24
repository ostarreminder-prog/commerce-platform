"use client";

import * as React from "react";
import { Check, CreditCard, Crown, Receipt } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBilling, useSaveBilling, useSetBillingAddon } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Progress } from "@repo/ui/components/progress";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { cn } from "@repo/ui/lib/cn";

/** Merchant plan ladder (halalas/mo) — the demo subscription tiers. */
const PLANS = [
  { id: "starter", price: 9900 },
  { id: "growth", price: 29900 },
  { id: "pro", price: 49900 },
] as const;

/** Plan & billing — plan, usage bars, addons, invoices, payment method (spec §5.24). */
export function BillingPanel() {
  const t = useTranslations("settings");
  const tp = useTranslations("plans");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data, isPending } = useBilling();
  const save = useSaveBilling();
  const setAddon = useSetBillingAddon();
  const [planOpen, setPlanOpen] = React.useState(false);
  const [cardOpen, setCardOpen] = React.useState(false);
  const [last4, setLast4] = React.useState("");

  if (isPending || !data) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      <Card className="from-primary/10 bg-gradient-to-br to-transparent">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
            <Crown className="size-6" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="text-muted-foreground text-xs">{t("billing.current")}</p>
            <p className="flex items-center gap-2 text-lg font-semibold">
              {tp(data.planId as "growth")}
              <Badge variant={data.status === "active" ? "success" : data.status === "trialing" ? "info" : "warning"}>{t(`billing.status.${data.status}`)}</Badge>
            </p>
            <p className="text-muted-foreground text-xs">{t("billing.renews", { date: formatDate(new Date(data.currentPeriodEnd), locale) })}</p>
          </div>
          <div className="text-end">
            <p className="num text-xl font-semibold">{formatMoney(data.monthlyPrice.amount, locale)}</p>
            <p className="text-muted-foreground text-xs">{t("billing.perMonth")}</p>
          </div>
          <Button onClick={() => setPlanOpen(true)}>{data.planId === "pro" ? t("billing.changePlan") : t("billing.upgrade")}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("billing.usage")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.usage.map((u) => (
            <div key={u.metric} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span>{t(`billing.metrics.${u.metric}` as never)}</span>
                <span className="num text-muted-foreground" dir="ltr">
                  {formatNumber(u.used)} / {formatNumber(u.limit)}
                </span>
              </div>
              <Progress value={(u.used / u.limit) * 100} aria-label={u.metric} />
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("billing.addons")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {data.addons.map((a) => (
                <li key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{a.name[locale] ?? a.name.ar}</span>
                    <span className="num text-muted-foreground text-xs">{formatMoney(a.price.amount, locale)}</span>
                  </span>
                  <Switch
                    checked={a.enabled}
                    disabled={setAddon.isPending}
                    aria-label={a.name[locale] ?? a.name.ar}
                    onCheckedChange={(enabled) => setAddon.mutate([a.id, enabled])}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("billing.paymentMethod")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.paymentMethod ? (
              <div className="flex items-center gap-3 rounded-lg border px-4 py-3">
                <CreditCard className="text-muted-foreground size-5" aria-hidden />
                <span className="flex-1 text-sm font-medium">{data.paymentMethod.brand}</span>
                <span className="num text-muted-foreground" dir="ltr">
                  •••• {data.paymentMethod.last4}
                </span>
              </div>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => setCardOpen(true)}>
              {t("billing.updatePayment")}
            </Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("billing.invoices")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y rounded-lg border">
            {data.invoices.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <Receipt className="text-muted-foreground size-4" aria-hidden />
                <span className="flex-1">{formatDate(new Date(inv.at), locale)}</span>
                <span className="num font-medium">{formatMoney(inv.amount.amount, locale)}</span>
                <Badge variant={inv.status === "paid" ? "success" : "warning"}>{t(`billing.invoiceStatus.${inv.status}`)}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("billing.changePlan")}</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {PLANS.map((p) => {
              const current = p.id === data.planId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={current || save.isPending}
                    onClick={() =>
                      save.mutate([{ planId: p.id, monthlyPrice: { amount: p.price, currency: "SAR" } }], {
                        onSuccess: () => {
                          mt.success("billing.planChanged", { plan: tp(p.id) });
                          setPlanOpen(false);
                        },
                        onError: () => mt.error("common.save.error"),
                      })
                    }
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-start transition-colors",
                      current ? "border-primary bg-primary/5" : "hover:bg-accent/50",
                    )}
                  >
                    <span className="text-sm font-medium">{tp(p.id)}</span>
                    <span className="flex items-center gap-2">
                      <span className="num text-muted-foreground text-sm">{formatMoney(p.price, locale)}</span>
                      {current ? <Check className="text-primary size-4" aria-hidden /> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-muted-foreground text-xs">{t("billing.changePlanHint")}</p>
        </DialogContent>
      </Dialog>
      <Dialog open={cardOpen} onOpenChange={setCardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("billing.updatePayment")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="card-last4">{t("billing.cardLast4")}</Label>
            <Input id="card-last4" dir="ltr" inputMode="numeric" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))} placeholder="1234" />
            <p className="text-muted-foreground text-xs">{t("billing.cardHint")}</p>
          </div>
          <DialogFooter>
            <Button
              disabled={!/^\d{4}$/.test(last4)}
              loading={save.isPending}
              onClick={() =>
                save.mutate([{ paymentMethod: { brand: "mada", last4 } }], {
                  onSuccess: () => {
                    mt.success("common.save.success");
                    setCardOpen(false);
                    setLast4("");
                  },
                  onError: () => mt.error("common.save.error"),
                })
              }
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
