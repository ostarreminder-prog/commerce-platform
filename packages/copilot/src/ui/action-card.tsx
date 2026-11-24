"use client";

import * as React from "react";
import { Check, ChevronDown, Play } from "lucide-react";
import type { CopilotResponse } from "../types";
import { Button } from "@repo/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { useCopilotView } from "./view-context";
import { Quote } from "./quote";

export type ActionResponse = Extract<CopilotResponse, { kind: "action" }>;

const useMsgT = () => {
  const strictT = useMsg();
  return strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
};

/** Fires `copilot:set-draft` so the composer re-opens the request for editing. */
const requestEdit = (text: string) =>
  window.dispatchEvent(new CustomEvent("copilot:set-draft", { detail: text }));

/** Shared body: description + expandable affected items + before/after diff. */
export function ActionDetails({ response }: { response: ActionResponse }) {
  const t = useMsgT();
  const [showItems, setShowItems] = React.useState(false);

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-xs">{response.description}</p>
      <Quote className="space-y-1">
        <button
          type="button"
          className="flex w-full items-center gap-1 text-xs font-medium"
          onClick={() => setShowItems((v) => !v)}
        >
          <ChevronDown className={cn("size-3.5 transition-transform", !showItems && "-rotate-90 rtl:rotate-90")} aria-hidden />
          {t("copilot.affected", { count: response.affected.count })}
        </button>
        {showItems ? (
          <ul className="text-muted-foreground list-disc space-y-0.5 ps-4 text-xs">
            {response.affected.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
            {response.affected.count > response.affected.items.length ? <li>…</li> : null}
          </ul>
        ) : null}
      </Quote>
      {response.diff?.length ? (
        <Quote className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("copilot.items")}</TableHead>
                <TableHead>{t("copilot.before")}</TableHead>
                <TableHead>{t("copilot.after")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {response.diff.map((d) => (
                <TableRow key={d.field}>
                  <TableCell className="max-w-32 truncate">{d.field}</TableCell>
                  <TableCell className="num text-muted-foreground whitespace-nowrap">{d.from}</TableCell>
                  <TableCell className="num text-success whitespace-nowrap font-medium">{d.to}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Quote>
      ) : null}
    </div>
  );
}

export function ActionButtons({
  busy,
  disabled,
  actionId,
  title,
  onExecute,
}: {
  busy: boolean;
  disabled?: boolean;
  actionId: string;
  title: string;
  onExecute: () => void;
}) {
  const t = useMsgT();
  const copilot = useCopilotView();
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" className="h-8 gap-1.5" disabled={busy || disabled} onClick={onExecute}>
        <Play className="size-3.5" aria-hidden />
        {t("copilot.execute")}
      </Button>
      <Button variant="outline" size="sm" className="h-8" disabled={busy} onClick={() => requestEdit(title)}>
        {t("copilot.edit")}
      </Button>
      <Button variant="ghost" size="sm" className="h-8" disabled={busy} onClick={() => copilot.markDone(actionId)}>
        {t("copilot.cancel")}
      </Button>
    </div>
  );
}

export function ExecutedStrip({ label }: { label: string }) {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
      <Check className="text-success size-3.5" aria-hidden />
      {label}
    </p>
  );
}

/** Normal action card — dangerous actions render via DangerActionCard. */
export function ActionCard({ response }: { response: ActionResponse }) {
  const t = useMsgT();
  const copilot = useCopilotView();
  const [busy, setBusy] = React.useState(false);
  const handled = copilot.isDone(response.actionId);

  const run = async () => {
    setBusy(true);
    try {
      await copilot.execute(response.actionId);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-card space-y-2 rounded-lg border p-3">
      <p className="text-sm font-semibold">{response.title}</p>
      <ActionDetails response={response} />
      {handled ? (
        <ExecutedStrip label={t("copilot.done")} />
      ) : (
        <ActionButtons busy={busy} actionId={response.actionId} title={response.title} onExecute={() => void run()} />
      )}
    </div>
  );
}
