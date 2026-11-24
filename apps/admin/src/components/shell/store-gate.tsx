"use client";

import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { useCurrentStore } from "./store-switcher";

/** Blocks rendering of any store-scoped screen when the slug doesn't resolve to a store the user can access. */
export function StoreGate({ children }: { children: React.ReactNode }) {
  const t = useTranslations("storeGate");
  const { data, isPending } = useCurrentStore();
  if (isPending || data) return <>{children}</>;
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <EmptyState
        title={t("title")}
        description={t("description")}
        action={
          <Button asChild>
            <NextLink href="/nakhla">{t("back")}</NextLink>
          </Button>
        }
      />
    </div>
  );
}
