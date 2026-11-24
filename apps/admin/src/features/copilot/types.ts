import type { ChatMessage } from "@repo/copilot";
import type { CopilotComposerRef, CopilotRefLike } from "@repo/copilot/ui";

/** An entity mentioned in the composer via #/@// triggers — id is the context hint for the engine. */
export type CopilotEntityRef = CopilotComposerRef;

export interface UiChatMessage extends ChatMessage {
  refs?: CopilotRefLike[];
}

export interface CopilotConversation {
  id: string;
  title: string;
  messages: UiChatMessage[];
  createdAt: string;
  updatedAt?: string;
  pinned?: boolean;
  /** Shared conversations render read-only for staff other than the owner. */
  shared?: boolean;
  ownerId?: string;
  readOnly?: boolean;
}
