"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, PackageX, Send, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePartnerApp, useSavePartnerApp } from "@repo/api-client";
import type { PartnerApp } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { AppIcon } from "@/components/app-icon";
import { AppStatusBadge } from "@/components/app-status-badge";
import { blank } from "./app-editor-constants";
import { CredentialsTab, ListingTab, ScopesTab, WebhooksTab } from "./editor-tabs";

function Editor({ initial, isNew }: { initial: PartnerApp; isNew: boolean }) {
  const t = useTranslations();
  const { locale, dir } = useAppLocale();
  const router = useRouter();
  const save = useSavePartnerApp();
  const [app, setApp] = React.useState(initial);
  const [price, setPrice] = React.useState(String(initial.monthlyPrice / 100));
  const [secret, setSecret] = React.useState(`sk_live_${initial.clientId.slice(3)}9f2c4ab71e0d`);
  const [events, setEvents] = React.useState<string[]>(["order.created", "order.paid", "app.uninstalled"]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [tab, setTab] = React.useState("listing");
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const set = <K extends keyof PartnerApp>(k: K, v: PartnerApp[K]) => setApp((a) => ({ ...a, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!app.name.ar.trim()) e.nameAr = t("editor.required");
    if (!(app.name.en ?? "").trim()) e.nameEn = t("editor.required");
    if (app.redirectUrl && !app.redirectUrl.startsWith("https://")) e.redirect = t("editor.invalidUrl");
    if (app.webhookUrl && !app.webhookUrl.startsWith("https://")) e.webhook = t("editor.invalidUrl");
    setErrors(e);
    if (e.nameAr || e.nameEn || e.redirect) setTab("listing");
    else if (e.webhook) setTab("webhooks");
    return Object.keys(e).length === 0;
  };

  const persist = (patch: Partial<PartnerApp>, message: string) => {
    if (!validate()) return;
    const next = { ...app, ...patch, monthlyPrice: Math.max(0, Math.round(Number(price) * 100) || 0), updatedAt: new Date().toISOString() };
    save.mutate(next, {
      onSuccess: () => {
        setApp(next);
        toast.success(message);
        if (isNew) router.replace(`/apps/${next.id}`);
      },
    });
  };

  const toggleScope = (scope: string, on: boolean) =>
    set("scopes", on ? [...new Set([...app.scopes, scope])] : app.scopes.filter((s) => s !== scope));

  return (
    <div className="space-y-6 pb-24">
      <Button variant="ghost" size="sm" asChild className="-ms-2">
        <Link href="/apps">
          <Back aria-hidden />
          {t("nav.apps")}
        </Link>
      </Button>
      <div className="flex flex-wrap items-center gap-4">
        <AppIcon name={app.name[locale] || "?"} hue={app.hue} className="size-14 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{app.name[locale] || t("editor.newTitle")}</h1>
          <div className="mt-1 flex items-center gap-2">
            <AppStatusBadge status={app.status} />
            <span className="text-muted-foreground text-sm">{t(`category.${app.category}`)}</span>
          </div>
        </div>
        {app.status === "draft" ? (
          <Button onClick={() => persist({ status: "inReview" }, t("editor.submitted"))} loading={save.isPending && app.status === "draft"}>
            <Send aria-hidden />
            {t("editor.submit")}
          </Button>
        ) : null}
      </div>
      {app.status === "inReview" ? (
        <Alert variant="warning">
          <ShieldAlert aria-hidden />
          <AlertDescription>{t("editor.inReviewNote")}</AlertDescription>
        </Alert>
      ) : null}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="no-scrollbar w-full justify-start overflow-x-auto sm:w-auto">
          {(["listing", "credentials", "scopes", "webhooks"] as const).map((k) => (
            <TabsTrigger key={k} value={k}>
              {t(`editor.tabs.${k}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <Card className="mt-4">
          <CardContent className="p-5 sm:p-6">
            <ListingTab app={app} price={price} errors={errors} set={set} onPriceChange={setPrice} />
            <CredentialsTab clientId={app.clientId} secret={secret} setSecret={setSecret} />
            <ScopesTab scopes={app.scopes} onToggle={toggleScope} />
            <WebhooksTab webhookUrl={app.webhookUrl} errors={errors} events={events} set={set} setEvents={setEvents} />
          </CardContent>
        </Card>
      </Tabs>
      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur lg:ms-60">
        <div className="mx-auto flex max-w-7xl justify-end gap-2 px-4 py-3 sm:px-6">
          <Button variant="outline" asChild>
            <Link href="/apps">{t("common.back")}</Link>
          </Button>
          <Button onClick={() => persist({}, t("common.saved"))} loading={save.isPending}>
            {t("common.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppEditor({ id }: { id?: string }) {
  const t = useTranslations();
  const query = usePartnerApp(id ?? "");
  const [fresh] = React.useState(blank);
  if (!id) return <Editor initial={fresh} isNew />;
  if (query.isPending) return <Skeleton className="h-96" />;
  if (query.isError || !query.data)
    return (
      <EmptyState
        icon={PackageX}
        title={t("editor.notFound")}
        action={
          <Button variant="outline" asChild>
            <Link href="/apps">{t("nav.apps")}</Link>
          </Button>
        }
      />
    );
  return <Editor key={query.data.id} initial={query.data} isNew={false} />;
}
