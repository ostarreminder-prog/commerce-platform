"use client";

import * as React from "react";
import { useMsg } from "../hooks/use-msg";
import type { MsgParams } from "./msg-toast";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** msg.* key for the title (e.g. "orders.cancel.title"). Overridden by `title`. */
  titleKey?: string;
  /** msg.* key for the body text. Overridden by `body`. */
  bodyKey?: string;
  /** msg.* key for the confirm button. Overridden by `confirmLabel`. */
  confirmKey?: string;
  title?: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  /** Interpolation values for the msg keys. */
  params?: MsgParams;
  /** Extra content between the body and the footer (checkboxes, inputs…). */
  children?: React.ReactNode;
  /** Red destructive confirm button. */
  danger?: boolean;
  /** Text the user must type to enable confirm (e.g. store name or «حذف»). */
  requireText?: string;
  /** Require a 6-digit verification code. */
  requireOtp?: boolean;
  /** Show a loading state on the confirm button and block closing. */
  pending?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  titleKey,
  bodyKey,
  confirmKey,
  params,
  title,
  body,
  confirmLabel,
  children,
  danger = false,
  requireText,
  requireOtp = false,
  pending = false,
  onConfirm,
}: ConfirmDialogProps) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: MsgParams) => string;
  const [typed, setTyped] = React.useState("");
  const [otp, setOtp] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setTyped("");
      setOtp("");
    }
  }, [open]);

  const resolvedTitle = title ?? (titleKey ? t(titleKey, params) : undefined);
  const resolvedConfirm = confirmLabel ?? (confirmKey ? t(confirmKey, params) : t("common.close"));

  const canConfirm =
    !pending &&
    (!requireText || typed.trim() === requireText.trim()) &&
    (!requireOtp || /^\d{6}$/.test(otp));

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{resolvedTitle}</DialogTitle>
          {body || bodyKey ? (
            <DialogDescription>{body ?? (bodyKey ? t(bodyKey, params) : "")}</DialogDescription>
          ) : null}
        </DialogHeader>
        {requireText || requireOtp ? (
          <div className="space-y-3">
            {requireText ? (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-text">{requireText}</Label>
                <Input
                  id="confirm-text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                />
              </div>
            ) : null}
            {requireOtp ? (
              <div className="space-y-1.5">
                <Label htmlFor="confirm-otp">{t("validation.otp.length")}</Label>
                <Input
                  id="confirm-otp"
                  dir="ltr"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  autoComplete="one-time-code"
                />
              </div>
            ) : null}
          </div>
        ) : null}
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button
            variant={danger ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={!canConfirm}
            loading={pending}
          >
            {resolvedConfirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
