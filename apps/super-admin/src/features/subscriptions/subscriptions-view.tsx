"use client";

import * as React from "react";
import Link from "next/link";
import { CircleDollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePlatformSubscriptions, useTenants } from "@repo/api-client";
import type { StoreSubscription, SubscriptionStatus } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatCard } from "@repo/ui/components/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { PlanBadge, TenantLogo } from "@/components/badges";

const STATUS_VARIANT: Record<SubscriptionStatus, "info" | "success" | "warning" | "secondary"> = {
  trialing: "info",
  active: "success",
  past_due: "warning",
  cancelled: "secondary",
};
const STATUSES: SubscriptionStatus[] = ["trialing", "active", "past_due", "cancelled"];

function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  const t = useTranslations("subStatus");
  return <Badge variant={STATUS_VARIANT[status]}>{t(status)}</Badge>;
}

export function SubscriptionsView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const subs = usePlatformSubscriptions();
  const { data: tenants = [] } = useTenants();
  const [status, setStatus] = React.useState<SubscriptionStatus | "all">("all");
  const byTenant = React.useMemo(() => new Map(tenants.map((tn) => [tn.id, tn])), [tenants]);
  const all = subs.data ?? [];
  const rows = all.filter((s) => status === "all" || s.status === status);
  const totalMrr = all.reduce((sum, s) => sum + s.mrr, 0);
  const tenantOf = (s: StoreSubscription) => byTenant.get(s.tenantId);

  return (
    <div className="space-y-6">
      <PageHeader title={t("subscriptions.title")} description={t("subscriptions.description")} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("subscriptions.totalMrr")} value={formatMoney(totalMrr, locale)} icon={CircleDollarSign} />
      </div>
      <Tabs value={status} onValueChange={(v) => setStatus(v as SubscriptionStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">
            {t("common.all")} <span className="num text-muted-foreground ms-1 text-xs">{formatNumber(all.length)}</span>
          </TabsTrigger>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {t(`subStatus.${s}`)}{" "}
              <span className="num text-muted-foreground ms-1 text-xs">{formatNumber(all.filter((x) => x.status === s).length)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      {subs.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void subs.refetch()} />
      ) : subs.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("subscriptions.store")}</TableHead>
                <TableHead>{t("subscriptions.plan")}</TableHead>
                <TableHead>{t("subscriptions.status")}</TableHead>
                <TableHead>{t("subscriptions.mrr")}</TableHead>
                <TableHead>{t("subscriptions.renews")}</TableHead>
                <TableHead>{t("subscriptions.started")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => {
                const tn = tenantOf(s);
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link href={`/stores/${s.tenantId}`} className="flex items-center gap-3">
                        {tn ? <TenantLogo name={tn.name} hue={tn.hue} /> : null}
                        <span>
                          <span className="block font-medium">{tn?.name ?? s.tenantId}</span>
                          <span className="text-muted-foreground block text-xs" dir="ltr">
                            {tn?.domain}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PlanBadge plan={s.plan} />
                    </TableCell>
                    <TableCell>
                      <SubscriptionBadge status={s.status} />
                    </TableCell>
                    <TableCell className="num">{s.mrr === 0 ? "—" : formatMoney(s.mrr, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(s.currentPeriodEnd, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(s.startedAt, locale)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
