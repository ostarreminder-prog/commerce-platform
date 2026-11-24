"use client";

import { useTranslations } from "next-intl";
import { usePlatformThemes } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatNumber } from "@repo/ui/lib/format";

export function ThemesView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const themes = usePlatformThemes();
  const rows = themes.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("themesMarket.title")} description={t("themesMarket.description")} />
      {themes.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void themes.refetch()} />
      ) : themes.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((th) => {
            const sections = Object.values(th.sections).reduce((n, s) => n + s.length, 0);
            return (
              <Card key={th.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{th.name}</p>
                      <p className="text-muted-foreground num mt-1 text-xs">
                        {t("themesMarket.sections", { count: formatNumber(sections) })}
                      </p>
                    </div>
                    <Badge variant={th.status === "published" ? "success" : "secondary"}>
                      {t(th.status === "published" ? "themesMarket.published" : "themesMarket.draft")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-8 rounded-md border"
                      style={{ background: th.globals.primaryColor }}
                      aria-hidden
                    />
                    <code className="text-muted-foreground font-mono text-xs" dir="ltr">
                      {th.globals.primaryColor}
                    </code>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {th.publishedAt ? t("themesMarket.publishedAt", { date: formatDate(th.publishedAt, locale) }) : "—"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
