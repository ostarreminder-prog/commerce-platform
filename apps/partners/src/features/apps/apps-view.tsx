"use client";

import Link from "next/link";
import { Blocks, Plus, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePartnerApps } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { AppIcon } from "@/components/app-icon";
import { AppStatusBadge } from "@/components/app-status-badge";

export function AppsView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const { data, isPending, isError, refetch } = usePartnerApps();
  const newButton = (
    <Button asChild>
      <Link href="/apps/new">
        <Plus aria-hidden />
        {t("apps.new")}
      </Link>
    </Button>
  );
  return (
    <div className="space-y-6">
      <PageHeader title={t("apps.title")} description={t("apps.description")} actions={newButton} />
      {isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState icon={Blocks} title={t("apps.emptyTitle")} description={t("apps.emptyText")} action={newButton} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((a) => (
            <Link key={a.id} href={`/apps/${a.id}`} className="focus-visible:ring-ring rounded-xl focus-visible:outline-none focus-visible:ring-2">
              <Card className="hover:border-primary/40 h-full transition-colors hover:shadow-md">
                <CardContent className="flex h-full flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <AppIcon name={a.name[locale] ?? a.name.ar} hue={a.hue} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{a.name[locale] ?? a.name.ar}</p>
                      <p className="text-muted-foreground text-xs">{t(`category.${a.category}`)}</p>
                    </div>
                    <AppStatusBadge status={a.status} />
                  </div>
                  <p className="text-muted-foreground line-clamp-2 flex-1 text-sm">{a.tagline[locale]}</p>
                  <div className="text-muted-foreground flex items-center gap-4 border-t pt-3 text-xs">
                    <span className="num">{t("apps.installs", { count: formatNumber(a.installs) })}</span>
                    {a.rating > 0 ? (
                      <span className="num flex items-center gap-1">
                        <Star className="size-3 fill-warning text-warning" aria-hidden />
                        {formatNumber(a.rating, { maximumFractionDigits: 1 })}
                      </span>
                    ) : null}
                    <span className="num ms-auto font-medium">{a.monthlyPrice ? formatMoney(a.monthlyPrice, locale) : t("common.free")}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
