"use client";

import "@xyflow/react/dist/style.css";
import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type Node,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import { useTranslations } from "next-intl";
import type { Agent, PhoneNumber } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useCan } from "@/lib/permissions";
import type { AgentAction } from "./agent-actions";
import { nodeTypes, type AgentNodeData } from "./agent-node";
import { H, layout, W } from "./graph-layout";
import { descendantIds, type TreeIndex } from "./tree";

function Graph({
  index,
  phones,
  collapsed,
  onToggle,
  onAction,
}: {
  index: TreeIndex;
  phones: PhoneNumber[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onAction: (action: AgentAction, agent: Agent) => void;
}) {
  const t = useTranslations("studio.graph");
  const { dir } = useAppLocale();
  const canManage = useCan("agents.manage");
  const flow = useReactFlow();
  const { nodes, edges } = React.useMemo(() => {
    const pos = layout(index, collapsed, dir === "rtl");
    const nodes: Node<AgentNodeData>[] = [];
    const edges: Edge[] = [];
    for (const [id, p] of pos) {
      const agent = index.byId.get(id);
      if (!agent) continue;
      const childCount = index.children.get(id)?.length ?? 0;
      nodes.push({
        id,
        type: "agent",
        position: p,
        width: W,
        height: H,
        draggable: false,
        data: {
          agent,
          index,
          phones,
          collapsed: collapsed.has(id),
          hiddenCount: descendantIds(index, id).length,
          childCount,
          onToggle,
          onAction,
          canManage,
          dir,
        },
      });
      if (agent.parentId && pos.has(agent.parentId)) {
        const live = agent.status === "live";
        edges.push({
          id: `${agent.parentId}-${id}`,
          source: agent.parentId,
          target: id,
          type: "smoothstep",
          animated: live,
          markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
          style: {
            strokeWidth: 1.5,
            stroke: live ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.5)",
            strokeDasharray: live ? undefined : "4 4",
          },
        });
      }
    }
    return { nodes, edges };
  }, [index, collapsed, dir, phones, onToggle, onAction, canManage]);
  React.useEffect(() => {
    const id = window.setTimeout(() => void flow.fitView({ padding: 0.15, duration: 300 }), 50);
    return () => window.clearTimeout(id);
  }, [collapsed, flow]);
  return (
    <div
      dir="ltr"
      aria-label={t("label")}
      className="bg-muted/30 [&_.react-flow__controls-button]:border-b-border [&_.react-flow__controls-button]:bg-card [&_.react-flow__controls-button]:fill-foreground [&_.react-flow__minimap]:bg-card h-[560px] overflow-hidden rounded-xl border sm:h-[640px] [&_.react-flow__controls]:overflow-hidden [&_.react-flow__controls]:rounded-lg [&_.react-flow__controls]:border [&_.react-flow__controls]:shadow-sm [&_.react-flow__minimap]:rounded-lg [&_.react-flow__minimap]:border"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.6}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          className="hidden sm:block"
          nodeBorderRadius={8}
          maskColor="rgba(100, 116, 139, 0.12)"
          nodeColor={(n) => {
            const s = (n.data as AgentNodeData).agent.status;
            return s === "live" ? "#1b7a53" : s === "paused" ? "#d18a12" : "#94a3b8";
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function AgentGraph(props: React.ComponentProps<typeof Graph>) {
  return (
    <ReactFlowProvider>
      <Graph {...props} />
    </ReactFlowProvider>
  );
}
