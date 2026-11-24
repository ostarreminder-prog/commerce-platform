"use client";

import { useMe, useRoles } from "@repo/api-client";
import { CopilotSecurityBar } from "@repo/copilot/ui";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { storeName, useCurrentStore } from "@/components/shell/store-switcher";

/** Persistent strip: which identity + store the copilot acts with. */
export function SecurityBar() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const { locale } = useAppLocale();
  const { data: me } = useMe();
  const { data: roles } = useRoles();
  const { data: store } = useCurrentStore();
  const role = roles?.find((r) => r.id === me?.roleId)?.name ?? "";

  return (
    <CopilotSecurityBar
      text={t("copilot.securityBar", {
        user: me?.name ?? "…",
        role,
        store: store ? storeName(store, locale) : "…",
      })}
    />
  );
}
