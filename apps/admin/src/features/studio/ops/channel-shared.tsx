"use client";

import { useTranslations } from "next-intl";
import type { Agent } from "@repo/contracts";
import { cn } from "@repo/ui/lib/cn";
import { useCan } from "@/lib/permissions";
import { AgentAvatar } from "../agent-meta";
import { AgentPicker } from "../agent-picker";

const statusTone: Record<string, string> = {
  active: "bg-success/10 text-success",
  connected: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  disconnected: "bg-destructive/10 text-destructive",
};

export function Status({ value }: { value: string }) {
  const t = useTranslations("studio.channels.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        statusTone[value],
      )}
    >
      <span
        className={cn("size-1.5 rounded-full bg-current", value === "pending" && "animate-pulse")}
        aria-hidden
      />
      {t(value as "active")}
    </span>
  );
}

export function LinkedAgent({
  agents,
  value,
  onChange,
}: {
  agents: Agent[];
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const t = useTranslations("studio.channels");
  const canManage = useCan("agents.manage");
  const agent = agents.find((a) => a.id === value);
  if (!canManage)
    return agent ? (
      <span className="flex items-center gap-2 text-sm">
        <AgentAvatar agent={agent} size="sm" /> {agent.name}
      </span>
    ) : (
      <span className="text-muted-foreground text-sm">{t("unassigned")}</span>
    );
  return (
    <div className="space-y-1">
      <AgentPicker
        agents={agents}
        value={value}
        onChange={onChange}
        noneLabel={t("unassigned")}
        className="w-full min-w-48"
      />
      {agent?.parentId ? <p className="text-warning text-[11px]">{t("notOrchestrator")}</p> : null}
    </div>
  );
}
