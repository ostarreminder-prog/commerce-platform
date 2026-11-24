"use client";

import * as React from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useApprovals, useDecideApproval } from "@repo/api-client";
import type { AgentApproval } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Textarea } from "@repo/ui/components/textarea";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/toaster";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime, formatMoney, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { useUrlState } from "@/lib/url-state";

const ACTIONS: AgentApproval["action"][] = ["cancel_order", "refund", "discount_above_limit"];
const TABS = ["pending", "decided", "all"] as const;

function ApprovalCard({ a, highlight }: { a: AgentApproval; highlight: boolean }) {
  const t = useTranslations("approvals");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const canManage = useCan("approvals.decide");
  const decide = useDecideApproval();
  const mt = useMsgToast();
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const pending = a.status === "pending";
  const expiredSoon = pending && new Date(a.expiresAt).getTime() - Date.now() < 30 * 60_000;

  return (
    <Card id={a.id} className={cn(highlight && "ring-primary ring-2")}>
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {a.agentId === "copilot" ? (
              <Badge variant="secondary" className="font-normal">{t("agentCopilot")}</Badge>
            ) : (
              <EntityLink type="agent" id={a.agentId} />
            )}
            <span className="text-sm">{t.has(`actions.${a.action}`) ? t(`actions.${a.action}`) : a.action}</span>
            {a.amount ? <span className="num font-medium">{formatMoney(a.amount.amount, locale)}</span> : null}
            <StatusBadge entity="approval" value={a.status} />
            {expiredSoon ? <Badge variant="warning" className="font-normal">{t("expiresSoon")}</Badge> : null}
          </div>
          <p className="text-muted-foreground text-sm">{a.reason}</p>
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
            <span>{t("target")}: <EntityLink type={a.target.type} id={a.target.id} /></span>
            <span>{t("inConversation")}: <EntityLink type="conversation" id={a.conversationId} /></span>
            <span className="num">{formatRelativeTime(a.createdAt, locale, NOW)}</span>
            {pending ? <span className="num">{t("expires", { time: formatRelativeTime(a.expiresAt, locale, NOW) })}</span> : null}
            {!pending && a.decidedBy ? <span>{t("decidedAt", { time: a.decidedAt ? formatDateTime(a.decidedAt, locale) : "—" })}</span> : null}
          </p>
        </div>
        {pending && canManage ? (
          <div className="flex gap-2">
            <Button size="sm" disabled={decide.isPending} onClick={() => decide.mutate([a.id, "approved"], { onSuccess: () => mt.success("approvals.approve.success"), onError: () => toast.error(t("failed")) })}><Check aria-hidden />{t("approve")}</Button>
            <Button size="sm" variant="outline" onClick={() => setRejectOpen(true)}><X aria-hidden />{t("reject")}</Button>
          </div>
        ) : null}
      </CardContent>
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("rejectTitle")}</DialogTitle><DialogDescription>{t("rejectDescription")}</DialogDescription></DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rej-reason">{mt.text("approvals.reject.reason")}</Label>
            <Textarea id="rej-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>{tc("cancel")}</Button>
            <Button variant="destructive" disabled={decide.isPending} onClick={() => decide.mutate([a.id, "rejected", reason], { onSuccess: () => { mt.success("approvals.reject.success"); setRejectOpen(false); }, onError: () => toast.error(t("failed")) })}>{t("confirmReject")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function ApprovalsView() {
  const t = useTranslations("approvals");
  const approvals = useApprovals();
  const searchParams = useSearchParams();
  const focusId = searchParams.get("id");
  const [f, set] = useUrlState({ tab: "pending", action: "all" });

  React.useEffect(() => {
    if (focusId) document.getElementById(focusId)?.scrollIntoView({ block: "center" });
  }, [focusId, approvals.isSuccess]);

  const filtered = (approvals.data ?? []).filter((a) => {
    if (f.tab === "pending" && a.status !== "pending") return false;
    if (f.tab === "decided" && (a.status === "pending" || a.status === "expired")) return false;
    if (f.action !== "all" && a.action !== f.action) return false;
    return true;
  });
  const pendingCount = (approvals.data ?? []).filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border p-0.5">
          {TABS.map((k) => (
            <button key={k} type="button" onClick={() => set({ tab: k })} className={cn("rounded px-3 py-1 text-sm", f.tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
              {t(`tabs.${k}`)}{k === "pending" && pendingCount ? <span className="num ms-1">({pendingCount})</span> : null}
            </button>
          ))}
        </div>
        <select
          value={f.action}
          onChange={(e) => set({ action: e.target.value })}
          aria-label={t("filters.action")}
          className="bg-background h-9 rounded-md border px-3 text-sm"
        >
          <option value="all">{t("filters.allActions")}</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{t(`actions.${a}`)}</option>)}
        </select>
      </div>
      <DataState
        state={approvals}
        loading={<div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>}
        isEmpty={(d) => d.length === 0}
        empty={<Card><MsgEmptyState emptyKey="approvals" icon={ShieldCheck} /></Card>}
      >
        {() => filtered.length ? (
          <div className="space-y-3">{filtered.map((a) => <ApprovalCard key={a.id} a={a} highlight={a.id === focusId} />)}</div>
        ) : <Card><EmptyState icon={ShieldCheck} title={t("emptyFilterTitle")} description={t("emptyFilterDescription")} /></Card>}
      </DataState>
    </div>
  );
}
