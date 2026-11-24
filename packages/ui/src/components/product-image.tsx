import * as React from "react";
import { cn } from "../lib/cn";

export interface ProductImageProps {
  /** Hue (0-360) of the placeholder artwork. */
  hue: number;
  label: string;
  className?: string;
}

/** Deterministic placeholder artwork until real product media is wired. */
export function ProductImage({ hue, label, className }: ProductImageProps) {
  const initial = label.trim().charAt(0);
  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-md",
        className,
      )}
      style={{
        containerType: "inline-size",
        background: `linear-gradient(135deg, hsl(${hue} 45% 88%), hsl(${(hue + 25) % 360} 35% 76%))`,
      }}
    >
      <span
        aria-hidden
        className="absolute size-3/5 rounded-full opacity-40"
        style={{ background: `hsl(${hue} 40% 96%)` }}
      />
      <span
        aria-hidden
        className="relative text-[clamp(0.75rem,30cqw,2.5rem)] font-semibold"
        style={{ color: `hsl(${hue} 35% 30%)` }}
      >
        {initial}
      </span>
    </div>
  );
}
