"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTenants } from "@repo/api-client";
import type { PlanId, TenantStatus } from "@repo/contracts";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { PlanBadge, TenantLogo, TenantStatusBadge } from "@/components/badges";
import { TenantSheet } from "./tenant-sheet";

const STATUSES: TenantStatus[] = ["active", "trial", "suspended"];
const PLANS: PlanId[] = ["starter", "growth", "pro"];

export function TenantsView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const { data, isPending, isError, refetch } = useTenants();
  const [status, setStatus] = React.useState<TenantStatus | "all">("all");
  const [plan, setPlan] = React.useState<PlanId | "all">("all");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<string | null>(null);
  const all = data ?? [];
  const q = query.trim().toLowerCase();
  const rows = all.filter(
    (tn) =>
      (status === "all" || tn.status === status) &&
      (plan === "all" || tn.plan === plan) &&
      (q === "" || tn.name.includes(q) || tn.domain.includes(q) || tn.ownerName.includes(q)),
  );
  const current = all.find((tn) => tn.id === selected) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader title={t("tenants.title")} description={t("tenants.description")} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Tabs value={status} onValueChange={(v) => setStatus(v as TenantStatus | "all")}>
          <TabsList>
            <TabsTrigger value="all">
              {t("common.all")} <span className="num text-muted-foreground ms-1 text-xs">{formatNumber(all.length)}</span>
            </TabsTrigger>
            {STATUSES.map((s) => (
              <TabsTrigger key={s} value={s}>
                {t(`status.${s}`)} <span className="num text-muted-foreground ms-1 text-xs">{formatNumber(all.filter((x) => x.status === s).length)}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("tenants.search")} aria-label={t("tenants.search")} className="ps-9" />
          </div>
          <Select value={plan} onValueChange={(v) => setPlan(v as PlanId | "all")}>
            <SelectTrigger className="w-36" aria-label={t("tenants.planFilter")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p}>
                  {t(`plan.${p}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState icon={Search} title={t("common.noResults")} />
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("tenants.store")}</TableHead>
                  <TableHead>{t("tenants.owner")}</TableHead>
                  <TableHead>{t("tenants.planFilter")}</TableHead>
                  <TableHead>{t("tenants.orders")}</TableHead>
                  <TableHead>{t("tenants.gmv")}</TableHead>
                  <TableHead>{t("tenants.joined")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((tn) => (
                  <TableRow key={tn.id} className="cursor-pointer" onClick={() => setSelected(tn.id)}>
                    <TableCell>
                      <button type="button" className="flex items-center gap-3 text-start" onClick={() => setSelected(tn.id)}>
                        <TenantLogo name={tn.name} hue={tn.hue} />
                        <span>
                          <span className="block font-medium">{tn.name}</span>
                          <span className="text-muted-foreground block text-xs" dir="ltr">
                            {tn.domain}
                          </span>
                        </span>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="block">{tn.ownerName}</span>
                      <span className="text-muted-foreground block text-xs">{tn.city}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <PlanBadge plan={tn.plan} />
                        <TenantStatusBadge status={tn.status} />
                      </div>
                    </TableCell>
                    <TableCell className="num">{formatNumber(tn.orders)}</TableCell>
                    <TableCell className="num">{formatMoney(tn.gmv, locale)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(tn.createdAt, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <ul className="space-y-3 md:hidden">
            {rows.map((tn) => (
              <li key={tn.id}>
                <button type="button" onClick={() => setSelected(tn.id)} className="hover:bg-muted/40 flex w-full items-center gap-3 rounded-xl border p-4 text-start">
                  <TenantLogo name={tn.name} hue={tn.hue} />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{tn.name}</span>
                    <span className="text-muted-foreground num block text-xs">{formatMoney(tn.gmv, locale)}</span>
                  </span>
                  <span className="flex flex-col items-end gap-1">
                    <PlanBadge plan={tn.plan} />
                    <TenantStatusBadge status={tn.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <TenantSheet tenant={current} onClose={() => setSelected(null)} />
    </div>
  );
}
