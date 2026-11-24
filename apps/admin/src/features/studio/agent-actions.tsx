"use client";

import Link from "@/components/store-link";
import { Copy, MoreHorizontal, Pause, Play, Plus, Settings2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { useCan } from "@/lib/permissions";

export type AgentAction = "addChild" | "duplicate" | "toggle" | "delete";

export function AgentActionsMenu({
  agent,
  onAction,
  size = "icon",
}: {
  agent: Agent;
  onAction: (action: AgentAction, agent: Agent) => void;
  size?: "icon" | "sm";
}) {
  const t = useTranslations("studio.actions");
  const canManage = useCan("agents.manage");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={size === "sm" ? "size-7" : "size-8"}
          aria-label={t("menu", { name: agent.name })}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/agents/${agent.id}`}>
            <Settings2 aria-hidden /> {t("open")}
          </Link>
        </DropdownMenuItem>
        {canManage ? (
          <>
            <DropdownMenuItem onSelect={() => onAction("addChild", agent)}>
              <Plus aria-hidden /> {t("addChild")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("duplicate", agent)}>
              <Copy aria-hidden /> {t("duplicate")}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onAction("toggle", agent)}>
              {agent.status === "paused" ? <Play aria-hidden /> : <Pause aria-hidden />}
              {agent.status === "paused" ? t("resume") : t("pause")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onAction("delete", agent)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 aria-hidden /> {t("delete")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
