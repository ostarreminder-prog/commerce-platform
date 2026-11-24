import type { MenuItem } from "@repo/contracts";

let seq = 0;
export const newItemId = () => `mi_new_${Date.now().toString(36)}${seq++}`;

export function emptyItem(): MenuItem {
  return { id: newItemId(), label: { ar: "", en: "" }, linkType: "url", targetId: null, url: "", children: [] };
}

/** Returns the array that directly contains `id`, plus its index — used for move/remove. */
function locate(items: MenuItem[], id: string): { siblings: MenuItem[]; index: number } | null {
  const index = items.findIndex((i) => i.id === id);
  if (index !== -1) return { siblings: items, index };
  for (const item of items) {
    const hit = locate(item.children, id);
    if (hit) return hit;
  }
  return null;
}

export function updateItem(items: MenuItem[], id: string, patch: Partial<MenuItem>): MenuItem[] {
  return items.map((i) =>
    i.id === id ? { ...i, ...patch, id: i.id } : { ...i, children: updateItem(i.children, id, patch) },
  );
}

/** `parentId` is a top-level item id (depth is capped at 2, so sub-items can't have children). */
export function insertItem(items: MenuItem[], parentId: string | null, item: MenuItem): MenuItem[] {
  if (!parentId) return [...items, item];
  return items.map((i) => (i.id === parentId ? { ...i, children: [...i.children, item] } : i));
}

export function removeItem(items: MenuItem[], id: string): MenuItem[] {
  return items.filter((i) => i.id !== id).map((i) => ({ ...i, children: removeItem(i.children, id) }));
}

export function moveItem(items: MenuItem[], id: string, delta: -1 | 1): MenuItem[] {
  const next = structuredClone(items);
  const hit = locate(next, id);
  if (!hit) return items;
  const { siblings, index } = hit;
  const swap = index + delta;
  if (swap < 0 || swap >= siblings.length) return items;
  const tmp = siblings[index] as MenuItem;
  siblings[index] = siblings[swap] as MenuItem;
  siblings[swap] = tmp;
  return next;
}
