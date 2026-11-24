"use client";

import Link from "@/components/store-link";
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { ChevronDown, ChevronUp, Plus, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent, PhoneNumber } from "@repo/contracts";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber, formatPercent } from "@repo/ui/lib/format";
import type { AgentAction } from "./agent-actions";
import { AgentAvatar, AgentStatusBadge, ChannelIcons, WarningsIndicator } from "./agent-meta";
import { H, W } from "./graph-layout";
import { agentWarnings, type TreeIndex } from "./tree";

export interface AgentNodeData extends Record<string, unknown> {
  agent: Agent;
  index: TreeIndex;
  phones: PhoneNumber[];
  collapsed: boolean;
  hiddenCount: number;
  childCount: number;
  onToggle: (id: string) => void;
  onAction: (action: AgentAction, agent: Agent) => void;
  canManage: boolean;
  dir: "rtl" | "ltr";
}

function AgentNode({ data }: NodeProps<Node<AgentNodeData>>) {
  const t = useTranslations("studio");
  const {
    agent,
    index,
    phones,
    collapsed,
    hiddenCount,
    childCount,
    onToggle,
    onAction,
    canManage,
    dir,
  } = data;
  return (
    <div
      dir={dir}
      className={cn(
        "bg-card text-card-foreground relative flex flex-col gap-2 rounded-xl border p-3 shadow-sm",
        !agent.parentId && "border-primary/50 ring-primary/15 ring-4",
        agent.status === "paused" && "opacity-70",
      )}
      style={{ width: W, height: H }}
    >
      <Handle type="target" position={Position.Top} className="!bg-border !size-2 !border-0" />
      <div className="flex items-start gap-2">
        <AgentAvatar agent={agent} size="sm" />
        <div className="min-w-0 flex-1">
          <Link
            href={`/agents/${agent.id}`}
            dir="auto"
            className="nodrag block truncate text-start text-sm font-semibold hover:underline"
          >
            {agent.name}
          </Link>
          <div className="mt-0.5 flex items-center gap-1.5">
            <AgentStatusBadge status={agent.status} className="px-1.5 py-0 text-[10px]" />
            <WarningsIndicator warnings={agentWarnings(index, agent, phones)} />
          </div>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={() => onAction("addChild", agent)}
            className="nodrag hover:bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-md"
            aria-label={t("actions.addChild")}
          >
            <Plus className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      <div className="mt-auto flex items-center justify-between gap-2">
        <ChannelIcons channels={agent.channels} className="[&>span]:size-5" />
        <span className="num text-muted-foreground flex items-center gap-2 text-[11px]">
          {agent.handoffRules.some((r) => r.targetType === "human") ? (
            <UserRound className="size-3.5" aria-label={t("overview.humanHandoff")} />
          ) : null}
          {formatNumber(agent.stats.conversations)} ·{formatPercent(agent.stats.resolutionRate, 0)}
        </span>
      </div>
      {childCount ? (
        <button
          type="button"
          onClick={() => onToggle(agent.id)}
          className="nodrag bg-background hover:bg-muted absolute -bottom-3 start-1/2 flex h-6 -translate-x-1/2 items-center gap-1 rounded-full border px-2 text-[11px] font-medium shadow-sm rtl:translate-x-1/2"
          aria-label={
            collapsed
              ? t("overview.expand", { name: agent.name })
              : t("overview.collapse", { name: agent.name })
          }
        >
          {collapsed ? (
            <ChevronDown className="size-3" aria-hidden />
          ) : (
            <ChevronUp className="size-3" aria-hidden />
          )}
          {collapsed ? <span className="num">+{hiddenCount}</span> : null}
        </button>
      ) : null}
      <Handle type="source" position={Position.Bottom} className="!bg-border !size-2 !border-0" />
    </div>
  );
}

export const nodeTypes = { agent: AgentNode };
