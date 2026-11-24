"use client";

import { Download, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useCreateImport, useImportById } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime, formatNumber } from "@repo/ui/lib/format";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { Actor } from "@/components/entity/actor";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { StatusBadge } from "@repo/ui/components/status-badge";
import Link from "@/components/store-link";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";

export function ImportDetail() {
  const t = useTranslations("catalog.imports.detail");
  const tList = useTranslations("catalog.imports");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("products.manage");
  const mt = useMsgToast();
  const rerun = useCreateImport();
  const params = useParams<{ id: string }>();
  const job = useImportById(params.id);

  if (job.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  if (job.isError || !job.data) {
    return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push("/imports")}>{t("backToList")}</Button>} /></Card>;
  }
  const j = job.data;
  const total = j.rowsSucceeded + j.rowsFailed;
  const progress = j.status === "processing" ? 35 : 100;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: tList("title"), href: recallListUrl("/imports") }, { label: j.fileName }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="num text-xl font-semibold" dir="ltr">{j.fileName}</h1>
        <StatusBadge entity="import" value={j.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {([
          ["type", tList(`types.${j.type}`)],
          ["source", tList(`sources.${j.source}`)],
          ["succeeded", formatNumber(j.rowsSucceeded)],
          ["failedRows", formatNumber(j.rowsFailed)],
        ] as const).map(([key, val]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-muted-foreground text-xs">{t(`stats.${key}`)}</p>
              <p className="num mt-1 text-lg font-semibold">{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div className={cn("h-full rounded-full transition-all", j.status === "failed" ? "bg-destructive" : "bg-primary")} style={{ width: `${progress}%` }} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("stats.actor")}</dt><dd><Actor actor={j.actor} /></dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("stats.at")}</dt><dd className="num">{formatDateTime(j.at, locale)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{t("stats.total")}</dt><dd className="num">{formatNumber(total)}</dd></div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{t("stats.errorFile")}</dt>
              <dd>{j.errorFileUrl ? <a href={j.errorFileUrl} className="text-primary inline-flex items-center gap-1 hover:underline"><Download className="size-3.5" />{tList("download")}</a> : "—"}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {j.status === "completed" && j.type === "products" && j.productIds?.length ? (
              <Button variant="outline" asChild>
                <Link href={`/products?import=${j.id}`}>{t("viewImported", { count: formatNumber(j.productIds.length) })}</Link>
              </Button>
            ) : null}
            {canManage && j.status !== "processing" ? (
              <Button
                variant="outline"
                disabled={rerun.isPending}
                onClick={() =>
                  rerun.mutate([{ type: j.type, source: j.source, fileName: j.fileName, updateExisting: true }], {
                    onSuccess: (next) => { mt.success("imports.started"); router.push(`/imports/${next.id}`); },
                  })
                }
              >
                <RotateCcw aria-hidden />{t("retry")}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
