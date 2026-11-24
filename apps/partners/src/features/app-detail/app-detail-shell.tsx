"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ArrowRight, PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePartnerApp } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { AppIcon } from "@/components/app-icon";
import { AppStatusBadge } from "@/components/app-status-badge";

const TABS = ["settings", "scopes", "webhooks", "listing", "review", "analytics"] as const;

export function AppDetailShell({ id, children }: { id: string; children: React.ReactNode }) {
  const t = useTranslations();
  const { locale, dir } = useAppLocale();
  const pathname = usePathname();
  const query = usePartnerApp(id);
  const app = query.data;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  if (query.isPending) return <Skeleton className="h-96" />;
  if (query.isError || !app) {
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
  }

  return (
    <div className="space-y-6">
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
      </div>
      <nav className="no-scrollbar -mb-px flex gap-1 overflow-x-auto border-b" aria-label={t("nav.apps")}>
        {TABS.map((tab) => {
          const href = `/apps/${id}/${tab}`;
          const active = pathname === href;
          return (
            <Link
              key={tab}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active ? "border-primary text-foreground" : "text-muted-foreground hover:text-foreground border-transparent",
              )}
            >
              {t(`detail.tabs.${tab}`)}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
