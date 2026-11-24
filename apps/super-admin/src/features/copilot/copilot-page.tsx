"use client";

import { ChatView, CopilotInput } from "@repo/copilot/ui";
import { consoleRenderLink, SecurityBar } from "./copilot-panel";

/** /copilot — full-page platform copilot using the shared chat surface. */
export function CopilotPage() {
  return (
    <section className="bg-card flex h-[calc(100dvh-8rem)] flex-col rounded-lg border">
      <SecurityBar />
      <ChatView focusOnMount composer={<CopilotInput focusOnMount />} renderLink={consoleRenderLink} />
    </section>
  );
}
