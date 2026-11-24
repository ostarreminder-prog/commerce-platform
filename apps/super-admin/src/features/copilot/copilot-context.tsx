"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { commerce, studio } from "@repo/api-client";
import { PLATFORM_PERMISSIONS } from "@repo/contracts";
import {
  executeAction,
  executeStep,
  runCopilot,
  type ChatMessage,
  type CopilotContext,
  type CopilotResponse,
  type PlannedStep,
} from "@repo/copilot";
import { CopilotViewProvider, type CopilotChatMessage, type CopilotRefLike, type CopilotView } from "@repo/copilot/ui";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useMsg } from "@repo/ui/hooks/use-msg";

let seq = 0;
const uid = (p: string) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Platform copilot provider — actor "platform", api surface is
 * `commerce.platform`; merchant namespaces still injected (commerce mock)
 * so the engine's typed surface stays complete.
 */
export function CopilotProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const qc = useQueryClient();
  const mt = useMsgToast();
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;

  const [open, setOpen] = React.useState(false);
  const [thinking, setThinking] = React.useState(false);
  const [messages, setMessages] = React.useState<CopilotChatMessage[]>([]);
  const [done, setDone] = React.useState<ReadonlySet<string>>(new Set());

  const ctx = React.useMemo<CopilotContext>(
    () => ({
      actor: "platform",
      storeId: "platform",
      userName: t("copilot.platformOwner"),
      /* Platform actor = مالك المنصة — carries the full platform-role set. */
      permissions: new Set<string>(PLATFORM_PERMISSIONS),
      api: {
        ...commerce,
        agents: studio,
        platform: commerce.platform,
      },
      ui: {
        navigate: (route) => router.push(route),
        highlight: (selector) => {
          const el = document.querySelector(selector);
          if (!el) return;
          el.classList.add("copilot-highlight");
          window.setTimeout(() => el.classList.remove("copilot-highlight"), 3000);
        },
        openDialog: (name) => window.dispatchEvent(new CustomEvent("copilot:open-dialog", { detail: name })),
        fillForm: (formId, values) =>
          window.dispatchEvent(new CustomEvent("copilot:fill-form", { detail: { formId, values } })),
      },
    }),
    [router, t],
  );

  const append = React.useCallback((msg: CopilotChatMessage) => setMessages((list) => [...list, msg]), []);

  const send = React.useCallback(
    (raw: string, refs?: CopilotRefLike[]) => {
      const text = raw.trim();
      if (!text) return;
      append({ id: uid("m"), role: "user", text, refs, createdAt: new Date().toISOString() });
      setThinking(true);
      const history = messages as ChatMessage[];
      runCopilot(text, ctx, history)
        .then((response: CopilotResponse) =>
          append({ id: uid("m"), role: "assistant", response, createdAt: new Date().toISOString() }),
        )
        .catch(() => {
          mt.error("copilot.error");
          append({ id: uid("m"), role: "assistant", response: { kind: "text", text: t("copilot.error") }, createdAt: new Date().toISOString() });
        })
        .finally(() => setThinking(false));
    },
    [append, ctx, mt, t, messages],
  );

  const markDone = React.useCallback((id: string) => setDone((set) => new Set(set).add(id)), []);
  const isDone = React.useCallback((id: string) => done.has(id), [done]);

  const execute = React.useCallback(
    async (actionId: string) => {
      try {
        const response = await executeAction(actionId, ctx);
        markDone(actionId);
        append({ id: uid("m"), role: "assistant", response, createdAt: new Date().toISOString() });
        void qc.invalidateQueries();
        mt.success("copilot.done");
      } catch {
        mt.error("copilot.error");
      }
    },
    [append, ctx, markDone, mt, qc],
  );

  const runStep = React.useCallback(
    async (step: PlannedStep) => {
      const next = await executeStep(step, ctx);
      if (next.status === "done") void qc.invalidateQueries();
      return next;
    },
    [ctx, qc],
  );

  const undoResult = React.useCallback(() => mt.info("copilot.undoUnavailable"), [mt]);

  const pendingCount = messages.filter(
    (m) =>
      m.response &&
      ((m.response.kind === "action" && !done.has(m.response.actionId)) ||
        (m.response.kind === "plan" && !done.has(m.id))),
  ).length;

  const view = React.useMemo<CopilotView>(
    () => ({
      open, setOpen, messages, thinking, readOnly: false, pendingCount,
      send, execute, runStep, markDone, isDone, undoResult,
    }),
    [open, messages, thinking, pendingCount, send, execute, runStep, markDone, isDone, undoResult],
  );

  return <CopilotViewProvider value={view}>{children}</CopilotViewProvider>;
}
