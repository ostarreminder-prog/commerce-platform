"use client";

import * as React from "react";
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useTranslations } from "next-intl";
import { useMoveAgent } from "@repo/api-client";
import type { Agent, PhoneNumber } from "@repo/contracts";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useCan } from "@/lib/permissions";
import type { AgentAction } from "./agent-actions";
import { AgentAvatar } from "./agent-meta";
import { ROOT_ZONE, RootZone, TreeRow } from "./agent-tree-row";
import { descendantIds, flatten, type TreeIndex } from "./tree";

export function AgentTree({
  index,
  phones,
  collapsed,
  onToggle,
  onAction,
  query,
}: {
  index: TreeIndex;
  phones: PhoneNumber[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onAction: (action: AgentAction, agent: Agent) => void;
  query: string;
}) {
  const mt = useMsgToast();
  const t = useTranslations("studio.overview");
  const canManage = useCan("agents.manage");
  const move = useMoveAgent();
  const [dragging, setDragging] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  );
  const q = query.trim().toLowerCase();
  const matches = React.useMemo(() => {
    if (!q) return null;
    const keep = new Set<string>();
    for (const a of index.byId.values()) {
      if (a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)) {
        let cur: Agent | undefined = a;
        while (cur) {
          keep.add(cur.id);
          cur = cur.parentId ? index.byId.get(cur.parentId) : undefined;
        }
      }
    }
    return keep;
  }, [index, q]);
  const rows = flatten(index, q ? new Set() : collapsed).filter(
    (r) => !matches || matches.has(r.agent.id),
  );
  const invalid = React.useMemo(() => {
    if (!dragging) return new Set<string>();
    const a = index.byId.get(dragging);
    return new Set([
      dragging,
      ...descendantIds(index, dragging),
      ...(a?.parentId ? [a.parentId] : []),
    ]);
  }, [dragging, index]);
  const onDragStart = (e: DragStartEvent) => setDragging(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    const id = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    const agent = index.byId.get(id);
    if (!overId || !agent) return;
    const target = overId === ROOT_ZONE ? null : overId;
    if (target === agent.parentId) return;
    if (target && (target === id || descendantIds(index, id).includes(target))) {
      mt.error("agents.move.cycle");
      return;
    }
    move.mutate([id, target], {
      onSuccess: () =>
        toast.success(
          target
            ? t("moved", { name: agent.name, parent: index.byId.get(target)?.name ?? "" })
            : t("movedRoot", { name: agent.name }),
        ),
      onError: () => toast.error(t("cycle")),
    });
  };
  const active = dragging ? index.byId.get(dragging) : undefined;
  if (!rows.length)
    return <p className="text-muted-foreground py-10 text-center text-sm">{t("noResults")}</p>;
  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <ul role="tree" aria-label={t("viewTree")} className="space-y-0.5">
        {rows.map(({ agent, depth, childCount }) => (
          <TreeRow
            key={agent.id}
            agent={agent}
            depth={depth}
            childCount={childCount}
            collapsed={collapsed.has(agent.id) && !q}
            onToggle={() => onToggle(agent.id)}
            onAction={onAction}
            index={index}
            phones={phones}
            dragging={dragging}
            invalid={invalid}
            canManage={canManage}
            highlight={Boolean(q) && agent.name.toLowerCase().includes(q)}
          />
        ))}
      </ul>
      <RootZone active={Boolean(active?.parentId)} />
      <DragOverlay dropAnimation={null}>
        {active ? (
          <div className="bg-card flex items-center gap-3 rounded-xl border p-3 shadow-lg">
            <AgentAvatar agent={active} /> <span className="font-semibold">{active.name}</span>
            {descendantIds(index, active.id).length ? (
              <span className="num text-muted-foreground text-xs">
                +{descendantIds(index, active.id).length}
              </span>
            ) : null}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
