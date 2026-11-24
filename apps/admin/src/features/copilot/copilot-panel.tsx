"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { CopilotToggle, useCopilotHotkey } from "@repo/copilot/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { ChatView } from "./chat-view";
import { ContextStrip } from "./context-strip";
import { useCopilot } from "./copilot-context";
import { SecurityBar } from "./security-bar";

export { CopilotToggle };

/** Start-anchored copilot sheet (right side in RTL). */
export function CopilotPanel() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { open, setOpen } = useCopilot();
  useCopilotHotkey(React.useCallback(() => setOpen((v) => !v), [setOpen]));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="start" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-3 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary size-4" aria-hidden />
            <SheetTitle className="text-sm font-semibold">{t("copilot.title")}</SheetTitle>
            <span className="text-muted-foreground ms-auto pe-6 text-[11px]">{t("copilot.poweredBy")}</span>
          </div>
        </SheetHeader>
        <SecurityBar />
        <ContextStrip />
        <ChatView />
      </SheetContent>
    </Sheet>
  );
}
