"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { commerce, keys, useCopilotConversations, useMe } from "@repo/api-client";
import { useStoreSlug } from "@/lib/store-route";
import { blankConversation } from "./selection";
import { fromRecord, mergeRecord, toRecord } from "./copilot-storage";
import type { CopilotConversation, UiChatMessage } from "./types";

/**
 * Conversation list state backed by commerce.copilotConversations:
 * hydrates on mount, persists after every assistant reply, honors ?c=<id>
 * (foreign shared conversations open read-only), and keeps pin/share edits
 * from /copilot/history in sync on every refetch.
 */
export function useConversationStore() {
  const slug = useStoreSlug();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const { data: storedConvs } = useCopilotConversations();
  const sharedId = useSearchParams().get("c");

  const [conversations, setConversations] = React.useState<CopilotConversation[]>(() => [blankConversation()]);
  const [activeId, setActiveId] = React.useState(() => conversations[0]?.id ?? "");
  const ref = React.useRef(conversations);
  ref.current = conversations;

  /* Persist the conversation to the mock endpoint — skipped for read-only
   * (foreign shared) threads and empty drafts. */
  const persist = React.useCallback(
    (conv: CopilotConversation) => {
      if (conv.readOnly || !conv.messages.length || !me) return;
      void commerce.copilotConversations.save(toRecord(conv, slug, me.id)).then(() => {
        void qc.invalidateQueries({ queryKey: keys.copilotConversations });
      });
    },
    [slug, me, qc],
  );

  React.useEffect(() => {
    if (!storedConvs || !me) return;
    setConversations((list) => {
      const next = [...list];
      for (const r of storedConvs) {
        const i = next.findIndex((c) => c.id === r.id);
        if (i < 0) next.push(fromRecord(r, me.id));
        else next[i] = mergeRecord(next[i], r, me.id);
      }
      return next;
    });
  }, [storedConvs, me]);

  /* ?c=<id> — open a shared conversation (read-only when owned by someone
   * else). Re-runs on client navigation since the provider persists across
   * dashboard routes. */
  React.useEffect(() => {
    if (!sharedId) return;
    if (ref.current.some((x) => x.id === sharedId)) {
      setActiveId(sharedId);
      return;
    }
    void commerce.copilotConversations
      .get(sharedId)
      .then((r) => {
        const conv = fromRecord(r, me?.id);
        setConversations((list) => (list.some((x) => x.id === conv.id) ? list : [...list, conv]));
        setActiveId(conv.id);
      })
      .catch(() => {});
  }, [sharedId, me?.id]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const messages = React.useMemo(() => activeConv?.messages ?? [], [activeConv]);

  const append = React.useCallback(
    (msg: UiChatMessage) => {
      const cur = ref.current.find((c) => c.id === activeId);
      if (!cur) return;
      const next: CopilotConversation = {
        ...cur,
        title: cur.title || (msg.role === "user" && msg.text ? msg.text.slice(0, 40) : cur.title),
        messages: [...cur.messages, msg],
        updatedAt: new Date().toISOString(),
      };
      setConversations((list) => list.map((c) => (c.id === activeId ? next : c)));
      if (msg.role === "assistant") persist(next);
    },
    [activeId, persist],
  );

  const startConversation = React.useCallback(() => {
    const conv = blankConversation();
    setConversations((list) => [conv, ...list]);
    setActiveId(conv.id);
  }, []);

  const selectConversation = React.useCallback((id: string) => setActiveId(id), []);
  const isReadOnly = React.useCallback(() => ref.current.find((c) => c.id === activeId)?.readOnly ?? false, [activeId]);
  const history = React.useCallback(
    () => (ref.current.find((c) => c.id === activeId)?.messages ?? []),
    [activeId],
  );

  return React.useMemo(
    () => ({
      conversations,
      activeId,
      activeConv,
      messages,
      append,
      startConversation,
      selectConversation,
      isReadOnly,
      history,
    }),
    [conversations, activeId, activeConv, messages, append, startConversation, selectConversation, isReadOnly, history],
  );
}
