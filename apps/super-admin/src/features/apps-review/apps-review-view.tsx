"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAppSubmissions } from "@repo/api-client";
import type { SubmissionStatus } from "@repo/contracts";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { ReviewStatusBadge, SubmissionLogo } from "./review-badges";

const STATUSES: SubmissionStatus[] = ["pending", "approved", "rejected"];

export function AppsReviewView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const subs = useAppSubmissions();
  const [status, setStatus] = React.useState<SubmissionStatus | "all">("pending");
  const all = subs.data ?? [];
  const rows = all
    .filter((s) => status === "all" || s.status === status)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

  return (
    <div className="space-y-6">
      <PageHeader title={t("review.title")} description={t("review.description")} />
      <Tabs value={status} onValueChange={(v) => setStatus(v as SubmissionStatus | "all")}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s}>
              {t(`reviewStatus.${s}`)}{" "}
              <span className="num text-muted-foreground ms-1 text-xs">{formatNumber(all.filter((x) => x.status === s).length)}</span>
            </TabsTrigger>
          ))}
          <TabsTrigger value="all">
            {t("common.all")} <span className="num text-muted-foreground ms-1 text-xs">{formatNumber(all.length)}</span>
          </TabsTrigger>
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
                <TableHead>{t("review.app")}</TableHead>
                <TableHead>{t("review.developer")}</TableHead>
                <TableHead>{t("review.scopes")}</TableHead>
                <TableHead>{t("review.submitted")}</TableHead>
                <TableHead>{t("subscriptions.status")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/apps-review/${s.id}`} className="flex items-center gap-3">
                      <SubmissionLogo name={s.name[locale] ?? s.name.ar} hue={s.hue} />
                      <span>
                        <span className="block font-medium">{s.name[locale] ?? s.name.ar}</span>
                        <span className="text-muted-foreground block text-xs">{s.tagline[locale] ?? s.tagline.ar}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className="block">{s.developer}</span>
                    <span className="text-muted-foreground block text-xs" dir="ltr">
                      {s.developerEmail}
                    </span>
                  </TableCell>
                  <TableCell className="num text-muted-foreground">{t("review.scopesCount", { count: formatNumber(s.scopes.length) })}</TableCell>
                  <TableCell className="text-muted-foreground">{formatRelativeTime(s.submittedAt, locale)}</TableCell>
                  <TableCell>
                    <ReviewStatusBadge status={s.status} />
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
