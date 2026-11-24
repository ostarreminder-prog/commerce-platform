"use client";

import * as React from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppById, useAppInstallationById, useAuditLog, useUninstallApp } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { PageError } from "@repo/ui/components/page-error";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatRelativeTime } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { useStoreRouter } from "@/lib/store-route";
import { AppIcon, priceLabel as appPriceLabel } from "./apps-shared";
import { ConnectionCard } from "./connection-card";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <dt className="text-muted-foreground shrink-0">{label}</dt>
      <dd className="min-w-0 text-end font-medium">{children}</dd>
    </div>
  );
}

export function InstallationDetail({ installationId }: { installationId: string }) {
  const t = useTranslations("apps");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const mt = useMsgToast();
  const query = useAppInstallationById(installationId);
  const appQuery = useAppById(query.data?.appId ?? "");
  const audit = useAuditLog();
  const uninstall = useUninstallApp();
  const [confirm, setConfirm] = React.useState(false);

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }
  const ins = query.data;
  if (!ins) return <PageError errorKey="404" onRetry={() => query.refetch()} />;
  const app = appQuery.data ?? null;
  const name = app?.name[locale] ?? ins.appId;
  const activity = (audit.data ?? []).filter((a) => a.target?.id === ins.id || a.actor.id === ins.appId);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("title"), href: "/apps" }, { label: name }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          {app ? <AppIcon app={app} locale={locale} size="size-14" /> : <span className="bg-muted size-14 rounded-xl" aria-hidden />}
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <div className="flex items-center gap-2">
              <StatusBadge entity="installation" value={ins.status} />
              <span className="text-muted-foreground text-sm">{t("installedAt", { date: formatDateTime(ins.installedAt, locale) })}</span>
            </div>
          </div>
        </div>
        {ins.status === "active" ? (
          <Button variant="destructive" onClick={() => setConfirm(true)}>
            <Trash2 aria-hidden />
            {t("uninstall")}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("grantedScopes")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {ins.grantedScopes.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm">
                    <ShieldCheck className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{t(`scope.${s as "orders.read"}`)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          {ins.status !== "uninstalled" ? <ConnectionCard key={`${ins.id}-${ins.connectionStatus ?? "untested"}`} installation={ins} /> : null}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("activity")}</CardTitle>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("noActivity")}</p>
              ) : (
                <ul className="space-y-3">
                  {activity.map((a) => (
                    <li key={a.id} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        {t(`auditAction.${a.action as "app.installed"}`)}
                        {a.target ? (
                          <>
                            {" "}
                            <EntityLink type={a.target.type} id={a.target.id} label={a.target.label} />
                          </>
                        ) : null}
                      </span>
                      <time dateTime={a.at} className="text-muted-foreground shrink-0 text-xs">
                        {formatRelativeTime(a.at, locale)}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("billing")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5">
                <Field label={t("pricing")}>{app ? t(appPriceLabel(app, locale).key, appPriceLabel(app, locale).params) : "—"}</Field>
                <Field label={t("installedBy")}><EntityLink type="staff" id={ins.installedBy} /></Field>
                <Field label={t("installedAtShort")}>{formatDateTime(ins.installedAt, locale)}</Field>
                <Field label={t("lastActivityShort")}>{ins.lastActivityAt ? formatRelativeTime(ins.lastActivityAt, locale) : "—"}</Field>
              </dl>
            </CardContent>
          </Card>
          {app ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{t("appInfo")}</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2.5">
                  <Field label={t("developer")}>{app.developer}</Field>
                  <Field label={t("support")}><bdi dir="ltr">{app.supportEmail}</bdi></Field>
                  <Field label={t("storePage")}><EntityLink type="app" id={app.id} label={t("openStorePage")} /></Field>
                </dl>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        titleKey="apps.uninstall.title"
        bodyKey="apps.uninstall.body"
        confirmLabel={t("uninstall")}
        params={{ app: name }}
        danger
        pending={uninstall.isPending}
        onConfirm={() =>
          uninstall.mutate([ins.id], {
            onSuccess: () => {
              mt.success("apps.uninstalled", { app: name });
              setConfirm(false);
              router.push("/apps");
            },
          })
        }
      />
    </div>
  );
}
