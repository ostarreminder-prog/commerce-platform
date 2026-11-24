"use client";

import { CornerDownLeft } from "lucide-react";
import type { Agent } from "@repo/contracts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { AgentAvatar } from "./agent-meta";
import { flatten, indexAgents, MAX_INDENT_DEPTH } from "./tree";

const ROOT = "__root__";

/** Tree-aware agent select that stays usable at any depth. */
export function AgentPicker({
  agents,
  value,
  onChange,
  exclude = [],
  noneLabel,
  placeholder,
  id,
  className,
}: {
  agents: Agent[];
  value: string | null;
  onChange: (id: string | null) => void;
  exclude?: string[];
  noneLabel?: string;
  placeholder?: string;
  id?: string;
  className?: string;
}) {
  const rows = flatten(indexAgents(agents)).filter((r) => !exclude.includes(r.agent.id));
  return (
    <Select
      value={value ?? (noneLabel ? ROOT : "")}
      onValueChange={(v) => onChange(v === ROOT ? null : v)}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {noneLabel ? <SelectItem value={ROOT}>{noneLabel}</SelectItem> : null}
        {rows.map(({ agent, depth }) => (
          <SelectItem key={agent.id} value={agent.id}>
            <span
              className="flex items-center gap-2"
              style={{ paddingInlineStart: Math.min(depth, MAX_INDENT_DEPTH) * 14 }}
            >
              {depth > 0 ? (
                <CornerDownLeft
                  className="text-muted-foreground size-3 rtl:-scale-x-100"
                  aria-hidden
                />
              ) : null}
              {depth > MAX_INDENT_DEPTH ? (
                <span className="num text-muted-foreground text-[10px]">L{depth}</span>
              ) : null}
              <AgentAvatar agent={agent} size="sm" className="size-5 rounded-md [&_svg]:size-3" />
              <span className="truncate">{agent.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
