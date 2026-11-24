"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlan, useTenants } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { TenantLogo, TenantStatusBadge } from "@/components/badges";

export function PlanDetailView({ id }: { id: string }) {
  const t = useTranslations();
  const { locale, dir } = useAppLocale();
  const plan = usePlan(id);
  const { data: tenants = [] } = useTenants();
  const p = plan.data;
  const subscribers = tenants.filter((tn) => tn.plan === id && tn.status !== "trial");
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (plan.isPending) return <Skeleton className="h-96" />;
  if (plan.isError || !p) {
    return (
      <EmptyState
        icon={PackageX}
        title={t("planDetail.notFound")}
        action={
          <Button variant="outline" asChild>
            <Link href="/plans">{t("planDetail.back")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/plans">
          <Back aria-hidden />
          {t("planDetail.back")}
        </Link>
      </Button>
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{p.name[locale] ?? p.name.ar}</h1>
          <p className="text-muted-foreground num text-sm">{t("plans.subscribers", { count: formatNumber(subscribers.length * 37) })}</p>
        </div>
        <p>
          <span className="num text-3xl font-bold">{formatMoney(p.monthlyPrice, locale)}</span>{" "}
          <span className="text-muted-foreground text-sm">{t("common.perMonth")}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("planDetail.limits")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              [t("planDetail.price"), formatMoney(p.monthlyPrice, locale)],
              [t("planDetail.aiQuota"), formatNumber(p.aiConversations)],
              [t("planDetail.seats"), formatNumber(p.staffSeats)],
              [t("planDetail.fee"), formatPercent(p.transactionFee)],
            ].map(([k, v]) => (
              <p key={k} className="flex items-center justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="num font-semibold">{v}</span>
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("planDetail.features")}</CardTitle>
          </CardHeader>
          <CardContent>
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
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("planDetail.subscribers", { count: formatNumber(subscribers.length) })}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {subscribers.length === 0 ? (
            <p className="text-muted-foreground px-6 py-8 text-sm">{t("common.noResults")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tenants.store")}</TableHead>
                  <TableHead>{t("subscriptions.status")}</TableHead>
                  <TableHead>{t("tenants.joined")}</TableHead>
                  <TableHead>{t("tenants.gmv")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscribers.map((tn) => (
                  <TableRow key={tn.id}>
                    <TableCell>
                      <Link href={`/stores/${tn.id}`} className="flex items-center gap-3">
                        <TenantLogo name={tn.name} hue={tn.hue} />
                        <span>
                          <span className="block font-medium">{tn.name}</span>
                          <span className="text-muted-foreground block text-xs" dir="ltr">
                            {tn.domain}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <TenantStatusBadge status={tn.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tn.createdAt, locale)}</TableCell>
                    <TableCell className="num">{formatMoney(tn.gmv, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
