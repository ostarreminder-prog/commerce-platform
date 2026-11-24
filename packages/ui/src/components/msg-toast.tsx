"use client";

import * as React from "react";
import { toast } from "./toaster";
import { useMsg } from "../hooks/use-msg";

export type MsgKey = string;
export type MsgParams = Record<string, string | number | Date>;

export interface MsgToastErrorOptions {
  /** Keeps the toast open and shows a retry action button. */
  retry?: () => void;
}

export interface MsgToast {
  success: (key: MsgKey, params?: MsgParams, opts?: { undo?: () => void }) => void;
  error: (key: MsgKey, params?: MsgParams, opts?: MsgToastErrorOptions) => void;
  info: (key: MsgKey, params?: MsgParams, opts?: { action?: { label: string; onClick: () => void } }) => void;
  /** Render a msg.* key to plain text (e.g. hints, badges, inline errors). */
  text: (key: MsgKey, params?: MsgParams) => string;
}

/**
 * Unified toast helper bound to `msg.*` keys (docs/UI_MESSAGES.md §23).
 *
 * `success` — 4s, or 8s when `undo` is provided.
 * `error`   — stays until dismissed, optional "retry" action.
 * `info`    — 6s, optional link/action.
 */
export function useMsgToast(): MsgToast {
  const strictT = useMsg();
  // msg keys are validated by convention (docs/UI_MESSAGES.md); the strict
  // NamespacedMessageKeys union differs per app, so components cast loosely.
  const t = strictT as unknown as (key: string, params?: MsgParams) => string;
  return React.useMemo<MsgToast>(
    () => ({
      success: (key, params, opts) => {
        toast.success(t(key, params), {
          duration: opts?.undo ? 8000 : 4000,
          action: opts?.undo ? { label: t("common.undo"), onClick: opts.undo } : undefined,
        });
      },
      error: (key, params, opts) => {
        toast.error(t(key, params), {
          duration: Infinity,
          action: opts?.retry ? { label: t("common.retry"), onClick: opts.retry } : undefined,
        });
      },
      info: (key, params, opts) => {
        toast.info(t(key, params), { duration: 6000, action: opts?.action });
      },
      text: (key, params) => t(key, params),
    }),
    [t],
  );
}
