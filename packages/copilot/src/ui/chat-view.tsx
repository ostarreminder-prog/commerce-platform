"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { ChatMessageView, ThinkingBubble, type CopilotMessageRenderers } from "./chat-message";
import { CopilotInput } from "./copilot-input";
import { useCopilotView } from "./view-context";

/** Shared chat body — messages list + thinking indicator + composer. Used by the panel and the full page. */
export function ChatView({
  className,
  focusOnMount = false,
  composer,
  renderLink,
  renderRef,
}: {
  className?: string;
  focusOnMount?: boolean;
  /** Override composer (e.g. admin injects the entity-ref menu). Defaults to the plain shared input. */
  composer?: React.ReactNode;
} & CopilotMessageRenderers) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const copilot = useCopilotView();
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [copilot.messages.length, copilot.thinking]);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {copilot.messages.length === 0 && !copilot.thinking ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-semibold">{t("copilot.emptyTitle")}</p>
            <p className="text-muted-foreground max-w-72 text-xs leading-5">{t("copilot.emptyBody")}</p>
          </div>
        ) : (
          copilot.messages.map((message) => (
            <ChatMessageView key={message.id} message={message} renderLink={renderLink} renderRef={renderRef} />
          ))
        )}
        {copilot.thinking ? <ThinkingBubble /> : null}
        <div ref={endRef} aria-hidden />
      </div>
      <div className="border-t p-3">
        {copilot.readOnly ? (
          <p className="text-muted-foreground flex items-center justify-center py-2 text-xs">{t("copilot.sharedReadOnly")}</p>
        ) : (
          (composer ?? <CopilotInput focusOnMount={focusOnMount} />)
        )}
      </div>
    </div>
  );
}
