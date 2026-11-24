"use client";

import { ShieldCheck } from "lucide-react";

/** Persistent strip: which identity + scope the copilot acts with. */
export function CopilotSecurityBar({ text }: { text: string }) {
  return (
    <div className="bg-muted/60 text-muted-foreground flex items-center gap-1.5 border-b px-3 py-1.5 text-[11px]">
      <ShieldCheck className="text-success size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{text}</span>
    </div>
  );
}
