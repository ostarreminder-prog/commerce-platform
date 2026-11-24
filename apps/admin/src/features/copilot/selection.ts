import type { CopilotConversation, CopilotEntityRef } from "./types";

let seq = 0;
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;

declare global {
  interface Window {
    __copilotSelection?: CopilotEntityRef[];
  }
}

let selectionSetter: ((entities: CopilotEntityRef[]) => void) | null = null;

/** Called by CopilotProvider on mount — bridges the stub below into React state. */
export function registerSelectionSetter(fn: ((entities: CopilotEntityRef[]) => void) | null) {
  selectionSetter = fn;
}

/**
 * Stub wiring point for future table selections: features call
 * `setCopilotSelection(rows)` when rows get selected and the context strip
 * picks them up. Also mirrored on `window.__copilotSelection`.
 */
export function setCopilotSelection(entities: CopilotEntityRef[]) {
  window.__copilotSelection = entities;
  selectionSetter?.(entities);
}

export const blankConversation = (): CopilotConversation => ({
  id: uid("cv"),
  title: "",
  messages: [],
  createdAt: new Date().toISOString(),
});
