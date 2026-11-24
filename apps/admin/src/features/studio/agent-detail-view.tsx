"use client";

import Link from "@/components/store-link";
import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgent, useAgents } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Editor } from "./agent-editor";

export function AgentDetailView({ id }: { id: string }) {
  const t = useTranslations("studio.detail");
  const agent = useAgent(id);
  const agents = useAgents();
  return (
    <DataState
      state={agent}
      loading={
        <div className="space-y-6">
          <Skeleton className="h-4 w-64" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-48" /> <Skeleton className="h-4 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" /> <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      }
      error={(retry) =>
        agent.error && String(agent.error).includes("not found") ? (
          <EmptyState
            icon={Bot}
            title={t("notFoundTitle")}
            description={t("notFoundBody")}
            action={
              <Button asChild>
                <Link href="/agents">{t("backToStudio")}</Link>
              </Button>
            }
          />
        ) : (
          <ErrorState title={t("errorTitle")} onRetry={retry} />
        )
      }
    >
      {(a) => <Editor key={a.id} saved={a} agents={agents.data ?? [a]} />}
    </DataState>
  );
}
