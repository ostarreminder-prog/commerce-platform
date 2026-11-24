"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, X } from "lucide-react";
import { cn } from "../lib/cn";
import { useMsg } from "../hooks/use-msg";
import type { MsgParams } from "./msg-toast";
import { Button } from "./button";

export type BannerVariant = "info" | "success" | "warning" | "error" | "danger";

const VARIANT_STYLES: Record<BannerVariant, { icon: React.ElementType; className: string }> = {
  info: { icon: Info, className: "border-info/30 bg-info/10 text-info" },
  success: { icon: CheckCircle2, className: "border-success/30 bg-success/10 text-success" },
  warning: { icon: AlertTriangle, className: "border-warning/30 bg-warning/10 text-warning" },
  error: { icon: AlertTriangle, className: "border-destructive/30 bg-destructive/10 text-destructive" },
  danger: { icon: ShieldAlert, className: "border-destructive bg-destructive text-destructive-foreground" },
};

export interface BannerProps {
  variant?: BannerVariant;
  /** msg.* key resolving to a single string (e.g. "billing.trial.banner"). */
  textKey?: string;
  /** msg.* key resolving to a title/body pair (`<key>.title` / `<key>.body`). */
  messageKey?: string;
  params?: MsgParams;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  /** Show an X button to dismiss (state is the caller's job). */
  onDismiss?: () => void;
  className?: string;
}

/**
 * Persistent status strip at the top of a page (docs/UI_MESSAGES.md §2).
 * Use `textKey` for single-string banners, `messageKey` for title+body pairs,
 * or pass `title`/`children` directly.
 */
export function Banner({
  variant = "info",
  textKey,
  messageKey,
  params,
  title,
  children,
  action,
  onDismiss,
  className,
}: BannerProps) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: MsgParams) => string;
  const { icon: Icon, className: variantClass } = VARIANT_STYLES[variant];

  const resolvedTitle = title ?? (messageKey ? t(`${messageKey}.title`, params) : undefined);
  const body = children ?? (textKey ? t(textKey, params) : messageKey ? t(`${messageKey}.body`, params) : null);

  return (
    <div
      role="status"
      className={cn("flex items-start gap-3 rounded-md border px-4 py-3 text-sm", variantClass, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {resolvedTitle ? <p className="font-semibold">{resolvedTitle}</p> : null}
        {body ? <p className={cn(resolvedTitle && "mt-0.5 opacity-90")}>{body}</p> : null}
        {action ? <div className="mt-2">{action}</div> : null}
      </div>
      {onDismiss ? (
        <Button variant="ghost" size="icon" className="size-7 shrink-0" onClick={onDismiss} aria-label={t("common.close")}>
          <X className="size-4" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
