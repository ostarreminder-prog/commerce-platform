"use client";

import { useTranslations } from "next-intl";
import { usePlatformAuditLogs } from "@repo/api-client";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatRelativeTime } from "@repo/ui/lib/format";

export function LogsView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const logs = usePlatformAuditLogs();
  const rows = logs.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("logs.title")} description={t("logs.description")} />
      {logs.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void logs.refetch()} />
      ) : logs.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("logs.time")}</TableHead>
                <TableHead>{t("logs.actor")}</TableHead>
                <TableHead>{t("logs.action")}</TableHead>
                <TableHead>{t("logs.target")}</TableHead>
                <TableHead>{t("logs.ip")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{formatRelativeTime(l.at, locale)}</TableCell>
                  <TableCell>
                    <span className="block font-medium">{l.actor.name}</span>
                    <span className="text-muted-foreground block text-xs">
                      {l.actor.type === "system" ? t("logs.system") : l.actor.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs" dir="ltr">
                      {l.action}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.target?.label ?? l.target?.id ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground num" dir="ltr">
                    {l.ip ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
