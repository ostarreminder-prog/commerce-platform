"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { ChatView, CopilotInput, CopilotSecurityBar, CopilotToggle, useCopilotHotkey, useCopilotView } from "@repo/copilot/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { useMsg } from "@repo/ui/hooks/use-msg";

export { CopilotToggle };

/** Platform security strip — «يعمل بصلاحيات: مالك المنصة — المنصة». */
export function SecurityBar() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  return <CopilotSecurityBar text={t("copilot.securityBarPlatform")} />;
}

/** Platform response links are plain console routes — no store prefix. */
export const consoleRenderLink = ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
  <Link href={href} className={className}>
    {children}
  </Link>
);

/** Console copilot sheet — Cmd/Ctrl+J toggles it from anywhere. */
export function CopilotPanel() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { open, setOpen } = useCopilotView();
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
        <ChatView composer={<CopilotInput />} renderLink={consoleRenderLink} />
      </SheetContent>
    </Sheet>
  );
}
