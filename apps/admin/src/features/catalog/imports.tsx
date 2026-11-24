"use client";

import * as React from "react";
import { Download, Import as ImportIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { NOW, useImportList } from "@repo/api-client";
import type { ImportJob } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { Actor } from "@/components/entity/actor";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { ImportWizard } from "@/features/catalog/import-wizard";

export { ImportDetail } from "@/features/catalog/import-detail";

export function ImportsView() {
  const t = useTranslations("catalog.imports");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("products.manage");
  const jobs = useImportList();

  const columns = React.useMemo<ColumnDef<ImportJob, unknown>[]>(() => [
    { id: "type", header: t("cols.type"), cell: ({ row }) => t(`types.${row.original.type}`) },
    { id: "file", header: t("cols.file"), cell: ({ row }) => <bdi dir="ltr" className="text-sm">{row.original.fileName}</bdi> },
    { id: "source", header: t("cols.source"), cell: ({ row }) => t(`sources.${row.original.source}`) },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="import" value={row.original.status} /> },
    {
      id: "rows",
      header: t("cols.rows"),
      cell: ({ row }) => (
        <span className="num whitespace-nowrap text-sm">
          <span className="text-success">{formatNumber(row.original.rowsSucceeded)}</span>
          {" / "}
          <span className={row.original.rowsFailed ? "text-destructive" : "text-muted-foreground"}>{formatNumber(row.original.rowsFailed)}</span>
        </span>
      ),
    },
    {
      id: "errors",
      header: t("cols.errorFile"),
      cell: ({ row }) => row.original.errorFileUrl ? <a href={row.original.errorFileUrl} onClick={(e) => e.stopPropagation()} className="text-primary inline-flex items-center gap-1 text-sm hover:underline"><Download className="size-3.5" />{t("download")}</a> : <span className="text-muted-foreground">—</span>,
    },
    { id: "actor", header: t("cols.actor"), cell: ({ row }) => <Actor actor={row.original.actor} /> },
    { id: "at", accessorKey: "at", header: t("cols.date"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap" title={formatDateTime(row.original.at, locale)}>{formatRelativeTime(row.original.at, locale, NOW)}</span> },
  ], [t, locale]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      {canManage ? <ImportWizard /> : null}

      <Card>
        <CardHeader><CardTitle className="text-base">{t("history")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataState
            state={jobs}
            loading={<TableSkeleton rows={4} columns={8} />}
            isEmpty={(d) => d.length === 0}
            empty={<EmptyState icon={ImportIcon} title={t("noneTitle")} description={t("noneDescription")} />}
          >
            {(data) => <DataTable columns={columns} data={data} getRowId={(j) => j.id} pageSize={10} onRowClick={(j) => router.push(`/imports/${j.id}`)} />}
          </DataState>
        </CardContent>
      </Card>
    </div>
  );
}
