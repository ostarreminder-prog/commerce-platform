import type { CopilotConversation as StoredConversation } from "@repo/contracts";
import type { CopilotConversation, UiChatMessage } from "./types";

/** Local conversation → persisted record (commerce.copilotConversations.save). */
export const toRecord = (c: CopilotConversation, storeId: string, ownerId: string): StoredConversation => ({
  id: c.id,
  storeId,
  title: c.title,
  messages: c.messages as unknown as StoredConversation["messages"],
  pinned: c.pinned ?? false,
  shared: c.shared ?? false,
  ownerId: c.ownerId ?? ownerId,
  createdAt: c.createdAt,
  updatedAt: c.updatedAt ?? c.createdAt,
});

/** Persisted record → local conversation; foreign shared threads open read-only. */
export const fromRecord = (r: StoredConversation, meId?: string): CopilotConversation => ({
  id: r.id,
  title: r.title,
  messages: r.messages as unknown as UiChatMessage[],
  createdAt: r.createdAt,
  updatedAt: r.updatedAt,
  pinned: r.pinned,
  shared: r.shared,
  ownerId: r.ownerId,
  readOnly: r.shared && Boolean(meId) && r.ownerId !== meId,
});

/** Merge a remote record into the local list — keeps the longer message list
 *  (local appends race the save → refetch cycle). */
export const mergeRecord = (local: CopilotConversation | undefined, r: StoredConversation, meId?: string): CopilotConversation => {
  const remote = fromRecord(r, meId);
  if (!local) return remote;
  return {
    ...local,
    ...remote,
    messages: local.messages.length >= remote.messages.length ? local.messages : remote.messages,
    readOnly: remote.readOnly,
  };
};
