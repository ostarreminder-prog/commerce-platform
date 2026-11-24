"use client";

import Link from "@/components/store-link";
import { UserRound } from "lucide-react";
import type { Agent } from "@repo/contracts";
import { AgentAvatar } from "../agent-meta";

export function TargetChip({ agent, human }: { agent?: Agent; human?: string }) {
  if (human)
    return (
      <span className="bg-muted inline-flex items-center gap-1.5 rounded-full py-1 pe-3 ps-1 text-sm">
        <span className="bg-background flex size-6 items-center justify-center rounded-full">
          <UserRound className="size-3.5" aria-hidden />
        </span>
        {human}
      </span>
    );
  if (!agent) return null;
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="bg-muted hover:bg-muted/70 inline-flex items-center gap-1.5 rounded-full py-1 pe-3 ps-1 text-sm"
    >
      <AgentAvatar agent={agent} size="sm" className="size-6 rounded-full [&_svg]:size-3" />
      {agent.name}
    </Link>
  );
}
