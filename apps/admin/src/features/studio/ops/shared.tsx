"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SessionRecord, TranscriptLine } from "@repo/contracts";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar } from "../agent-meta";
import type { TreeIndex } from "../tree";

export const clock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function Waveform({
  active,
  bars = 32,
  className,
  tone = "bg-primary",
}: {
  active: boolean;
  bars?: number;
  className?: string;
  tone?: string;
}) {
  return (
    <div className={cn("flex h-8 items-center gap-[3px]", className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={cn(
            "w-[3px] rounded-full transition-all",
            tone,
            active ? "animate-wave" : "opacity-30",
          )}
          style={{
            height: active
              ? `${30 + 70 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.31))}%`
              : "20%",
            animationDelay: `${(i % 7) * 110}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function Rating({ value }: { value: number | null }) {
  const t = useTranslations("studio.history");
  if (value === null) return <span className="text-muted-foreground text-xs">—</span>;
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={t("rating", { value })}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < value ? "fill-warning text-warning" : "text-muted-foreground/30",
          )}
          aria-hidden
        />
      ))}
    </span>
  );
}

const outcomeTone: Record<SessionRecord["outcome"], string> = {
  resolved: "bg-success/10 text-success",
  handedOff: "bg-info/10 text-info",
  dropped: "bg-muted text-muted-foreground",
};

export function OutcomeBadge({ outcome }: { outcome: SessionRecord["outcome"] }) {
  const t = useTranslations("studio.history.outcomes");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        outcomeTone[outcome],
      )}
    >
      {t(outcome)}
    </span>
  );
}

/** Transcript as chat bubbles; every agent line is tagged with the agent that wrote it. */
export function TranscriptBubbles({
  lines,
  index,
  activeId,
  onSeek,
  newIds,
}: {
  lines: TranscriptLine[];
  index: TreeIndex;
  activeId?: string | null;
  onSeek?: (line: TranscriptLine) => void;
  newIds?: Set<string>;
}) {
  const t = useTranslations("studio.live");
  return (
    <ol className="space-y-2.5">
      {lines.map((l, i) => {
        const agent = l.agentId ? index.byId.get(l.agentId) : undefined;
        const prev = lines[i - 1];
        const handoff = agent && prev?.agentId && prev.agentId !== l.agentId;
        const mine = l.speaker !== "customer";
        const Body = onSeek ? "button" : "div";
        return (
          <li
            key={l.id}
            className={cn(
              newIds?.has(l.id) && "animate-in fade-in slide-in-from-bottom-2 duration-500",
            )}
          >
            {handoff ? (
              <p className="text-muted-foreground my-2 flex items-center gap-2 text-[11px]">
                <span className="bg-border h-px flex-1" /> {t("handedTo", { name: agent.name })}
                <span className="bg-border h-px flex-1" />
              </p>
            ) : null}
            <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <Body
                {...(onSeek ? { type: "button" as const, onClick: () => onSeek(l) } : {})}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-start text-sm transition-colors",
                  l.speaker === "customer" && "bg-muted rounded-ss-sm",
                  l.speaker === "agent" && "bg-primary/10 rounded-se-sm",
                  l.speaker === "staff" && "bg-warning/15 dark:bg-warning/40 rounded-se-sm",
                  activeId === l.id && "ring-primary ring-2",
                  onSeek && "hover:brightness-95",
                )}
              >
                <span className="mb-0.5 flex items-center gap-1.5 text-[11px] font-semibold">
                  {agent ? (
                    <>
                      <AgentAvatar
                        agent={agent}
                        size="sm"
                        className="size-4 rounded-full [&_svg]:size-2.5"
                      />
                      <span style={{ color: `hsl(${agent.avatar.hue} 55% 38%)` }}>
                        {agent.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      {l.speaker === "staff" ? t("staff") : t("customer")}
                    </span>
                  )}
                  <span className="num text-muted-foreground ms-auto ps-3 font-normal">
                    {clock(l.atSec)}
                  </span>
                </span>
                <span dir="auto" className="block">
                  {l.text}
                </span>
              </Body>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
