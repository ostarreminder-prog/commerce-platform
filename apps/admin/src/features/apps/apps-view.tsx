"use client";

import * as React from "react";
import { Blocks, Store, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppInstallationList, useAppList, useUninstallApp } from "@repo/api-client";
import type { AppInstallation } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { AppIcon } from "./apps-shared";

export function AppsView() {
  const t = useTranslations("apps");
  const { locale } = useAppLocale();
  const mt = useMsgToast();
  const installations = useAppInstallationList();
  const apps = useAppList();
  const uninstall = useUninstallApp();
  const [target, setTarget] = React.useState<AppInstallation | null>(null);

  const appById = React.useMemo(() => new Map((apps.data ?? []).map((a) => [a.id, a])), [apps.data]);
  const rows = installations.data ?? [];
  const targetApp = target ? appById.get(target.appId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("installedDescription")}
        actions={
          <>
            <Badge variant="secondary">{t("installedCount", { count: formatNumber(rows.filter((r) => r.status === "active").length) })}</Badge>
            <Button asChild>
              <Link href="/apps/store">
                <Store aria-hidden />
                {t("browseStore")}
              </Link>
            </Button>
          </>
        }
      />
      <DataState state={installations} loading={<Skeleton className="h-64" />}>
        {() =>
          rows.length === 0 ? (
            <Card>
              <MsgEmptyState
                emptyKey="apps"
                icon={Blocks}
                action={
                  <Button asChild>
                    <Link href="/apps/store">{t("browseStore")}</Link>
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {rows.map((ins) => {
                    const app = appById.get(ins.appId);
                    return (
                      <li key={ins.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          {app ? <AppIcon app={app} locale={locale} /> : <span className="bg-muted size-12 rounded-xl" aria-hidden />}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <Link href={`/apps/${ins.id}`} className="truncate font-semibold hover:underline">
                                {app?.name[locale] ?? ins.appId}
                              </Link>
                              <StatusBadge entity="installation" value={ins.status} />
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {t("grantedScopesCount", { count: formatNumber(ins.grantedScopes.length) })}
                              {ins.lastActivityAt ? ` · ${t("lastActivity", { time: formatRelativeTime(ins.lastActivityAt, locale) })}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/apps/${ins.id}`}>{t("open")}</Link>
                          </Button>
                          {ins.status === "active" ? (
                            <Button variant="ghost" size="icon-sm" aria-label={t("uninstall")} onClick={() => setTarget(ins)}>
                              <Trash2 className="text-destructive" aria-hidden />
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )
        }
      </DataState>
      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(o) => !o && setTarget(null)}
        titleKey="apps.uninstall.title"
        bodyKey="apps.uninstall.body"
        params={{ app: targetApp?.name[locale] ?? target?.appId ?? "" }}
        confirmLabel={t("uninstall")}
        danger
        pending={uninstall.isPending}
        onConfirm={() => {
          if (!target) return;
          const name = targetApp?.name[locale] ?? target.appId;
          uninstall.mutate([target.id], {
            onSuccess: () => {
              mt.success("apps.uninstalled", { app: name });
              setTarget(null);
            },
          });
        }}
      />
    </div>
  );
}
