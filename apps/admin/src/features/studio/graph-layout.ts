import type { Agent } from "@repo/contracts";
import type { TreeIndex } from "./tree";

export const W = 248;
export const H = 112;
const GAP_X = 28;
const GAP_Y = 72;

export function layout(index: TreeIndex, collapsed: Set<string>, mirror: boolean) {
  const pos = new Map<string, { x: number; y: number }>();
  let cursor = 0;
  const place = (a: Agent, depth: number): number => {
    const kids = collapsed.has(a.id) ? [] : (index.children.get(a.id) ?? []);
    let x: number;
    if (!kids.length) {
      x = cursor;
      cursor += W + GAP_X;
    } else {
      const xs = kids.map((k) => place(k, depth + 1));
      x = ((xs[0] ?? 0) + (xs.at(-1) ?? 0)) / 2;
    }
    pos.set(a.id, { x: mirror ? -x : x, y: depth * (H + GAP_Y) });
    return x;
  };
  for (const root of index.roots) {
    place(root, 0);
    cursor += GAP_X * 2;
  }
  return pos;
}
