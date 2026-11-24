"use client";

import * as React from "react";
import { Image as ImageIcon, Mail, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppById, useAppInstallationList, useInstallApp } from "@repo/api-client";
import type { App } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { PageError } from "@repo/ui/components/page-error";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import Link from "@/components/store-link";
import { useStoreRouter } from "@/lib/store-route";
import { AppIcon, priceLabel as appPriceLabel } from "./apps-shared";

function ScopeList({ app }: { app: App }) {
  const t = useTranslations("apps");
  return (
    <ul className="space-y-2">
      {app.scopes.map((s) => (
        <li key={s} className="flex items-start gap-2 text-sm">
          <ShieldCheck className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{t(`scope.${s as "orders.read"}`)}</span>
        </li>
      ))}
    </ul>
  );
}

export function AppDetail({ appId }: { appId: string }) {
  const t = useTranslations("apps");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const mt = useMsgToast();
  const query = useAppById(appId);
  const installations = useAppInstallationList();
  const install = useInstallApp();
  const [consent, setConsent] = React.useState(false);

  const app = query.data;
  const installation = (installations.data ?? []).find((i) => i.appId === appId && i.status === "active") ?? null;

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!app) return <PageError errorKey="404" onRetry={() => query.refetch()} />;
  const name = app.name[locale] ?? app.name.ar;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("title"), href: "/apps" }, { label: t("storeTitle"), href: "/apps/store" }, { label: name }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <AppIcon app={app} locale={locale} size="size-16" />
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="text-muted-foreground text-sm">
              {app.developer} · <span className="num">★ {formatNumber(app.rating)}</span> · {t("installs", { count: formatNumber(app.installsCount) })}
            </p>
            <Badge variant="secondary">{t(`category.${app.category as "payments"}`)}</Badge>
          </div>
        </div>
        {installation ? (
          <Button variant="outline" asChild>
            <Link href={`/apps/${installation.id}`}>{t("openInstalled")}</Link>
          </Button>
        ) : (
          <Button onClick={() => setConsent(true)}>{t("install")}</Button>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("about")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm leading-7">{app.description[locale] ?? app.description.ar}</CardContent>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            {app.screenshots.map((s) => (
              <div key={s.id} className="bg-muted text-muted-foreground flex aspect-video items-center justify-center rounded-lg border border-dashed">
                <ImageIcon className="size-8" aria-hidden />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("scopesTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScopeList app={app} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("pricing")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{t(appPriceLabel(app, locale).key, appPriceLabel(app, locale).params)}</p>
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-xs">
                <Mail className="size-3.5" aria-hidden />
                <bdi dir="ltr">{app.supportEmail}</bdi>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={consent}
        onOpenChange={setConsent}
        titleKey="apps.consent.title"
        bodyKey="apps.consent.body"
        confirmKey="apps.consent.cta"
        params={{ app: name }}
        pending={install.isPending}
        onConfirm={() =>
          install.mutate([app.id], {
            onSuccess: (ins) => {
              mt.success("apps.installed", { app: name });
              setConsent(false);
              router.push(`/apps/${ins.id}`);
            },
          })
        }
      >
        <div className="space-y-3">
          <ScopeList app={app} />
          <p className="border-t pt-3 text-sm font-medium">{t(appPriceLabel(app, locale).key, appPriceLabel(app, locale).params)}</p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
