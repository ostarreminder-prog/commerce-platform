"use client";

import { useTranslations } from "next-intl";
import { useFeatureFlags, useSetFeatureFlag } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

export function FlagsView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const flags = useFeatureFlags();
  const setFlag = useSetFeatureFlag();
  const rows = flags.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("flags.title")} description={t("flags.description")} />
      {flags.isError ? (
        <ErrorState title={t("common.error")} onRetry={() => void flags.refetch()} />
      ) : flags.isPending ? (
        <Skeleton className="h-96" />
      ) : rows.length === 0 ? (
        <EmptyState title={t("common.noResults")} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {rows.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-start gap-4 p-5">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="font-semibold">{f.name[locale] ?? f.name.ar}</p>
                  <code className="bg-muted inline-block rounded px-2 py-0.5 font-mono text-xs" dir="ltr">
                    {f.key}
                  </code>
                  <p className="text-muted-foreground text-sm">{f.description[locale] ?? f.description.ar}</p>
                  <p className="flex items-center gap-2 pt-1 text-xs">
                    <Badge variant="outline">{t(`flagScope.${f.scope}`)}</Badge>
                    <span className="text-muted-foreground">{t(`flags.audience.${f.audience}`)}</span>
                  </p>
                </div>
                <Switch
                  checked={f.enabled}
                  aria-label={f.name[locale] ?? f.name.ar}
                  onCheckedChange={(enabled) =>
                    setFlag.mutate({ id: f.id, enabled }, { onSuccess: () => toast.success(t("flags.toggled", { name: f.name[locale] ?? f.name.ar })) })
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
