"use client";

import {
  Gem,
  Gift,
  Leaf,
  MessageCircle,
  RefreshCcw,
  ShieldCheck,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { SectionBlock } from "./types";
import { MaybeImage } from "./sections/helpers";

const ICONS: Record<string, LucideIcon> = {
  truck: Truck,
  shield: ShieldCheck,
  refresh: RefreshCcw,
  gift: Gift,
  star: Star,
  chat: MessageCircle,
  leaf: Leaf,
  gem: Gem,
};

const HEADING_SIZE: Record<string, string> = {
  md: "text-xl md:text-2xl",
  lg: "text-3xl md:text-5xl",
  xl: "text-4xl md:text-6xl",
};

/** Reads a localized block setting (`<base>Ar` / `<base>En`) with cross-locale fallback. */
export function blockText(block: SectionBlock, base: string, locale: "ar" | "en"): string {
  const s = block.settings;
  const primary = s[`${base}${locale === "ar" ? "Ar" : "En"}`];
  if (primary?.trim()) return primary;
  return s[`${base}${locale === "ar" ? "En" : "Ar"}`] ?? "";
}

/**
 * Generic block renderer — used by block-driven sections (hero, main-product
 * text blocks…). Section-scoped blocks (slide/testimonial/…) render through
 * their owning section instead and return null here.
 */
export function BlockRenderer({ block, onPrimary }: { block: SectionBlock; onPrimary?: boolean }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const s = block.settings;

  switch (block.type) {
    case "heading": {
      const text = blockText(block, "text", locale);
      if (!text) return null;
      return <h2 className={cn("font-bold leading-tight tracking-tight", HEADING_SIZE[s.size ?? "lg"] ?? HEADING_SIZE.lg)}>{text}</h2>;
    }
    case "text": {
      const content = blockText(block, "content", locale);
      if (!content) return null;
      return <p className={cn("max-w-xl leading-relaxed", onPrimary ? "opacity-85" : "text-muted-foreground")}>{content}</p>;
    }
    case "button": {
      const label = blockText(block, "label", locale) || t("shopNow");
      const outline = s.style === "outline";
      return (
        <a
          href={s.url || "/"}
          className={cn(
            "inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90",
            outline ? "border-current border bg-transparent" : onPrimary ? "bg-paper text-ink" : "bg-primary text-primary-foreground",
          )}
        >
          {label}
        </a>
      );
    }
    case "image":
      return (
        <MaybeImage
          url={s.image}
          hue={Number(s.hue ?? 30) || 30}
          label={blockText(block, "alt", locale) || "·"}
          className="w-full max-w-md rounded-2xl shadow-sm"
        />
      );
    case "icon-item": {
      const Icon = ICONS[s.icon ?? ""] ?? Star;
      return (
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold">{blockText(block, "title", locale)}</p>
            <p className={cn("mt-0.5 text-xs leading-relaxed", onPrimary ? "opacity-80" : "text-muted-foreground")}>
              {blockText(block, "text", locale)}
            </p>
          </div>
        </div>
      );
    }
    case "badge": {
      const label = blockText(block, "label", locale);
      if (!label) return null;
      return (
        <span
          className={cn(
            "inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold",
            onPrimary ? "bg-paper/15" : "bg-primary/10 text-primary",
          )}
        >
          {label}
        </span>
      );
    }
    case "divider":
      return <hr className={cn("border-t", onPrimary ? "border-paper/25" : "border-border")} />;
    default:
      return null;
  }
}

/** Render a section's generic blocks in order inside a vertical stack. */
export function SectionBlocks({ blocks, onPrimary, className }: { blocks: SectionBlock[]; onPrimary?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} onPrimary={onPrimary} />
      ))}
    </div>
  );
}
