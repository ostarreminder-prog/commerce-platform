"use client";

import { Bot, Cog, Puzzle, User, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ActorRef } from "@repo/contracts";
import { cn } from "@repo/ui/lib/cn";
import { EntityLink } from "./entity-link";

const ICONS = { staff: User, agent: Bot, app: Puzzle, system: Cog, customer: UserRound } as const;

/** Who did it: staff, agent, app, system or customer (SCREENS_SPEC §1.8). */
export function Actor({ actor, className }: { actor: ActorRef; className?: string }) {
  const t = useTranslations("actor");
  const Icon = ICONS[actor.type];
  const name =
    actor.type === "agent" ? <EntityLink type="agent" id={actor.id} label={actor.name} />
    : actor.type === "customer" ? <EntityLink type="customer" id={actor.id} label={actor.name} />
    : actor.type === "app" ? <EntityLink type="installation" id={actor.id} label={actor.name} />
    : actor.type === "system" ? t("system")
    : actor.name;
  return (
    <span className={cn("text-muted-foreground inline-flex items-center gap-1 text-xs", className)}>
      <Icon className="size-3.5 shrink-0" aria-label={t(actor.type)} />
      <span className="truncate">{name}</span>
    </span>
  );
}
