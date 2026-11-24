"use client";

import type { CopilotResponse } from "../types";
import { Button } from "@repo/ui/components/button";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useCopilotView } from "./view-context";

type ClarifyResponse = Extract<CopilotResponse, { kind: "clarify" }>;

/** Clarify card — question + clickable options; each option re-sends as a user message. */
export function ClarifyCard({ response }: { response: ClarifyResponse }) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const copilot = useCopilotView();

  return (
    <div className="bg-card space-y-2 rounded-lg border p-3">
      <p className="text-muted-foreground text-xs font-medium">{t("copilot.clarifyTitle")}</p>
      <p className="text-sm">{response.question}</p>
      <div className="flex flex-wrap gap-2">
        {response.options.map((opt) => (
          <Button
            key={opt.id}
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => copilot.send(opt.label)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
