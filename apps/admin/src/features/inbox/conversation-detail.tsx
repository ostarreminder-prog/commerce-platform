"use client";

import * as React from "react";
import { Bot, ChevronLeft, MoreHorizontal, RotateCcw, Search, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useAssignConversation, useConversationById,
  useReturnConversationToAgent, useSetConversationPriority, useSetConversationStatus,
  useTakeOverConversation,
} from "@repo/api-client";
import type { Conversation } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { cn } from "@repo/ui/lib/cn";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";
import { MessageBubble } from "./message-bubble";
import { PRIORITIES, displayName } from "./inbox-utils";
import { Composer } from "./composer";
import { ThreadSidebar } from "./thread-sidebar";

export function ConversationDetail({ id }: { id: string }) {
  const t = useTranslations("inbox");
  const tc = useTranslations("common");
  const router = useStoreRouter();
  const canReply = useCan("conversations.reply");
  const conv = useConversationById(id);
  const mt = useMsgToast();
  const takeOver = useTakeOverConversation();
  const returnToAgent = useReturnConversationToAgent();
  const setStatus = useSetConversationStatus();
  const assign = useAssignConversation();
  const setPriority = useSetConversationPriority();
  const [resolveOpen, setResolveOpen] = React.useState(false);
  const [threadQuery, setThreadQuery] = React.useState<string | null>(null);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  const c = conv.data;
  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "instant" }); }, [c?.messages.length]);

  if (conv.isPending) return <div className="flex-1 space-y-3 p-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-full" /></div>;
  if (!c) return <div className="flex-1 p-4"><Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push(recallListUrl("/inbox"))}>{t("backToList")}</Button>} /></Card></div>;

  const currentAgent = c.currentAgentId ?? c.agentPath.at(-1) ?? null;
  const q = threadQuery?.trim().toLowerCase() ?? "";
  const matchIds = q ? new Set(c.messages.filter((m) => m.content.toLowerCase().includes(q)).map((m) => m.id)) : null;
  const reopenable = c.status === "resolved" || c.status === "closed";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* header */}
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => router.push(recallListUrl("/inbox"))} aria-label={t("backToList")}><ChevronLeft className="size-4 rtl:rotate-180" /></Button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {c.customerId ? <EntityLink type="customer" id={c.customerId} label={displayName(c)} className="font-medium" /> : <span className="font-medium">{displayName(c)}</span>}
            <StatusBadge entity="conversation" value={c.status} />
          </div>
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <bdi dir="ltr" className="num">{c.contact.phone}</bdi> · {t(`channels.${c.channel}`)}
            {currentAgent ? <> · <EntityLink type="agent" id={currentAgent} /></> : null}
          </p>
        </div>
        <Select value={c.priority} onValueChange={(v) => setPriority.mutate([id, v as Conversation["priority"]])}>
          <SelectTrigger className="h-8 w-28" aria-label={t("priority")}><SelectValue /></SelectTrigger>
          <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{t(`priorities.${p}`)}</SelectItem>)}</SelectContent>
        </Select>
        {reopenable ? (
          canReply ? <Button size="sm" variant="outline" onClick={() => setStatus.mutate([id, "open_human"], { onSuccess: () => mt.success("inbox.reopened") })} disabled={setStatus.isPending}><RotateCcw aria-hidden />{t("reopen")}</Button> : null
        ) : null}
        {c.status === "waiting_human" || c.status === "open_ai" ? (
          canReply ? <Button size="sm" onClick={() => takeOver.mutate([id], { onSuccess: () => mt.info("inbox.takeover.confirm") })} disabled={takeOver.isPending}><UserRound aria-hidden />{t("takeOver")}</Button> : null
        ) : null}
        {c.status === "open_human" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => returnToAgent.mutate([id], { onSuccess: () => mt.success("inbox.returnToAgent.success", { agent: "" }) })} disabled={returnToAgent.isPending}><Bot aria-hidden />{t("returnToAgent")}</Button>
            <Button size="sm" variant="outline" onClick={() => setResolveOpen(true)}>{t("resolve")}</Button>
          </>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={tc("actions")}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setResolveOpen(true)}>{t("resolve")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setStatus.mutate([id, "closed"], { onSuccess: () => mt.success("inbox.resolved") })}>{t("close")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => assign.mutate([id, null])} disabled={!c.assigneeId}>{t("unassign")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* thread */}
        <div className="flex min-w-0 flex-1 flex-col">
          {threadQuery !== null ? (
            <div className="flex items-center gap-2 border-b px-3 py-2">
              <Search className="text-muted-foreground size-3.5" aria-hidden />
              <Input
                value={threadQuery}
                onChange={(e) => setThreadQuery(e.target.value)}
                placeholder={t("searchThread")}
                aria-label={t("searchThread")}
                className="h-7 flex-1 text-xs"
                ref={(el) => el?.focus()}
              />
              <span className="num text-muted-foreground text-xs">{matchIds?.size ?? 0}</span>
              <Button variant="ghost" size="icon" className="size-7" aria-label={tc("cancel")} onClick={() => setThreadQuery(null)}>
                <X className="size-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex justify-end border-b px-2 py-1">
              <Button variant="ghost" size="icon" className="size-7" aria-label={t("searchThread")} onClick={() => setThreadQuery("")}>
                <Search className="size-3.5" />
              </Button>
            </div>
          )}
          <ScrollArea className="min-h-0 flex-1 p-4">
            <div className="space-y-3">
              {c.messages.map((m) => (
                <div key={m.id} className={cn(matchIds && (matchIds.has(m.id) ? "ring-primary/50 rounded-md ring-2" : "opacity-50"))}>
                  <MessageBubble m={m} />
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <Composer c={c} canReply={canReply} />
        </div>

        <ThreadSidebar c={c} />
      </div>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("resolveTitle")}</DialogTitle><DialogDescription>{t("resolveDescription")}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>{tc("cancel")}</Button>
            <Button disabled={setStatus.isPending} onClick={() => setStatus.mutate([id, "resolved"], { onSuccess: () => { mt.success("inbox.resolved"); setResolveOpen(false); } })}>{t("resolve")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
