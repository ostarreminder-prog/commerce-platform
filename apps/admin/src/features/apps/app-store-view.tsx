"use client";

import * as React from "react";
import { Blocks, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppInstallationList, useAppList } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { Input } from "@repo/ui/components/input";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { AppIcon, priceLabel as appPriceLabel } from "./apps-shared";

export function AppStoreView() {
  const t = useTranslations("apps");
  const { locale } = useAppLocale();
  const apps = useAppList();
  const installations = useAppInstallationList();
  const [category, setCategory] = React.useState("all");
  const [search, setSearch] = React.useState("");

  const installedAppIds = React.useMemo(
    () => new Set((installations.data ?? []).filter((i) => i.status === "active").map((i) => i.appId)),
    [installations.data],
  );
  const categories = React.useMemo(() => [...new Set((apps.data ?? []).map((a) => a.category))], [apps.data]);
  const q = search.trim().toLowerCase();
  const rows = (apps.data ?? []).filter(
    (a) =>
      (category === "all" || a.category === category) &&
      (q === "" || a.name.ar.includes(search.trim()) || (a.name.en ?? "").toLowerCase().includes(q)),
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t("storeTitle")} description={t("storeDescription")} />
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} aria-label={t("search")} className="ps-9" />
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="tablist">
          {["all", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "focus-visible:ring-ring shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
                category === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
              )}
            >
              {t(`category.${c as "all"}`)}
            </button>
          ))}
        </div>
      </div>
      <DataState state={apps} loading={<Skeleton className="h-80" />}>
        {() =>
          rows.length === 0 ? (
            <Card>
              <MsgEmptyState emptyKey="search" params={{ query: search.trim() }} icon={Blocks} />
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((a) => {
                const installed = installedAppIds.has(a.id);
                return (
                  <Card key={a.id} className="flex flex-col">
                    <CardContent className="flex flex-1 flex-col gap-4 p-5">
                      <div className="flex items-start gap-3">
                        <AppIcon app={a} locale={locale} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <Link href={`/apps/store/${a.id}`} className="truncate font-semibold hover:underline">
                              {a.name[locale] ?? a.name.ar}
                            </Link>
                            {installed ? <Badge variant="success">{t("installed")}</Badge> : null}
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {t(`category.${a.category as "payments"}`)} · <span className="num">★ {formatNumber(a.rating)}</span> · {formatNumber(a.installsCount)}
                          </p>
                        </div>
                      </div>
                      <p className="text-muted-foreground line-clamp-2 flex-1 text-sm">{a.shortDescription[locale] ?? a.shortDescription.ar}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t(appPriceLabel(a, locale).key, appPriceLabel(a, locale).params)}</span>
                        <Button variant={installed ? "outline" : "default"} size="sm" asChild>
                          <Link href={`/apps/store/${a.id}`}>{installed ? t("open") : t("install")}</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        }
      </DataState>
    </div>
  );
}
