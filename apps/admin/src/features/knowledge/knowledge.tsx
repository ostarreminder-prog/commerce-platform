"use client";

import * as React from "react";
import { BookOpen, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAgents, useDeleteKnowledge, useKnowledgeList } from "@repo/api-client";
import type { KnowledgeSource } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { AddSourceDialog } from "./add-source-dialog";
export { KnowledgeDetail } from "./knowledge-detail";

export function KnowledgeList() {
  const t = useTranslations("knowledge");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("agents.manage");
  const list = useKnowledgeList();
  const agents = useAgents();
  const del = useDeleteKnowledge();
  const [q, setQ] = React.useState("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<KnowledgeSource | null>(null);

  const agentName = React.useCallback((id: string) => agents.data?.find((a) => a.id === id)?.name ?? id, [agents.data]);
  const visible = (list.data ?? []).filter((s) => !q || s.title.toLowerCase().includes(q.toLowerCase()));

  const columns = React.useMemo<ColumnDef<KnowledgeSource, unknown>[]>(() => [
    { id: "title", accessorKey: "title", header: t("cols.title"), cell: ({ row }) => <EntityLink type="knowledge" id={row.original.id} label={row.original.title} /> },
    { id: "type", header: t("cols.type"), cell: ({ row }) => <span className="text-sm">{t(`types.${row.original.type}`)}</span> },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="knowledge" value={row.original.status} /> },
    { id: "chunks", header: t("cols.chunks"), cell: ({ row }) => <span className="num">{row.original.status === "ready" ? formatNumber(row.original.chunksCount) : "—"}</span> },
    {
      id: "agents",
      header: t("cols.agents"),
      cell: ({ row }) => row.original.usedByAgentIds.length ? (
        <span className="flex flex-wrap gap-1">{row.original.usedByAgentIds.map((id) => <EntityLink key={id} type="agent" id={id} label={agentName(id)} />)}</span>
      ) : <span className="text-muted-foreground">—</span>,
    },
    { id: "synced", header: t("cols.synced"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap text-xs">{row.original.lastSyncedAt ? formatRelativeTime(row.original.lastSyncedAt, locale, NOW) : "—"}</span> },
    { id: "auto", header: t("cols.auto"), cell: ({ row }) => row.original.autoSync ? <Badge variant="secondary" className="font-normal">{t("autoOn")}</Badge> : <span className="text-muted-foreground">—</span> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => canManage ? (
        <Button variant="ghost" size="icon" aria-label={t("deleteTitle")} onClick={(e) => { e.stopPropagation(); setDeleteTarget(row.original); }}><Trash2 className="size-4" /></Button>
      ) : null,
    },
  ], [t, locale, canManage, agentName]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="w-56 ps-9" />
            </div>
            {canManage ? <Button onClick={() => setAddOpen(true)}><Plus aria-hidden />{t("addSource")}</Button> : null}
          </>
        }
      />
      <DataState
        state={list}
        loading={<TableSkeleton rows={6} columns={7} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><MsgEmptyState emptyKey="knowledge" icon={BookOpen} action={canManage ? <Button onClick={() => setAddOpen(true)}><Plus aria-hidden />{t("addSource")}</Button> : undefined} /></Card>}
      >
        {() => (
          <>
            <div className="hidden md:block">
              <DataTable columns={columns} data={visible} getRowId={(s) => s.id} pageSize={15} onRowClick={(s) => router.push(`/knowledge/${s.id}`)} />
            </div>
            <div className="space-y-3 md:hidden">
              {visible.map((s) => (
                <button key={s.id} type="button" onClick={() => router.push(`/knowledge/${s.id}`)} className="bg-card hover:bg-accent/40 flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-start">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.title}</p>
                    <p className="text-muted-foreground text-xs">{t(`types.${s.type}`)}</p>
                  </div>
                  <StatusBadge entity="knowledge" value={s.status} />
                </button>
              ))}
            </div>
          </>
        )}
      </DataState>
      <AddSourceDialog open={addOpen} onOpenChange={setAddOpen} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        titleKey="products.delete.title"
        params={{ name: deleteTarget?.title ?? "" }}
        body={deleteTarget?.usedByAgentIds.length ? mt.text("knowledge.delete.used", { count: deleteTarget.usedByAgentIds.length }) : t("deleteDescription", { name: deleteTarget?.title ?? "" })}
        confirmLabel={t("confirmDelete")}
        danger
        pending={del.isPending}
        onConfirm={() => deleteTarget && del.mutate([deleteTarget.id], { onSuccess: () => { mt.success("products.delete.success"); setDeleteTarget(null); } })}
      />
    </div>
  );
}
