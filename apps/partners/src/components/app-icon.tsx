import { cn } from "@repo/ui/lib/cn";

export function AppIcon({ name, hue, className }: { name: string; hue: number; className?: string }) {
  return (
    <span
      className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-paper shadow-sm", className)}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 65% 55%), hsl(${(hue + 40) % 360} 60% 42%))` }}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  );
}
