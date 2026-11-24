import type { Agent, InheritableSection, PhoneNumber } from "@repo/contracts";

export interface TreeIndex {
  byId: Map<string, Agent>;
  children: Map<string | null, Agent[]>;
  roots: Agent[];
}

export function indexAgents(agents: Agent[]): TreeIndex {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const children = new Map<string | null, Agent[]>();
  for (const a of agents) {
    const key = a.parentId && byId.has(a.parentId) ? a.parentId : null;
    children.set(key, [...(children.get(key) ?? []), a]);
  }
  return { byId, children, roots: children.get(null) ?? [] };
}

/** Root → … → agent. */
export function ancestry(index: TreeIndex, id: string): Agent[] {
  const path: Agent[] = [];
  const seen = new Set<string>();
  let cur = index.byId.get(id);
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    path.unshift(cur);
    cur = cur.parentId ? index.byId.get(cur.parentId) : undefined;
  }
  return path;
}

export function descendantIds(index: TreeIndex, id: string): string[] {
  return (index.children.get(id) ?? []).flatMap((c) => [c.id, ...descendantIds(index, c.id)]);
}

export function depthOf(index: TreeIndex, id: string) {
  return ancestry(index, id).length - 1;
}

/** Depth-first flattening with depth, honoring collapsed branches. */
export function flatten(index: TreeIndex, collapsed: Set<string> = new Set()) {
  const out: { agent: Agent; depth: number; childCount: number }[] = [];
  const walk = (list: Agent[], depth: number) => {
    for (const agent of list) {
      const kids = index.children.get(agent.id) ?? [];
      out.push({ agent, depth, childCount: kids.length });
      if (!collapsed.has(agent.id)) walk(kids, depth + 1);
    }
  };
  walk(index.roots, 0);
  return out;
}

/** The agent whose value is actually used for an inheritable section. */
export function inheritanceSource(
  index: TreeIndex,
  agent: Agent,
  section: InheritableSection,
): Agent {
  let cur = agent;
  const seen = new Set<string>();
  while (cur.inheritFromParent[section] && cur.parentId && !seen.has(cur.id)) {
    seen.add(cur.id);
    const parent = index.byId.get(cur.parentId);
    if (!parent) break;
    cur = parent;
  }
  return cur;
}

export type AgentWarning =
  | { kind: "noDescription" }
  | { kind: "handoffToInactive"; targetName: string }
  | { kind: "voiceWithoutNumber" }
  | { kind: "humanAfterHours" };

export function agentWarnings(
  index: TreeIndex,
  agent: Agent,
  phones: PhoneNumber[] = [],
): AgentWarning[] {
  const warnings: AgentWarning[] = [];
  if (agent.parentId && !agent.description.trim()) warnings.push({ kind: "noDescription" });
  for (const rule of agent.handoffRules) {
    const target =
      rule.targetType === "parent"
        ? agent.parentId
          ? index.byId.get(agent.parentId)
          : undefined
        : rule.targetType === "child" && rule.targetId
          ? index.byId.get(rule.targetId)
          : undefined;
    if (target && target.status !== "live")
      warnings.push({ kind: "handoffToInactive", targetName: target.name });
  }
  if (
    !agent.parentId &&
    agent.channels.includes("voice") &&
    !phones.some((p) => p.agentId === agent.id)
  )
    warnings.push({ kind: "voiceWithoutNumber" });
  const hours = inheritanceSource(index, agent, "workingHours");
  const alwaysOpen = hours.workingHours.every(
    (d) => d.enabled && d.from === "00:00" && d.to === "24:00",
  );
  if (
    !alwaysOpen &&
    agent.afterHoursBehavior === "human" &&
    agent.handoffRules.some((r) => r.targetType === "human")
  )
    warnings.push({ kind: "humanAfterHours" });
  return warnings;
}

/** Breadcrumb that stays readable at any depth: first, "…", last N. */
export function compactPath<T>(path: T[], keepTail = 2): (T | null)[] {
  if (path.length <= keepTail + 2) return path;
  return [path[0] as T, null, ...path.slice(-keepTail)];
}

export const MAX_INDENT_DEPTH = 6;
