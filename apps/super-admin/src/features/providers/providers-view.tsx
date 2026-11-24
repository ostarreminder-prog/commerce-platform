"use client";

import { useTranslations } from "next-intl";
import { useProviders, useSetProvider } from "@repo/api-client";
import type { ProviderKind } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent } from "@repo/ui/components/card";
import { ErrorState } from "@repo/ui/components/error-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";

const KINDS: ProviderKind[] = ["payment", "shipping", "communication"];

export function ProvidersView() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const providers = useProviders();
  const setProvider = useSetProvider();
  const all = providers.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("providers.title")} description={t("providers.description")} />
      {providers.isError ? <ErrorState title={t("common.error")} onRetry={() => void providers.refetch()} /> : null}
      {providers.isPending ? (
        <Skeleton className="h-96" />
      ) : (
        KINDS.map((kind) => {
          const items = all.filter((p) => p.kind === kind);
          if (items.length === 0) return null;
          return (
            <section key={kind} className="space-y-3">
              <h2 className="text-sm font-semibold">{t(`providerKind.${kind}`)}</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="flex items-start gap-4 p-5">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold">
                          {p.name[locale] ?? p.name.ar}
                          <Badge variant={p.enabled ? "success" : "secondary"}>
                            {t(p.enabled ? "providers.enabled" : "providers.disabled")}
                          </Badge>
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">{p.description[locale] ?? p.description.ar}</p>
                        <p className="text-muted-foreground num mt-2 text-xs">
                          {t("providers.storesCount", { count: formatNumber(p.storesCount) })}
                        </p>
                      </div>
                      <Switch
                        checked={p.enabled}
                        aria-label={p.name[locale] ?? p.name.ar}
                        onCheckedChange={(enabled) =>
                          setProvider.mutate({ id: p.id, enabled }, { onSuccess: () => toast.success(t("providers.toggled", { name: p.name[locale] ?? p.name.ar })) })
                        }
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
