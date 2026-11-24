"use client";

import * as React from "react";
import type { EntityType } from "@repo/contracts";
import type { ChatMessage, PlannedStep } from "../types";

/* Minimal view contract every app-level copilot provider satisfies.
 * Presentational components consume this — never the app context directly —
 * so the same chat surface runs in admin (store) and super-admin (platform). */

/** Entity chip data attached to a user message (mention refs from the composer). */
export interface CopilotRefLike {
  type: EntityType;
  id: string;
  label: string;
}

export type CopilotChatMessage = ChatMessage & { refs?: CopilotRefLike[] };

export interface CopilotView {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  messages: CopilotChatMessage[];
  thinking: boolean;
  /** Shared conversations (opened via ?c=<id>) render read-only for non-owners. */
  readOnly: boolean;
  pendingCount: number;
  send: (text: string, refs?: CopilotRefLike[]) => void;
  execute: (actionId: string) => Promise<void>;
  runStep: (step: PlannedStep) => Promise<PlannedStep>;
  markDone: (id: string) => void;
  isDone: (id: string) => boolean;
  undoResult: () => void;
}

const CopilotViewCtx = React.createContext<CopilotView | null>(null);

export function CopilotViewProvider({ value, children }: { value: CopilotView; children: React.ReactNode }) {
  return <CopilotViewCtx.Provider value={value}>{children}</CopilotViewCtx.Provider>;
}

export function useCopilotView(): CopilotView {
  const value = React.useContext(CopilotViewCtx);
  if (!value) throw new Error("useCopilotView must be used inside CopilotViewProvider");
  return value;
}

/** Renders response links — apps inject a router-aware link (store-scoped Link / next/link). */
export type CopilotLinkRenderer = (props: { href: string; className?: string; children: React.ReactNode }) => React.ReactNode;

export const defaultLinkRenderer: CopilotLinkRenderer = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
);
