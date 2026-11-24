"use client";

import { AlertTriangle, Frown, Meh, Smile } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LiveSession, TranscriptLine } from "@repo/contracts";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar, channelIcons } from "../agent-meta";
import type { TreeIndex } from "../tree";
import { clock } from "./shared";

export const needsAttention = (s: LiveSession) => s.stuck || s.sentiment < -0.3;
export const stateTone = {
  speaking: "bg-success",
  waiting: "bg-warning",
  transferring: "bg-info",
} as const;

export interface View {
  session: LiveSession;
  lines: TranscriptLine[];
  path: string[];
  takenOver: boolean;
  duration: number;
}

export function SentimentIcon({ value, className }: { value: number; className?: string }) {
  const Icon = value < -0.3 ? Frown : value < 0.3 ? Meh : Smile;
  return (
    <Icon
      className={cn(
        value < -0.3 ? "text-destructive" : value < 0.3 ? "text-warning" : "text-success",
        className,
      )}
      aria-hidden
    />
  );
}

export function SessionCard({
  v,
  index,
  active,
  onClick,
}: {
  v: View;
  index: TreeIndex;
  active: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("studio.live");
  const s = v.session;
  const Icon = channelIcons[s.channel];
  const agent = index.byId.get(v.path.at(-1) ?? "");
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active || undefined}
      className={cn(
        "w-full rounded-xl border p-3 text-start transition-colors",
        active ? "border-primary bg-primary/5" : "hover:bg-muted/50",
        needsAttention(s) && !active && "border-destructive/40",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="bg-muted relative flex size-8 items-center justify-center rounded-full">
          <Icon className="size-4" aria-hidden />
          <span
            className={cn(
              "ring-background absolute -end-0.5 -top-0.5 size-2.5 rounded-full ring-2",
              v.takenOver ? "bg-warning" : stateTone[s.state],
            )}
            aria-hidden
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{s.customerName}</p>
          <p className="text-muted-foreground truncate text-xs">
            {v.takenOver ? t("takenOver") : t(`states.${s.state}`)}
          </p>
        </div>
        <span className="num text-muted-foreground text-xs">{clock(v.duration)}</span>
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        {agent ? (
          <span className="bg-background flex min-w-0 items-center gap-1.5 rounded-full border py-0.5 pe-2 ps-0.5 text-[11px] font-medium">
            <AgentAvatar agent={agent} size="sm" className="size-4 rounded-full [&_svg]:size-2.5" />
            <span className="truncate">{agent.name}</span>
          </span>
        ) : null}
        <span className="ms-auto flex items-center gap-1.5">
          {s.stuck ? (
            <span className="bg-destructive/10 text-destructive flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
              <AlertTriangle className="size-3" aria-hidden /> {t("stuck")}
            </span>
          ) : null}
          <SentimentIcon value={s.sentiment} className="size-4" />
        </span>
      </div>
    </button>
  );
}
