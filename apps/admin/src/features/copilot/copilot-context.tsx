"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  executeAction,
  executeStep,
  runCopilot,
  undoLastAction,
  type ChatMessage,
  type CopilotResponse,
  type PlannedStep,
} from "@repo/copilot";
import { CopilotViewProvider, type CopilotRefLike, type CopilotView } from "@repo/copilot/ui";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useCopilotEngineContext } from "./engine-context";
import { useConversationStore } from "./conversation-store";
import { registerSelectionSetter, uid } from "./selection";
import type { CopilotConversation, CopilotEntityRef, UiChatMessage } from "./types";

export { setCopilotSelection } from "./selection";

interface CopilotValue {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  messages: UiChatMessage[];
  thinking: boolean;
  /** Append a user message and run the mock engine. Mentioned entities are forwarded as context hints. */
  send: (text: string, refs?: CopilotRefLike[]) => void;
  /** Open the panel (when closed) and send — used by the command palette. */
  ask: (text: string) => void;
  execute: (actionId: string) => Promise<void>;
  runStep: (step: PlannedStep) => Promise<PlannedStep>;
  /** Marks an action/plan as handled — drives the topbar pending badge. */
  markDone: (id: string) => void;
  isDone: (id: string) => boolean;
  pendingCount: number;
  undoResult: () => void;
  selection: CopilotEntityRef[];
  setSelection: (entities: CopilotEntityRef[]) => void;
  conversations: CopilotConversation[];
  activeId: string;
  selectConversation: (id: string) => void;
  startConversation: () => void;
}

const CopilotCtx = React.createContext<CopilotValue | null>(null);

export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const mt = useMsgToast();
  const store = useConversationStore();

  const [open, setOpen] = React.useState(false);
  const [thinking, setThinking] = React.useState(false);
  const [selection, setSelection] = React.useState<CopilotEntityRef[]>([]);
  const [done, setDone] = React.useState<ReadonlySet<string>>(new Set());

  /* Register the selection stub + hydrate from any pre-set window value. */
  React.useEffect(() => {
    registerSelectionSetter(setSelection);
    if (window.__copilotSelection?.length) setSelection(window.__copilotSelection);
    return () => registerSelectionSetter(null);
  }, []);

  const ctx = useCopilotEngineContext(store.activeId);

  const send = React.useCallback(
    (raw: string, refs?: CopilotRefLike[]) => {
      const text = raw.trim();
      if (!text || store.isReadOnly()) return;
      store.append({ id: uid("m"), role: "user", text, refs, createdAt: new Date().toISOString() });
      setThinking(true);
      runCopilot(text, ctx, store.history() as ChatMessage[])
        .then((response: CopilotResponse) =>
          store.append({ id: uid("m"), role: "assistant", response, createdAt: new Date().toISOString() }),
        )
        .catch(() => {
          mt.error("copilot.error", undefined, { retry: () => send(raw, refs) });
          store.append({
            id: uid("m"),
            role: "assistant",
            response: { kind: "text", text: mt.text("copilot.error") },
            createdAt: new Date().toISOString(),
          });
        })
        .finally(() => setThinking(false));
    },
    [store, ctx, mt],
  );

  const ask = React.useCallback(
    (text: string) => {
      setOpen(true);
      send(text);
    },
    [send],
  );

  const markDone = React.useCallback((id: string) => setDone((set) => new Set(set).add(id)), []);
  const isDone = React.useCallback((id: string) => done.has(id), [done]);

  const executeActionById = React.useCallback(
    async (actionId: string) => {
      try {
        const response = await executeAction(actionId, ctx);
        markDone(actionId);
        store.append({ id: uid("m"), role: "assistant", response, createdAt: new Date().toISOString() });
        void qc.invalidateQueries();
        mt.success("copilot.done");
      } catch {
        mt.error("copilot.error");
      }
    },
    [store, ctx, markDone, mt, qc],
  );

  const runStep = React.useCallback(
    async (step: PlannedStep) => {
      const next = await executeStep(step, ctx);
      if (next.status === "done") void qc.invalidateQueries();
      return next;
    },
    [ctx, qc],
  );

  const undoResult = React.useCallback(() => {
    void undoLastAction(ctx)
      .then((ran) => {
        if (!ran) return mt.info("copilot.undoUnavailable");
        void qc.invalidateQueries();
        mt.success("copilot.undoDone");
      })
      .catch(() => mt.error("copilot.error"));
  }, [ctx, mt, qc]);

  const { messages } = store;
  const pendingCount = messages.filter(
    (m) =>
      m.response &&
      ((m.response.kind === "action" && !done.has(m.response.actionId)) ||
        (m.response.kind === "plan" && !done.has(m.id))),
  ).length;

  const value = React.useMemo<CopilotValue>(
    () => ({
      open,
      setOpen,
      messages,
      thinking,
      send,
      ask,
      execute: executeActionById,
      runStep,
      markDone,
      isDone,
      pendingCount,
      undoResult,
      selection,
      setSelection,
      conversations: store.conversations,
      activeId: store.activeId,
      selectConversation: store.selectConversation,
      startConversation: store.startConversation,
    }),
    [
      open, messages, thinking, send, ask, executeActionById, runStep, markDone, isDone,
      pendingCount, undoResult, selection, store,
    ],
  );

  /* The shared copilot UI consumes a minimal view contract — a subset of the
   * value above (same shape the platform provider produces). */
  const view = React.useMemo<CopilotView>(
    () => ({
      open,
      setOpen,
      messages,
      thinking,
      readOnly: store.activeConv?.readOnly ?? false,
      pendingCount,
      send,
      execute: executeActionById,
      runStep,
      markDone,
      isDone,
      undoResult,
    }),
    [open, messages, thinking, store.activeConv?.readOnly, pendingCount, send, executeActionById, runStep, markDone, isDone, undoResult],
  );

  return (
    <CopilotCtx.Provider value={value}>
      <CopilotViewProvider value={view}>{children}</CopilotViewProvider>
    </CopilotCtx.Provider>
  );
}

export function useCopilot() {
  const value = React.useContext(CopilotCtx);
  if (!value) throw new Error("useCopilot must be used inside CopilotProvider");
  return value;
}
