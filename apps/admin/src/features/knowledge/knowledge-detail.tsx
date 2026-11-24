"use client";

import * as React from "react";
import { Bot, Loader2, Pencil, RefreshCw, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import {
  useAgents, useDeleteKnowledge, useKnowledgeById,
  useLinkKnowledgeAgent, useSetKnowledgeAutoSync, useSyncKnowledge, useTestKnowledge, useUnlinkKnowledgeAgent,
} from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Switch } from "@repo/ui/components/switch";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatNumber, formatPercent } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";
import { AddSourceDialog } from "./add-source-dialog";

export function KnowledgeDetail() {
  const t = useTranslations("knowledge.detail");
  const tList = useTranslations("knowledge");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("agents.manage");
  const params = useParams<{ id: string }>();
  const source = useKnowledgeById(params.id);
  const agents = useAgents();
  const link = useLinkKnowledgeAgent();
  const unlink = useUnlinkKnowledgeAgent();
  const del = useDeleteKnowledge();
  const sync = useSyncKnowledge();
  const setAuto = useSetKnowledgeAutoSync();
  const test = useTestKnowledge();
  const [question, setQuestion] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);

  if (source.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-72" /></div>;
  const s = source.data;
  if (!s) return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push("/knowledge")}>{t("backToList")}</Button>} /></Card>;

  const unlinked = (agents.data ?? []).filter((a) => !s.usedByAgentIds.includes(a.id));

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: tList("title"), href: recallListUrl("/knowledge") }, { label: s.title }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="min-w-0 flex-1 truncate text-xl font-semibold">{s.title}</h1>
        <StatusBadge entity="knowledge" value={s.status} />
        {s.status === "processing" ? <Loader2 className="text-muted-foreground size-4 animate-spin" aria-label={t("processing")} /> : null}
        {canManage ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}><Pencil aria-hidden />{t("edit")}</Button>
            <Button variant="outline" size="sm" onClick={() => sync.mutate([s.id])} disabled={sync.isPending || s.status === "processing"}><RefreshCw aria-hidden />{t("syncNow")}</Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}><Trash2 aria-hidden />{t("delete")}</Button>
          </>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="text-base">{t("info")}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {([
                [t("f.type"), tList(`types.${s.type}`)],
                [t("f.chunks"), s.status === "ready" ? formatNumber(s.chunksCount) : "—"],
                [t("f.file"), s.file ? `${s.file.name} (${formatNumber(Math.round(s.file.sizeBytes / 1024))} KB)` : "—"],
                [t("f.url"), s.url ?? "—"],
                [t("f.synced"), s.lastSyncedAt ? formatDateTime(s.lastSyncedAt, locale) : "—"],
              ] as const).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><bdi dir="auto" className="num text-end">{v}</bdi></div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t pt-2">
                <span className="text-muted-foreground">{t("f.autoSync")}</span>
                <Switch checked={s.autoSync} disabled={!canManage} onCheckedChange={(v) => setAuto.mutate([s.id, v])} aria-label={t("f.autoSync")} />
              </div>
            </CardContent>
          </Card>

          {s.type === "faq" ? (
            <Card>
              <CardHeader><CardTitle className="text-base">{t("faqTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {s.faq.map((f, i) => (
                  <div key={i} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{f.q}</p>
                    <p className="text-muted-foreground mt-1">{f.a}</p>
                  </div>
                ))}
                {!s.faq.length ? <p className="text-muted-foreground text-sm">{t("noFaq")}</p> : null}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader><CardTitle className="text-base">{t("testTitle")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (question.trim()) test.mutate([s.id, question.trim()]); }}>
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder={t("testPlaceholder")} aria-label={t("testPlaceholder")} />
                <Button type="submit" disabled={test.isPending || !question.trim() || s.status !== "ready"}><Search aria-hidden />{t("test")}</Button>
              </form>
              {test.data ? (
                <div className="space-y-2">
                  <div className="bg-muted rounded-md p-3 text-sm"><span className="text-muted-foreground">{t("answer")}: </span>{test.data.answer}</div>
                  {test.data.chunks.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-md border p-3 text-sm">
                      <Badge variant={c.score > 0.8 ? "success" : "secondary"} className="num mt-0.5 shrink-0">{formatPercent(c.score, 0)}</Badge>
                      <p className="text-muted-foreground">{c.text}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">{t("usedBy")}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {s.usedByAgentIds.map((id) => (
              <div key={id} className="flex items-center justify-between gap-2 rounded-md border p-2">
                <EntityLink type="agent" id={id} />
                {canManage ? <Button variant="ghost" size="icon" aria-label={t("unlink")} onClick={() => unlink.mutate([s.id, id])}><Trash2 className="size-4" /></Button> : null}
              </div>
            ))}
            {!s.usedByAgentIds.length ? <p className="text-muted-foreground flex items-center gap-1.5 text-sm"><Bot className="size-4" />{t("noAgents")}</p> : null}
            {canManage && unlinked.length ? (
              <Select onValueChange={(v) => link.mutate([s.id, v])}>
                <SelectTrigger aria-label={t("linkAgent")}><SelectValue placeholder={t("linkAgent")} /></SelectTrigger>
                <SelectContent>{unlinked.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <AddSourceDialog open={editOpen} onOpenChange={setEditOpen} source={s} />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("deleteTitle")}</DialogTitle><DialogDescription>{t("deleteDescription")}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>{tc("cancel")}</Button>
            <Button variant="destructive" disabled={del.isPending} onClick={() => del.mutate([s.id], { onSuccess: () => { toast.success(t("deleted")); router.push("/knowledge"); } })}>{t("confirmDelete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
