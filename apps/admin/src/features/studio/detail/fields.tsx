"use client";

import type * as React from "react";
import { Label } from "@repo/ui/components/label";
import { cn } from "@repo/ui/lib/cn";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: React.ReactNode;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label> {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  id,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-input bg-background focus-within:ring-ring flex h-10 items-center rounded-md border focus-within:ring-2",
        className,
      )}
    >
      <input
        id={id}
        type="number"
        dir="ltr"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n))
            onChange(max !== undefined ? Math.min(max, Math.max(min ?? n, n)) : n);
        }}
        className="num w-full min-w-0 bg-transparent px-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
      {suffix ? (
        <span className="text-muted-foreground shrink-0 pe-3 text-xs">{suffix}</span>
      ) : null}
    </div>
  );
}

export function Range({
  value,
  onChange,
  min,
  max,
  step,
  id,
  format,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  id?: string;
  format: (v: number) => string;
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary h-2 flex-1 cursor-pointer disabled:cursor-not-allowed"
      />
      <span className="num bg-muted w-14 rounded-md py-1 text-center text-xs font-medium">
        {format(value)}
      </span>
    </div>
  );
}
