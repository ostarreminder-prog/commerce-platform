"use client";

import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/cn";

export function Choice({ checked, onSelect, title, hint, price }: { checked: boolean; onSelect: () => void; title: ReactNode; hint?: ReactNode; price?: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg border p-4 text-start transition-colors focus-visible:outline-none focus-visible:ring-2",
        checked ? "border-primary bg-primary/5" : "hover:bg-muted/50",
      )}
    >
      <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-full border-2", checked ? "border-primary bg-primary" : "border-muted-foreground/40")}>
        {checked ? <span className="bg-primary-foreground size-2 rounded-full" /> : null}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {hint ? <span className="text-muted-foreground block text-xs">{hint}</span> : null}
      </span>
      {price ? <span className="num text-sm font-medium">{price}</span> : null}
    </button>
  );
}
