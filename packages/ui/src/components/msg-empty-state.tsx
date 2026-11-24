"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { useMsg } from "../hooks/use-msg";
import type { MsgParams } from "./msg-toast";
import { Button } from "./button";
import { EmptyState } from "./empty-state";

export interface MsgEmptyStateProps {
  /** Sub-key under `msg.empty.*` (e.g. "orders", "orders.filtered", "inbox.waiting"). */
  emptyKey: string;
  params?: MsgParams;
  icon?: LucideIcon;
  /** Custom action node; overrides `actionKey`/`onAction`. */
  action?: React.ReactNode;
  /** Render the spec'd `empty.<key>.action` label as a primary button. */
  onAction?: () => void;
  className?: string;
}

/** Empty state bound to `msg.empty.<key>.title/.body/.action` (docs/UI_MESSAGES.md §21). */
export function MsgEmptyState({ emptyKey, params, icon, action, onAction, className }: MsgEmptyStateProps) {
  const strictT = useMsg() as unknown as ((key: string, params?: MsgParams) => string) & { has: (key: string) => boolean };
  const t = strictT;
  const base = `empty.${emptyKey}`;
  const resolvedAction =
    action ??
    (onAction && t.has(`${base}.action`) ? (
      <Button onClick={onAction}>{t(`${base}.action`)}</Button>
    ) : null);
  return (
    <EmptyState
      icon={icon}
      title={t(`${base}.title`, params)}
      description={t.has(`${base}.body`) ? t(`${base}.body`, params) : undefined}
      action={resolvedAction}
      className={className}
    />
  );
}
