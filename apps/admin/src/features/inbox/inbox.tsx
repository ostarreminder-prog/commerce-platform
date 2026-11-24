"use client";

import * as React from "react";
import { Inbox as InboxIcon, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useConversationList } from "@repo/api-client";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Input } from "@repo/ui/components/input";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { ConversationDetail } from "./conversation-detail";
import { ConversationRow } from "./conversation-row";
import { CHANNELS, STATUSES, displayName } from "./inbox-utils";

export function InboxScreen() {
  const t = useTranslations("inbox");
  const params = useParams<{ conversationId?: string }>();
  const convId = params.conversationId;
  const [f, set] = useUrlState({ status: "all", channel: "all", assignee: "all", product: "", q: "" });
  const list = useConversationList();
  useScrollRestore(!convId && list.isSuccess);
  React.useEffect(() => { if (!convId) rememberListUrl("/inbox", `/inbox${window.location.search}`); }, [f, convId]);

  const q = f.q.trim().toLowerCase();
  const visible = (list.data ?? []).filter((c) => {
    if (f.status !== "all" && c.status !== f.status) return false;
    if (f.channel !== "all" && c.channel !== f.channel) return false;
    if (f.assignee === "agents" && !c.currentAgentId) return false;
    if (f.assignee === "humans" && !c.assigneeId) return false;
    if (f.assignee === "unassigned" && (c.assigneeId || c.currentAgentId)) return false;
    /* `/inbox?product=<id>` — conversations that mention the product (product_card ref). */
    if (f.product && !c.messages.some((m) => m.ref?.type === "product" && m.ref.id === f.product)) return false;
    if (!q) return true;
    const digits = q.replace(/\D/g, "");
    return displayName(c).toLowerCase().includes(q) || (digits.length >= 3 && c.contact.phone.replace(/\D/g, "").includes(digits)) || c.messages.some((m) => m.content.toLowerCase().includes(q));
  });
  const counts = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const c of list.data ?? []) m.set(c.status, (m.get(c.status) ?? 0) + 1);
    return m;
  }, [list.data]);

  const listPanel = (
    <div className={cn("flex h-full flex-col", convId && "hidden lg:flex lg:w-[380px] lg:shrink-0 lg:border-e")}>
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
        </div>
        <div className="no-scrollbar -mx-3 flex gap-1 overflow-x-auto px-3">
          <button type="button" onClick={() => set({ status: "all" })} className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs", f.status === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {t("filters.all")} <span className="num">{formatNumber(list.data?.length ?? 0)}</span>
          </button>
          {STATUSES.map((s) => (
            <button key={s} type="button" onClick={() => set({ status: s })} className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs", f.status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {t(`statuses.${s}`)} <span className="num">{formatNumber(counts.get(s) ?? 0)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Select value={f.channel} onValueChange={(v) => set({ channel: v })}>
            <SelectTrigger className="h-8 flex-1" aria-label={t("filters.channel")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allChannels")}</SelectItem>
              {CHANNELS.map((c) => <SelectItem key={c} value={c}>{t(`channels.${c}`)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={f.assignee} onValueChange={(v) => set({ assignee: v })}>
            <SelectTrigger className="h-8 flex-1" aria-label={t("filters.assignee")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.everyone")}</SelectItem>
              <SelectItem value="agents">{t("filters.agents")}</SelectItem>
              <SelectItem value="humans">{t("filters.humans")}</SelectItem>
              <SelectItem value="unassigned">{t("filters.unassigned")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <DataState
          state={list}
          loading={<div className="space-y-3 p-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>}
          isEmpty={(d) => d.length === 0}
          empty={<MsgEmptyState emptyKey="inbox" icon={InboxIcon} />}
        >
          {() => visible.length
            ? visible.map((c) => <ConversationRow key={c.id} c={c} active={c.id === convId} />)
            : <EmptyState icon={Search} title={t("noResults")} description={t("noResultsHint")} />}
        </DataState>
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex h-[calc(100dvh-8rem)] flex-col">
      {!convId ? <h1 className="mb-3 text-xl font-semibold">{t("title")}</h1> : null}
      <div className="bg-card flex min-h-0 flex-1 overflow-hidden rounded-lg border">
        {listPanel}
        {convId ? <ConversationDetail id={convId} /> : (
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <EmptyState icon={InboxIcon} title={t("pickTitle")} description={t("pickDescription")} />
          </div>
        )}
      </div>
    </div>
  );
}
