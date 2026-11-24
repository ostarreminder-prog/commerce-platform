"use client";

import * as React from "react";
import { ArrowUpLeft, History, Link2, Lock, Pin, PinOff, Search, Trash2 } from "lucide-react";
import {
  useCopilotConversations,
  useDeleteCopilotConversation,
  useMe,
  usePinCopilotConversation,
  useShareCopilotConversation,
} from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { Input } from "@repo/ui/components/input";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import Link from "@/components/store-link";
import { useStoreHref } from "@/lib/store-route";

const firstLine = (messages: { role: string; text?: string }[]) => messages.find((m) => m.role === "user")?.text ?? "";

/** /copilot/history — persisted conversations: search, pin, share-link copy, delete. */
export function CopilotHistoryView() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const { locale } = useAppLocale();
  const mt = useMsgToast();
  const scope = useStoreHref();
  const { data: me } = useMe();

  const { data: conversations } = useCopilotConversations();
  const pin = usePinCopilotConversation();
  const share = useShareCopilotConversation();
  const remove = useDeleteCopilotConversation();

  const [query, setQuery] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (conversations ?? [])
      .map((c) => ({ ...c, displayTitle: c.title || firstLine(c.messages) || c.id }))
      .filter((c) => !q || c.displayTitle.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    return list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [conversations, query]);

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(locale === "en" ? "en" : "ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}${scope(`/copilot?c=${id}`)}`;
    share.mutate([id, true], {
      onSuccess: () => {
        void navigator.clipboard
          .writeText(url)
          .then(() => mt.success("copilot.historyPage.shared"))
          .catch(() => mt.info("copilot.historyPage.shareLink", { link: url }));
      },
      onError: () => mt.error("copilot.error"),
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t("copilot.historyPage.title")} description={t("copilot.historyPage.subtitle")} />
      <div className="relative max-w-72">
        <Search className="text-muted-foreground absolute start-2.5 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("copilot.historyPage.search")} className="ps-9" />
      </div>
      {conversations && filtered.length === 0 ? (
        <MsgEmptyState emptyKey={query ? "copilot.historyFiltered" : "copilot.history"} icon={History} />
      ) : (
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("copilot.historyPage.colTitle")}</TableHead>
                <TableHead>{t("copilot.historyPage.colUpdated")}</TableHead>
                <TableHead>{t("copilot.historyPage.colMessages")}</TableHead>
                <TableHead>{t("copilot.historyPage.colActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((conv) => {
                const foreign = conv.shared && me && conv.ownerId !== me.id;
                return (
                  <TableRow key={conv.id}>
                    <TableCell className="max-w-72">
                      <div className="flex items-center gap-1.5">
                        {conv.pinned ? <Pin className="text-primary size-3 shrink-0" aria-hidden /> : null}
                        {foreign ? <Lock className="text-muted-foreground size-3 shrink-0" aria-hidden /> : null}
                        <Link href={`/copilot?c=${conv.id}`} className="text-primary truncate font-medium hover:underline">
                          {conv.displayTitle}
                        </Link>
                      </div>
                      {conv.shared ? <p className="text-muted-foreground mt-0.5 text-xs">{t("copilot.historyPage.sharedBadge")}</p> : null}
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap text-xs">{fmt(conv.updatedAt)}</TableCell>
                    <TableCell className="num text-muted-foreground">{conv.messages.length}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8" aria-label={t("copilot.historyPage.open")} asChild>
                              <Link href={`/copilot?c=${conv.id}`}>
                                <ArrowUpLeft className="size-3.5 rtl:-scale-x-100" aria-hidden />
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("copilot.historyPage.open")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("size-8", conv.pinned && "text-primary")}
                              aria-label={conv.pinned ? t("copilot.historyPage.unpin") : t("copilot.historyPage.pin")}
                              onClick={() => pin.mutate([conv.id, !conv.pinned], { onError: () => mt.error("copilot.error") })}
                            >
                              {conv.pinned ? <PinOff className="size-3.5" aria-hidden /> : <Pin className="size-3.5" aria-hidden />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{conv.pinned ? t("copilot.historyPage.unpin") : t("copilot.historyPage.pin")}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label={t("copilot.historyPage.share")}
                              disabled={share.isPending}
                              onClick={() => copyShareLink(conv.id)}
                            >
                              <Link2 className="size-3.5" aria-hidden />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{t("copilot.historyPage.share")}</TooltipContent>
                        </Tooltip>
                        {!foreign ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive size-8"
                                aria-label={t("copilot.historyPage.delete")}
                                onClick={() => setPendingDelete(conv.id)}
                              >
                                <Trash2 className="size-3.5" aria-hidden />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{t("copilot.historyPage.delete")}</TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        titleKey="copilot.historyPage.deleteTitle"
        bodyKey="copilot.historyPage.deleteBody"
        confirmKey="copilot.historyPage.delete"
        danger
        onConfirm={() =>
          pendingDelete &&
          remove.mutate([pendingDelete], {
            onSuccess: () => {
              mt.success("copilot.historyPage.deleted");
              setPendingDelete(null);
            },
            onError: () => mt.error("copilot.error"),
          })
        }
      />
    </div>
  );
}
