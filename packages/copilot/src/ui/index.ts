/* Shared copilot presentational surface — apps supply their own provider
 * (context + api surface) and mount CopilotViewProvider around these pieces. */
export * from "./view-context";
export { Quote } from "./quote";
export { ResponseTable } from "./response-table";
export { ResponseChart } from "./response-chart";
export { ActionCard, ActionDetails, ActionButtons, ExecutedStrip, type ActionResponse } from "./action-card";
export { DangerActionCard } from "./danger-action-card";
export { PlanCard } from "./plan-card";
export { ClarifyCard } from "./clarify-card";
export { ChatMessageView, ThinkingBubble, type CopilotMessageRenderers, type RefRenderer } from "./chat-message";
export { CopilotInput, type CopilotComposerRef, type CopilotEntityMenuProps } from "./copilot-input";
export { CopilotSecurityBar } from "./security-bar";
export { ChatView } from "./chat-view";
export { CopilotToggle, useCopilotHotkey } from "./copilot-toggle";
