"use client";

import { History, ListTodo, Lock, MessagesSquare, Pin, Plus, Share2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import Link from "@/components/store-link";
import { ChatView } from "./chat-view";
import { ContextStrip } from "./context-strip";
import { useCopilot } from "./copilot-context";
import { SecurityBar } from "./security-bar";

/** Full-page copilot — saved-conversation sidebar + the shared chat body. */
export function CopilotPage() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const copilot = useCopilot();

  /* Pinned first, then most recently updated — the local blank chat floats to
   * the top while it has no messages. */
  const conversations = [...copilot.conversations].sort((a, b) => {
    if (!a.messages.length !== !b.messages.length) return a.messages.length ? 1 : -1;
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt);
  });

  return (
    <div className="flex h-[calc(100dvh-10rem)] gap-4">
      <aside className="bg-card hidden w-64 shrink-0 flex-col rounded-lg border sm:flex">
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <p className="text-sm font-semibold">{t("copilot.conversations")}</p>
          <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={copilot.startConversation}>
            <Plus className="size-3.5" aria-hidden />
            {t("copilot.newChat")}
          </Button>
        </div>
        <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <li key={conv.id}>
              <button
                type="button"
                onClick={() => copilot.selectConversation(conv.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-start text-sm transition-colors",
                  conv.id === copilot.activeId ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
                )}
              >
                <MessagesSquare className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{conv.title || t("copilot.newChat")}</span>
                {conv.readOnly ? (
                  <Lock className="text-muted-foreground size-3 shrink-0" aria-hidden />
                ) : conv.pinned ? (
                  <Pin className="text-primary size-3 shrink-0" aria-hidden />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
        <div className="text-muted-foreground space-y-1.5 border-t p-3 text-xs">
          <Link href="/copilot/history" className="flex items-center gap-1.5 font-medium hover:underline">
            <History className="size-3.5" aria-hidden />
            {t("copilot.history")}
          </Link>
          <Link href="/copilot/tasks" className="flex items-center gap-1.5 font-medium hover:underline">
            <ListTodo className="size-3.5" aria-hidden />
            {t("copilot.tasksLink")}
          </Link>
          <p className="flex items-center gap-1.5 pt-1">
            <Share2 className="size-3" aria-hidden />
            {t("copilot.sharedHint")}
          </p>
        </div>
      </aside>
      <section className="bg-card flex min-w-0 flex-1 flex-col rounded-lg border">
        <SecurityBar />
        <ContextStrip />
        <ChatView focusOnMount />
      </section>
    </div>
  );
}
