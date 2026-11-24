"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlans, useSavePlan } from "@repo/api-client";
import type { Plan } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";

function EditPlanDialog({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const save = useSavePlan();
  const [price, setPrice] = React.useState("");
  const [quota, setQuota] = React.useState("");
  React.useEffect(() => {
    if (plan) {
      setPrice(String(plan.monthlyPrice / 100));
      setQuota(String(plan.aiConversations));
    }
  }, [plan]);
  const valid = Number(price) > 0 && Number.isInteger(Number(quota)) && Number(quota) > 0;
  return (
    <Dialog open={Boolean(plan)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t("plans.edit")}: {plan?.name[locale]}
          </DialogTitle>
        </DialogHeader>
        <form
          id="plan-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!plan || !valid) return;
            save.mutate(
              { ...plan, monthlyPrice: Math.round(Number(price) * 100), aiConversations: Number(quota) },
              { onSuccess: () => { toast.success(t("common.saved")); onClose(); } },
            );
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="price">{t("plans.price")}</Label>
            <Input id="price" type="number" min={1} step="0.01" dir="ltr" className="num" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quota">{t("plans.quota")}</Label>
            <Input id="quota" type="number" min={1} dir="ltr" className="num" value={quota} onChange={(e) => setQuota(e.target.value)} />
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" form="plan-form" disabled={!valid} loading={save.isPending}>
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PlansView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const { data, isPending, isError, refetch } = usePlans();
  const [editing, setEditing] = React.useState<Plan | null>(null);
  const top = data?.reduce<Plan | null>((m, p) => (!m || p.tenants > m.tenants ? p : m), null);

  return (
    <div className="space-y-6">
      <PageHeader title={t("plans.title")} description={t("plans.description")} />
      {isError ? <ErrorState title={t("common.error")} onRetry={() => void refetch()} /> : null}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {isPending
          ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-96" />)
          : data?.map((p) => (
              <Card key={p.id} className={cn("relative flex flex-col", top?.id === p.id && "border-primary shadow-md")}>
                {top?.id === p.id ? <Badge className="absolute -top-3 start-6 border-transparent bg-primary text-primary-foreground">{t("plans.popular")}</Badge> : null}
                <CardContent className="flex flex-1 flex-col gap-5 p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">
                        <Link href={`/plans/${p.id}`} className="hover:underline">
                          {p.name[locale] ?? p.name.ar}
                        </Link>
                      </h2>
                      <p className="text-muted-foreground num text-sm">{t("plans.subscribers", { count: formatNumber(p.tenants * 37) })}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" aria-label={`${t("plans.edit")}: ${p.name[locale] ?? p.name.ar}`} onClick={() => setEditing(p)}>
                      <Pencil aria-hidden />
                    </Button>
                  </div>
                  <p>
                    <span className="num text-3xl font-bold">{formatMoney(p.monthlyPrice, locale)}</span>{" "}
                    <span className="text-muted-foreground text-sm">{t("common.perMonth")}</span>
                  </p>
                  <ul className="bg-muted/40 space-y-1.5 rounded-lg p-3 text-sm">
                    <li className="num">{t("plans.aiQuota", { count: formatNumber(p.aiConversations) })}</li>
                    <li className="num">{t("plans.seats", { count: formatNumber(p.staffSeats) })}</li>
                    <li className="num">{t("plans.fee", { value: formatPercent(p.transactionFee) })}</li>
                  </ul>
                  <ul className="space-y-2 text-sm">
                    {p.features.map((f) => (
                      <li key={f.en} className="flex items-start gap-2">
                        <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
                        {f[locale]}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
      </div>
      <EditPlanDialog plan={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
