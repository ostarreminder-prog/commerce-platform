"use client";

import Link from "next/link";
import { PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePartnerApp } from "@repo/api-client";
import type { PartnerApp } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";

/** Resolves the app from the shared react-query cache (shell already fetched it). */
export function AppLoader({ id, children }: { id: string; children: (app: PartnerApp) => React.ReactNode }) {
  const t = useTranslations();
  const query = usePartnerApp(id);
  if (query.isPending) return <Skeleton className="h-64" />;
  if (query.isError || !query.data) {
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
  return <>{children(query.data)}</>;
}
