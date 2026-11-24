"use client";

import { useTranslations } from "next-intl";
import { usePlatformPartners } from "@repo/api-client";
import type { PartnerStatus } from "@repo/contracts";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatNumber } from "@repo/ui/lib/format";

const VARIANT: Record<PartnerStatus, "success" | "warning" | "destructive"> = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
};

export function PartnersView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const partners = usePlatformPartners();
  const rows = partners.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("partners.title")} description={t("partners.description")} />
      {partners.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void partners.refetch()} />
      ) : partners.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("partners.developer")}</TableHead>
                <TableHead>{t("partners.apps")}</TableHead>
                <TableHead>{t("partners.status")}</TableHead>
                <TableHead>{t("partners.joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {p.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>
                        <span className="block font-medium">{p.name}</span>
                        <span className="text-muted-foreground block text-xs">
                          {p.company} · <span dir="ltr">{p.email}</span>
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="num">{t("partners.appsCount", { count: formatNumber(p.appsCount) })}</TableCell>
                  <TableCell>
                    <Badge variant={VARIANT[p.status]}>{t(`partnerStatus.${p.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(p.joinedAt, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
