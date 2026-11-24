"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePlatformUsage, useTenants } from "@repo/api-client";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Progress } from "@repo/ui/components/progress";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { formatNumber } from "@repo/ui/lib/format";
import { TenantLogo } from "@/components/badges";

export function UsageView() {
  const t = useTranslations();
  const usage = usePlatformUsage();
  const { data: tenants = [] } = useTenants();
  const byTenant = React.useMemo(() => new Map(tenants.map((tn) => [tn.id, tn])), [tenants]);
  const rows = React.useMemo(
    () => [...(usage.data ?? [])].sort((a, b) => b.aiTokens - a.aiTokens),
    [usage.data],
  );
  const maxTokens = rows.reduce((m, r) => Math.max(m, r.aiTokens), 1);
  const totalTokens = rows.reduce((s, r) => s + r.aiTokens, 0) || 1;

  return (
    <div className="space-y-6">
      <PageHeader title={t("usage.title")} description={t("usage.description")} />
      {usage.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void usage.refetch()} />
      ) : usage.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("usage.store")}</TableHead>
                <TableHead className="w-48">{t("usage.share")}</TableHead>
                <TableHead>{t("usage.messages")}</TableHead>
                <TableHead>{t("usage.tokens")}</TableHead>
                <TableHead>{t("usage.apiCalls")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const tn = byTenant.get(r.tenantId);
                return (
                  <TableRow key={r.tenantId}>
                    <TableCell>
                      <Link href={`/stores/${r.tenantId}`} className="flex items-center gap-3">
                        {tn ? <TenantLogo name={tn.name} hue={tn.hue} /> : null}
                        <span>
                          <span className="block font-medium">{tn?.name ?? r.tenantId}</span>
                          <span className="text-muted-foreground block text-xs" dir="ltr">
                            {tn?.domain}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.round((r.aiTokens / maxTokens) * 100)} className="h-2" />
                        <span className="num text-muted-foreground w-10 shrink-0 text-xs">
                          {formatNumber(Math.round((r.aiTokens / totalTokens) * 100))}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="num">{formatNumber(r.aiMessages)}</TableCell>
                    <TableCell className="num">{formatNumber(r.aiTokens, { notation: "compact" })}</TableCell>
                    <TableCell className="num">{formatNumber(r.apiCalls, { notation: "compact" })}</TableCell>
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
