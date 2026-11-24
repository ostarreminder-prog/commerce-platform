"use client";

import Link from "@/components/store-link";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { ChevronDown, GripVertical, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent, PhoneNumber } from "@repo/contracts";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { type AgentAction, AgentActionsMenu } from "./agent-actions";
import { AgentAvatar, AgentStatusBadge, ChannelIcons, WarningsIndicator } from "./agent-meta";
import { agentWarnings, descendantIds, MAX_INDENT_DEPTH, type TreeIndex } from "./tree";

export const ROOT_ZONE = "__root_zone__";

interface RowProps {
  agent: Agent;
  depth: number;
  childCount: number;
  collapsed: boolean;
  onToggle: () => void;
  onAction: (action: AgentAction, agent: Agent) => void;
  index: TreeIndex;
  phones: PhoneNumber[];
  dragging: string | null;
  invalid: Set<string>;
  canManage: boolean;
  highlight: boolean;
}

export function TreeRow({
  agent,
  depth,
  childCount,
  collapsed,
  onToggle,
  onAction,
  index,
  phones,
  dragging,
  invalid,
  canManage,
  highlight,
}: RowProps) {
  const t = useTranslations("studio");
  const drag = useDraggable({ id: agent.id, disabled: !canManage });
  const drop = useDroppable({ id: agent.id, disabled: !dragging });
  const blocked = dragging !== null && invalid.has(agent.id);
  const warnings = agentWarnings(index, agent, phones);
  const shownDepth = Math.min(depth, MAX_INDENT_DEPTH);
  return (
    <li
      ref={drop.setNodeRef}
      role="treeitem"
      aria-level={depth + 1}
      aria-expanded={childCount ? !collapsed : undefined}
      aria-selected={false}
      className={cn(
        "group relative rounded-xl border border-transparent transition-colors",
        drop.isOver && !blocked && "border-primary bg-primary/5",
        drop.isOver && blocked && "border-destructive bg-destructive/5",
        dragging && blocked && "opacity-50",
        drag.isDragging && "opacity-30",
        highlight && "bg-primary/5",
      )}
    >
      <div
        className="flex items-center gap-1.5 py-2 pe-1 [--indent:14px] sm:gap-2 sm:pe-2 sm:[--indent:28px]"
        style={{ paddingInlineStart: `calc(4px + ${shownDepth} * var(--indent))` }}
      >
        {Array.from({ length: shownDepth }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className="bg-border absolute inset-y-0 w-px"
            style={{
              insetInlineStart: `calc(4px + ${i} * var(--indent) + var(--indent) / 2 + 2px)`,
            }}
          />
        ))}
        {canManage ? (
          <button
            type="button"
            ref={drag.setActivatorNodeRef}
            {...drag.listeners}
            {...drag.attributes}
            aria-label={t("overview.drag", { name: agent.name })}
            className="text-muted-foreground/60 hover:text-foreground focus-visible:ring-ring relative -my-1 flex h-6 w-4 shrink-0 cursor-grab touch-none items-center justify-center rounded focus-visible:outline-none focus-visible:ring-2 active:cursor-grabbing sm:w-6"
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          disabled={!childCount}
          aria-label={
            collapsed
              ? t("overview.expand", { name: agent.name })
              : t("overview.collapse", { name: agent.name })
          }
          className={cn(
            "hover:bg-muted relative flex size-5 shrink-0 items-center justify-center rounded transition-transform sm:size-6",
            !childCount && "invisible",
          )}
        >
          <ChevronDown
            className={cn("size-4 transition-transform", collapsed && "-rotate-90 rtl:rotate-90")}
            aria-hidden
          />
        </button>
        <div ref={drag.setNodeRef} className="relative flex min-w-0 flex-1 items-center gap-3">
          <span className="relative">
            <AgentAvatar agent={agent} />
            <span
              aria-hidden
              className={cn(
                "ring-background absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full ring-2 sm:hidden",
                agent.status === "live"
                  ? "bg-success"
                  : agent.status === "paused"
                    ? "bg-warning"
                    : "bg-muted-foreground",
              )}
            />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                href={`/agents/${agent.id}`}
                dir="auto"
                className="truncate font-semibold hover:underline"
              >
                {agent.name}
              </Link>
              {!agent.parentId ? (
                <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[10px] font-semibold">
                  {t("role.orchestrator")}
                </span>
              ) : null}
              {depth > MAX_INDENT_DEPTH ? (
                <span className="num bg-muted text-muted-foreground rounded px-1.5 text-[10px]">
                  {t("overview.depth", { level: depth + 1 })}
                </span>
              ) : null}
              {collapsed && childCount ? (
                <span className="text-muted-foreground text-[11px]">
                  · {t("overview.hidden", { count: descendantIds(index, agent.id).length })}
                </span>
              ) : null}
              <WarningsIndicator warnings={warnings} />
            </div>
            <p
              dir="auto"
              className={cn(
                "truncate text-start text-xs",
                agent.description ? "text-muted-foreground" : "text-warning italic",
              )}
            >
              {agent.description || t("overview.noDescription")}
            </p>
          </div>
        </div>
        <div className="relative hidden items-center gap-3 md:flex">
          {agent.handoffRules.some((r) => r.targetType === "human") ? (
            <span
              className="text-muted-foreground inline-flex items-center gap-1 text-[11px]"
              title={t("overview.humanHandoff")}
            >
              <UserRound className="size-3.5" aria-hidden />
            </span>
          ) : null}
          <ChannelIcons channels={agent.channels} />
          <span className="num text-muted-foreground w-24 text-end text-xs">
            {t("overview.conversations", { count: formatNumber(agent.stats.conversations) })}
          </span>
        </div>
        <AgentStatusBadge status={agent.status} className="relative hidden sm:inline-flex" />
        <span className="relative">
          <AgentActionsMenu agent={agent} onAction={onAction} />
        </span>
      </div>
    </li>
  );
}

export function RootZone({ active }: { active: boolean }) {
  const t = useTranslations("studio.overview");
  const { setNodeRef, isOver } = useDroppable({ id: ROOT_ZONE, disabled: !active });
  if (!active) return null;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "text-muted-foreground mt-2 rounded-xl border-2 border-dashed p-3 text-center text-sm transition-colors",
        isOver && "border-primary text-primary bg-primary/5",
      )}
    >
      {t("rootZone")}
    </div>
  );
}
