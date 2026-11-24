"use client";

import {
  AlertTriangle,
  Bot,
  Building2,
  Globe,
  Headset,
  Landmark,
  type LucideIcon,
  MessageCircle,
  Phone,
  ShoppingBag,
  Sparkles,
  Truck,
  Undo2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent, AgentChannel, AgentIcon, AgentStatus } from "@repo/contracts";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { cn } from "@repo/ui/lib/cn";
import type { AgentWarning } from "./tree";

export const agentIcons: Record<AgentIcon, LucideIcon> = {
  bot: Bot,
  sparkles: Sparkles,
  bag: ShoppingBag,
  user: User,
  users: Users,
  building: Building2,
  landmark: Landmark,
  headset: Headset,
  truck: Truck,
  undo: Undo2,
  alert: AlertTriangle,
  wrench: Wrench,
};

export const channelIcons: Record<AgentChannel, LucideIcon> = {
  whatsapp: MessageCircle,
  voice: Phone,
  webchat: Globe,
};

export const CHANNELS: AgentChannel[] = ["whatsapp", "voice", "webchat"];

export function AgentAvatar({
  agent,
  size = "md",
  className,
}: {
  agent: Pick<Agent, "avatar">;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const Icon = agentIcons[agent.avatar.icon];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl",
        size === "sm" ? "size-7 rounded-lg" : size === "lg" ? "size-12" : "size-9",
        className,
      )}
      style={{
        backgroundColor: `hsl(${agent.avatar.hue} 70% 50% / 0.14)`,
        color: `hsl(${agent.avatar.hue} 60% 40%)`,
      }}
    >
      <Icon
        className={size === "sm" ? "size-3.5" : size === "lg" ? "size-6" : "size-[18px]"}
        aria-hidden
      />
    </span>
  );
}

const statusTone: Record<AgentStatus, string> = {
  live: "bg-success/10 text-success",
  paused: "bg-warning/15 text-warning-foreground dark:text-warning",
  draft: "bg-muted text-muted-foreground",
};
const statusDot: Record<AgentStatus, string> = {
  live: "bg-success",
  paused: "bg-warning",
  draft: "bg-muted-foreground/60",
};

export function AgentStatusBadge({
  status,
  className,
}: {
  status: AgentStatus;
  className?: string;
}) {
  const t = useTranslations("studio.status");
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        statusTone[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          statusDot[status],
          status === "live" && "animate-pulse",
        )}
        aria-hidden
      />
      {t(status)}
    </span>
  );
}

export function ChannelIcons({
  channels,
  className,
}: {
  channels: AgentChannel[];
  className?: string;
}) {
  const t = useTranslations("studio.channel");
  return (
    <span className={cn("text-muted-foreground inline-flex items-center gap-1", className)}>
      {CHANNELS.filter((c) => channels.includes(c)).map((c) => {
        const Icon = channelIcons[c];
        return (
          <Tooltip key={c}>
            <TooltipTrigger asChild>
              <span className="bg-muted inline-flex size-6 items-center justify-center rounded-md">
                <Icon className="size-3.5" aria-label={t(c)} />
              </span>
            </TooltipTrigger>
            <TooltipContent>{t(c)}</TooltipContent>
          </Tooltip>
        );
      })}
    </span>
  );
}

export function useWarningText() {
  const t = useTranslations("studio.warnings");
  return (w: AgentWarning) =>
    w.kind === "handoffToInactive" ? t("handoffToInactive", { name: w.targetName }) : t(w.kind);
}

export function WarningsIndicator({ warnings }: { warnings: AgentWarning[] }) {
  const text = useWarningText();
  if (!warnings.length) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-warning focus-visible:ring-ring inline-flex items-center gap-0.5 rounded text-xs font-semibold focus-visible:outline-none focus-visible:ring-2"
        >
          <AlertTriangle className="size-4" aria-hidden />
          <span className="num">{warnings.length}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <ul className="list-disc space-y-1 ps-4 text-xs">
          {warnings.map((w, i) => (
            <li key={i}>{text(w)}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
