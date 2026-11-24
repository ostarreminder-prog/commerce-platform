"use client";

import * as React from "react";
import { ShieldAlert } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { ActionButtons, ActionDetails, ExecutedStrip, type ActionResponse } from "./action-card";
import { useCopilotView } from "./view-context";

/**
 * Dangerous action card — red warning banner + requires typing the exact
 * confirm word (`requiresTextConfirm`, e.g. «حذف») before Execute enables.
 */
export function DangerActionCard({ response }: { response: ActionResponse }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  const copilot = useCopilotView();
  const [busy, setBusy] = React.useState(false);
  const [confirmText, setConfirmText] = React.useState("");
  const handled = copilot.isDone(response.actionId);
  const required = response.requiresTextConfirm ?? "";
  const confirmed = required ? confirmText.trim() === required : true;

  const run = async () => {
    setBusy(true);
    try {
      await copilot.execute(response.actionId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-destructive/50 bg-card space-y-2 rounded-lg border p-3">
      <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold">
        <ShieldAlert className="size-4 shrink-0" aria-hidden />
        {t("copilot.dangerTitle")}
      </div>
      <p className="text-sm font-semibold">{response.title}</p>
      <ActionDetails response={response} />
      {handled ? (
        <ExecutedStrip label={t("copilot.done")} />
      ) : (
        <div className="space-y-2">
          {required ? (
            <div className="space-y-1">
              <label className="text-muted-foreground block text-xs" htmlFor={`danger-${response.actionId}`}>
                {t("copilot.typeToConfirm", { word: required })}
              </label>
              <Input
                id={`danger-${response.actionId}`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="h-8 max-w-48"
                autoComplete="off"
              />
            </div>
          ) : null}
          <ActionButtons
            busy={busy}
            disabled={!confirmed}
            actionId={response.actionId}
            title={response.title}
            onExecute={() => void run()}
          />
        </div>
      )}
    </div>
  );
}
