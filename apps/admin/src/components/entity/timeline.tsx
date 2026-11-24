"use client";

import type { ActorRef, EntityRef } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatRelativeTime } from "@repo/ui/lib/format";
import { cn } from "@repo/ui/lib/cn";
import { Actor } from "./actor";
import { EntityLink } from "./entity-link";

export interface TimelineItem {
  id: string;
  at: string;
  actor: ActorRef;
  title: React.ReactNode;
  body?: React.ReactNode;
  link?: EntityRef | null;
  tone?: "default" | "success" | "warning" | "destructive" | "info";
  icon?: React.ComponentType<{ className?: string }>;
}

const DOT: Record<NonNullable<TimelineItem["tone"]>, string> = {
  default: "bg-muted-foreground/40",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
};

/** Unified timeline: events from every source, newest first, each with its actor (SCREENS_SPEC §1.7–1.8). */
export function Timeline({ items, className }: { items: TimelineItem[]; className?: string }) {
  const { locale } = useAppLocale();
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <ol className={cn("relative space-y-4", className)}>
      {sorted.map((item, i) => {
        const Icon = item.icon;
        return (
          <li key={item.id} className="relative flex gap-3">
            {i < sorted.length - 1 ? <span aria-hidden className="bg-border absolute inset-y-0 start-[0.6875rem] top-6 w-px" /> : null}
            <span className="bg-background relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border">
              {Icon ? <Icon className="text-muted-foreground size-3.5" /> : <span className={cn("size-2 rounded-full", DOT[item.tone ?? "default"])} />}
            </span>
            <div className="min-w-0 flex-1 space-y-1 pb-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-sm font-medium">
                  {item.title}
                  {item.link ? (
                    <>
                      
                      <EntityLink type={item.link.type} id={item.link.id} label={item.link.label} />
                    </>
                  ) : null}
                </p>
                <time dateTime={item.at} title={formatDateTime(item.at, locale)} className="text-muted-foreground text-xs">
                  {formatRelativeTime(item.at, locale)}
                </time>
              </div>
              {item.body ? <div className="text-muted-foreground text-sm">{item.body}</div> : null}
              <Actor actor={item.actor} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
