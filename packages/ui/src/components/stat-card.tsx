import * as React from "react";
import { type LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../lib/cn";
import { formatPercent } from "../lib/format";
import { Card } from "./card";
import { Skeleton } from "./skeleton";

export interface StatCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  /** Change ratio vs. previous period, e.g. 0.12 for +12%. */
  delta?: number;
  hint?: string;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, delta, hint, className }: StatCardProps) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-sm">{label}</p>
        {Icon ? (
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-md">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="num mt-2 whitespace-nowrap text-xl font-semibold sm:text-2xl">{value}</p>
      {delta !== undefined || hint ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {delta !== undefined ? (
            <span
              className={cn(
                "num inline-flex items-center gap-1 font-medium",
                positive ? "text-success" : "text-destructive",
              )}
            >
              {positive ? (
                <TrendingUp className="size-3.5" aria-hidden />
              ) : (
                <TrendingDown className="size-3.5" aria-hidden />
              )}
              {formatPercent(Math.abs(delta))}
            </span>
          ) : null}
          {hint ? <span className="text-muted-foreground">{hint}</span> : null}
        </div>
      ) : null}
    </Card>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("space-y-3 p-5", className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </Card>
  );
}
