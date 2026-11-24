"use client";

import { Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMaintenanceSettings } from "@repo/api-client";
import Link from "@/components/store-link";

/** Global strip shown to staff while storefront maintenance mode is on. */
export function MaintenanceBanner() {
  const t = useTranslations("maintenance");
  const { data } = useMaintenanceSettings();
  if (!data?.enabled) return null;
  return (
    <div className="bg-warning text-warning-foreground flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium" role="status">
      <Wrench className="size-3.5 shrink-0" aria-hidden />
      <span>{t("shellBanner")}</span>
      <Link href="/settings/maintenance" className="underline underline-offset-2 hover:opacity-80">
        {t("manage")}
      </Link>
    </div>
  );
}
