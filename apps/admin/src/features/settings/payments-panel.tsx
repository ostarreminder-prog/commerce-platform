"use client";

import * as React from "react";
import { Check, CreditCard, Landmark, ShieldCheck, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePaymentSettings, useSavePaymentSettings } from "@repo/api-client";
import type { PaymentSettings } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney } from "@repo/ui/lib/format";
import { cn } from "@repo/ui/lib/cn";
import Link from "@/components/store-link";
import { Field, SaveFooter } from "./settings-fields";

const METHOD_FEES: Record<string, string> = { mada: "1%", card: "2.2%", apple_pay: "1%", stc_pay: "1.5%", bank_transfer: "0%", payment_link: "0.5%", cod: "15 SAR" };
const KYC_STEPS = ["account", "documents", "review", "live"] as const;
const KYC_INDEX: Record<PaymentSettings["providerAccountStatus"], number> = { not_started: 0, pending_kyc: 2, active: 4, rejected: 2 };

function KycCard({ status }: { status: PaymentSettings["providerAccountStatus"] }) {
  const t = useTranslations("settings");
  const done = KYC_INDEX[status];
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{t("payments.kyc.title")}</CardTitle>
          <CardDescription>{t("payments.kyc.hint")}</CardDescription>
        </div>
        <Badge variant={status === "active" ? "success" : status === "rejected" ? "destructive" : "warning"}>{t(`payments.kyc.status.${status}`)}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <ol className="flex items-center gap-2">
          {KYC_STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  i < done ? "bg-success/15 text-success" : i === done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {i < done ? <Check className="size-4" aria-hidden /> : i + 1}
              </span>
              <span className={cn("text-xs", i <= done ? "font-medium" : "text-muted-foreground")}>{t(`payments.kyc.steps.${s}`)}</span>
            </li>
          ))}
        </ol>
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings/verification">
            <ShieldCheck aria-hidden />
            {t("payments.kyc.viewStatus")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

/** Payments — methods + KYC status + COD/bank transfer + settlement (spec §4.20). */
export function PaymentsPanel() {
  const t = useTranslations("settings");
  const tpm = useTranslations("paymentMethodName");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data, isPending } = usePaymentSettings();
  const save = useSavePaymentSettings();
  const [methods, setMethods] = React.useState<PaymentSettings["methods"] | null>(null);
  const list = methods ?? data?.methods ?? [];
  const setMethod = (id: string, on: boolean) =>
    setMethods((all) => (all ?? data?.methods ?? []).map((x) => (x.method === id ? { ...x, enabled: on } : x)) as PaymentSettings["methods"]);
  if (isPending || !data) return <Skeleton className="h-96 w-full" />;
  const persist = () =>
    save.mutate([{ methods: list, cod: data.cod, bankTransfer: data.bankTransfer }], {
      onSuccess: () => {
        setMethods(null);
        mt.success("common.save.success");
      },
    });
  return (
    <div className="space-y-4">
      <KycCard status={data.providerAccountStatus} />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("payments.methods")}</CardTitle>
          <CardDescription>{t("payments.hint")}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y rounded-lg border">
            {list.map((m) => (
              <li key={m.method} className="flex items-center gap-3 px-4 py-3">
                <span className="bg-muted flex size-9 items-center justify-center rounded-md">
                  <CreditCard className="text-muted-foreground size-4" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{tpm(m.method)}</span>
                  <span className="text-muted-foreground block text-xs">{t("payments.fee", { fee: METHOD_FEES[m.method] ?? "—" })}</span>
                </span>
                <Switch checked={m.enabled} aria-label={tpm(m.method)} onCheckedChange={(on) => setMethod(m.method, on)} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" aria-hidden /> {t("payments.cod.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="cod-fee" label={t("payments.cod.fee")} defaultValue={String(data.cod.fee.amount / 100)} dir="ltr" className="num text-start" />
              <Field id="cod-max" label={t("payments.cod.maxOrder")} defaultValue={String(data.cod.maxOrder.amount / 100)} dir="ltr" className="num text-start" />
            </div>
            <p className="text-muted-foreground text-xs">{t("payments.cod.cities", { cities: data.cod.cities.join("، ") })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4" aria-hidden /> {t("payments.bank.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="bank-iban" label={t("payments.bank.iban")} defaultValue={data.bankTransfer.iban} dir="ltr" className="num text-start" />
              <Field id="bank-name" label={t("payments.bank.bankName")} defaultValue={data.bankTransfer.bankName} />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("payments.settlement.title")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {[
            [t("payments.settlement.pending"), formatMoney(data.settlement.pending.amount, locale)],
            [t("payments.settlement.lastPayout"), formatMoney(data.settlement.lastPayout.amount, locale)],
            [t("payments.settlement.next"), formatDate(new Date(data.settlement.nextPayoutAt), locale)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border p-3">
              <p className="text-muted-foreground text-xs">{label}</p>
              <p className="num mt-1 font-semibold">{value}</p>
            </div>
          ))}
        </CardContent>
        <SaveFooter pending={save.isPending} onSave={persist} />
      </Card>
    </div>
  );
}
