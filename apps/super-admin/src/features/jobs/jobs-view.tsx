"use client";

import { useTranslations } from "next-intl";
import { usePlatformJobs } from "@repo/api-client";
import type { JobStatus } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";

const VARIANT: Record<JobStatus, "success" | "info" | "destructive" | "secondary"> = {
  success: "success",
  running: "info",
  failed: "destructive",
  queued: "secondary",
};

function formatDuration(ms: number): string {
  return ms < 1000 ? `${formatNumber(ms)}ms` : `${formatNumber(Math.round(ms / 100) / 10)}s`;
}

export function JobsView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const jobs = usePlatformJobs();
  const rows = jobs.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("jobs.title")} description={t("jobs.description")} />
      {jobs.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void jobs.refetch()} />
      ) : jobs.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("jobs.job")}</TableHead>
                <TableHead>{t("jobs.status")}</TableHead>
                <TableHead>{t("jobs.lastRun")}</TableHead>
                <TableHead>{t("jobs.duration")}</TableHead>
                <TableHead>{t("jobs.failures")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((j) => (
                <TableRow key={j.id}>
                  <TableCell>
                    <code className="bg-muted rounded px-2 py-0.5 font-mono text-xs" dir="ltr">
                      {j.name}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={VARIANT[j.status]}>{t(`jobStatus.${j.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {j.status === "queued" ? t("jobs.queuedNote") : formatRelativeTime(j.lastRunAt, locale)}
                  </TableCell>
                  <TableCell className="num" dir="ltr">
                    {formatDuration(j.durationMs)}
                  </TableCell>
                  <TableCell className="num">{j.failures === 0 ? "—" : formatNumber(j.failures)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
