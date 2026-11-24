import * as React from "react";
import { cn } from "@repo/ui/lib/cn";

/**
 * Quoted-content rule: entity-derived text inside assistant messages (tables,
 * affected items, diffs) renders inside a bordered quote block so generated
 * prose stays visually distinct from quoted data.
 */
export function Quote({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("border-border bg-muted/40 rounded-md border-s-4 py-2 pe-3 ps-3", className)}>
      {children}
    </div>
  );
}
