"use client";

import {
  ChatMessageView as SharedChatMessageView,
  type CopilotMessageRenderers,
} from "@repo/copilot/ui";
import { EntityLink } from "@/components/entity/entity-link";
import Link from "@/components/store-link";
import type { UiChatMessage } from "./types";

/** Admin bindings for the shared chat surface — store-scoped links + entity previews. */
export const renderLink: CopilotMessageRenderers["renderLink"] = ({ href, className, children }) => (
  <Link href={href} className={className}>
    {children}
  </Link>
);

export const renderRef: CopilotMessageRenderers["renderRef"] = (ref) => (
  <EntityLink type={ref.type} id={ref.id} label={ref.label} />
);

export function ChatMessageView({ message }: { message: UiChatMessage }) {
  return <SharedChatMessageView message={message} renderLink={renderLink} renderRef={renderRef} />;
}

export { ThinkingBubble } from "@repo/copilot/ui";
