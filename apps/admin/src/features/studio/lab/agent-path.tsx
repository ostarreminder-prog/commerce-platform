"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import type { TreeIndex } from "../tree";
import { AgentAvatar } from "../agent-meta";
import { cn } from "@repo/ui/lib/cn";

/** Agent breadcrumb that reveals one hop at a time, like the request travelling down the tree. */
export function AgentPath({
  path,
  index,
  highlight,
  animate = true,
  size = "md",
}: {
  path: string[];
  index: TreeIndex;
  highlight?: string | null;
  animate?: boolean;
  size?: "sm" | "md";
}) {
  const [shown, setShown] = React.useState(animate ? 1 : path.length);
  const key = path.join(">");
  React.useEffect(() => {
    if (!animate) return setShown(path.length);
    setShown(1);
    const timer = setInterval(
      () => setShown((n) => (n >= path.length ? (clearInterval(timer), n) : n + 1)),
      420,
    );
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, animate]);
  return (
    <ol className="flex flex-wrap items-center gap-1">
      
      {path.slice(0, shown).map((id, i) => {
        const agent = index.byId.get(id);
        if (!agent) return null;
        const last = i === path.length - 1;
        return (
          <li
            key={id}
            className="animate-in fade-in slide-in-from-start-2 flex items-center gap-1 duration-300"
          >
            
            {i > 0 ? (
              <ChevronLeft className="text-muted-foreground/60 size-3 ltr:rotate-180" aria-hidden />
            ) : null}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border py-0.5 pe-2.5 ps-0.5 font-medium",
                size === "sm" ? "text-[11px]" : "text-xs",
                last && shown === path.length
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "bg-background",
                highlight === id && "ring-success ring-2 ring-offset-1",
              )}
            >
              
              <AgentAvatar
                agent={agent}
                size="sm"
                className="size-5 rounded-full [&_svg]:size-3"
              />
              {agent.name}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
