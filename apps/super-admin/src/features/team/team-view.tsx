"use client";

import { useTranslations } from "next-intl";
import { usePlatformTeam } from "@repo/api-client";
import type { StaffStatus } from "@repo/contracts";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatRelativeTime } from "@repo/ui/lib/format";

const STATUS_VARIANT: Record<StaffStatus, "success" | "info" | "destructive"> = {
  active: "success",
  invited: "info",
  suspended: "destructive",
};

export function TeamView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const team = usePlatformTeam();
  const rows = team.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("team.title")} description={t("team.description")} />
      {team.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void team.refetch()} />
      ) : team.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("team.member")}</TableHead>
                <TableHead>{t("team.email")}</TableHead>
                <TableHead>{t("team.role")}</TableHead>
                <TableHead>{t("team.status")}</TableHead>
                <TableHead>{t("team.lastActive")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {m.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{m.name}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground" dir="ltr">
                    {m.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.role === "owner" ? "default" : "outline"}>{t(`role.${m.role}`)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.status]}>{t(`staffStatus.${m.status}`)}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.lastActiveAt ? formatRelativeTime(m.lastActiveAt, locale) : t("team.never")}
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
