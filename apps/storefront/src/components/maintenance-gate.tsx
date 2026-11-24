"use client";

import { Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMaintenanceSettings } from "@repo/api-client";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";

/**
 * Storefront maintenance mode — when the merchant flips the toggle in
 * `/settings/maintenance`, the synced settings reach this app via the shared
 * `cp_db_*` cookies and every (site) route renders this notice instead.
 */
export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("store.maintenance");
  const { locale } = useAppLocale();
  const { data } = useMaintenanceSettings();
  if (!data?.enabled) return <>{children}</>;
  const message = data.message[locale] ?? data.message.ar;
  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="bg-muted text-muted-foreground flex size-16 items-center justify-center rounded-full">
        <Wrench className="size-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md">{message}</p>
      {data.eta ? (
        <p className="text-muted-foreground num text-sm">{t("eta", { at: formatDateTime(data.eta, locale) })}</p>
      ) : null}
    </div>
  );
}
