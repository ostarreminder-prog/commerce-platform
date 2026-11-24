"use client";

import { ChatView as SharedChatView } from "@repo/copilot/ui";
import { renderLink, renderRef } from "./chat-message";
import { CopilotInput } from "./copilot-input";

/** Admin chat body — shared view + composer bound to the entity-ref menu. */
export function ChatView({ className, focusOnMount = false }: { className?: string; focusOnMount?: boolean }) {
  return (
    <SharedChatView
      className={className}
      composer={<CopilotInput focusOnMount={focusOnMount} />}
      renderLink={renderLink}
      renderRef={renderRef}
    />
  );
}
