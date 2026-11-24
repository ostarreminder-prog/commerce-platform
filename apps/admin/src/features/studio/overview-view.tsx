"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Eye, GitBranch, ListTree, Plus, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useDuplicateBranch, usePhoneNumbers } from "@repo/api-client";
import type { Agent } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { toast } from "@repo/ui/components/toaster";
import { Can, useCan } from "@/lib/permissions";
import type { AgentAction } from "./agent-actions";
import { AddAgentDialog, DeleteAgentDialog, ToggleAgentDialog } from "./agent-dialogs";
import { AgentTree } from "./agent-tree";
import { StudioKpis } from "./overview-kpis";
import { StudioHeader } from "./studio-header";
import { agentWarnings, depthOf, indexAgents } from "./tree";

const AgentGraph = dynamic(() => import("./agent-graph"), {
  ssr: false,
  loading: () => <Skeleton className="h-[560px] w-full rounded-xl sm:h-[640px]" />,
});

export function AgentsOverview() {
  const t = useTranslations("studio");
  const agentsQuery = useAgents();
  const { data: phones = [] } = usePhoneNumbers();
  const duplicate = useDuplicateBranch();
  const canManage = useCan("agents.manage");
  const [view, setView] = React.useState<"tree" | "graph">("tree");
  const [query, setQuery] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [adding, setAdding] = React.useState<{ parentId: string | null } | null>(null);
  const [deleting, setDeleting] = React.useState<Agent | null>(null);
  const [toggling, setToggling] = React.useState<Agent | null>(null);
  const agents = React.useMemo(() => agentsQuery.data ?? [], [agentsQuery.data]);
  const index = React.useMemo(() => indexAgents(agents), [agents]);
  const onToggle = React.useCallback(
    (id: string) =>
      setCollapsed((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      }),
    [],
  );
  const onAction = React.useCallback(
    (action: AgentAction, agent: Agent) => {
      if (action === "addChild") setAdding({ parentId: agent.id });
      if (action === "delete") setDeleting(agent);
      if (action === "toggle") setToggling(agent);
      if (action === "duplicate")
        duplicate.mutate([agent.id], { onSuccess: () => toast.success(t("actions.duplicated")) });
    },
    [duplicate, t],
  );
  const levels = agents.reduce((m, a) => Math.max(m, depthOf(index, a.id) + 1), 0);
  const warningCount = agents.reduce((n, a) => n + agentWarnings(index, a, phones).length, 0);
  const parents = agents.filter((a) => index.children.has(a.id)).map((a) => a.id);
  return (
    <div className="space-y-6">
      <StudioHeader
        actions={
          <Can permission="agents.manage">
            <Button onClick={() => setAdding({ parentId: null })}>
              <Plus aria-hidden /> {t("overview.addRoot")}
            </Button>
          </Can>
        }
      />
      <StudioKpis />
      {!canManage ? (
        <Alert variant="info">
          <Eye aria-hidden /> <AlertDescription>{t("overview.readOnly")}</AlertDescription>
        </Alert>
      ) : null}
      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
              <TabsList>
                <TabsTrigger value="tree" className="gap-2">
                  <ListTree className="size-4" aria-hidden /> {t("overview.viewTree")}
                </TabsTrigger>
                <TabsTrigger value="graph" className="gap-2">
                  <GitBranch className="size-4" aria-hidden /> {t("overview.viewGraph")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {view === "tree" ? (
              <div className="relative lg:w-72">
                <Search
                  className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
                  aria-hidden
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("overview.search")}
                  aria-label={t("overview.search")}
                  className="ps-9"
                />
              </div>
            ) : null}
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs lg:ms-auto">
              <span className="num">{t("overview.agentsCount", { count: agents.length })}</span>
              <span aria-hidden>·</span>
              <span className="num">{t("overview.levels", { count: levels })}</span>
              {warningCount ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="text-warning font-medium">
                    {t("overview.warningsCount", { count: warningCount })}
                  </span>
                </>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setCollapsed(new Set())}
              >
                {t("overview.expandAll")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setCollapsed(new Set(parents))}
              >
                {t("overview.collapseAll")}
              </Button>
            </div>
          </div>
          <DataState
            state={agentsQuery}
            isEmpty={(d) => d.length === 0}
            loading={
              <div className="space-y-2">
                {Array.from({ length: 7 }, (_, i) => (
                  <Skeleton
                    key={i}
                    className="h-14 w-full rounded-xl"
                    style={{ marginInlineStart: (i % 4) * 28 }}
                  />
                ))}
              </div>
            }
            empty={
              <EmptyState
                icon={ListTree}
                title={t("overview.emptyTitle")}
                description={t("overview.emptyBody")}
                action={
                  canManage ? (
                    <Button onClick={() => setAdding({ parentId: null })}>
                      <Plus aria-hidden /> {t("overview.addRoot")}
                    </Button>
                  ) : undefined
                }
              />
            }
            error={(retry) => <ErrorState title={t("overview.errorTitle")} onRetry={retry} />}
          >
            {() =>
              view === "tree" ? (
                <div className="space-y-3">
                  {canManage ? (
                    <p className="text-muted-foreground text-xs">{t("overview.dragHint")}</p>
                  ) : null}
                  <AgentTree
                    index={index}
                    phones={phones}
                    collapsed={collapsed}
                    onToggle={onToggle}
                    onAction={onAction}
                    query={query}
                  />
                </div>
              ) : (
                <AgentGraph
                  index={index}
                  phones={phones}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  onAction={onAction}
                />
              )
            }
          </DataState>
        </CardContent>
      </Card>
      <AddAgentDialog
        agents={agents}
        parentId={adding?.parentId ?? null}
        open={adding !== null}
        onOpenChange={(o) => !o && setAdding(null)}
      />
      <DeleteAgentDialog agents={agents} agent={deleting} onClose={() => setDeleting(null)} />
      <ToggleAgentDialog agents={agents} agent={toggling} onClose={() => setToggling(null)} />
    </div>
  );
}
