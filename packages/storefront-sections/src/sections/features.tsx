"use client";

import { Gem, Gift, Leaf, MessageCircle, RefreshCcw, ShieldCheck, Star, Truck, type LucideIcon } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { SectionHeading, strSetting, useLocalized } from "./helpers";

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

const GRID: Record<string, string> = {
  "2": "sm:grid-cols-2",
  "3": "sm:grid-cols-3",
  "4": "sm:grid-cols-2 lg:grid-cols-4",
};

function blockL(block: ThemeSection["blocks"][number], base: string, locale: "ar" | "en"): string {
  const s = block.settings;
  return s[`${base}${locale === "ar" ? "Ar" : "En"}`] || s[`${base}${locale === "ar" ? "En" : "Ar"}`] || "";
}

export function FeaturesSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const L = useLocalized(section.settings);
  const cols = GRID[strSetting(section.settings, "columns", "4")] ?? GRID["4"];

  return (
    <section className="border-y sec-pad">
      <div className="container">
        <SectionHeading title={L("title")} />
        {section.blocks.length ? (
          <div className={cn("grid gap-6", cols)}>
            {section.blocks.map((b) => {
              const Icon = ICONS[b.settings.icon ?? ""] ?? Star;
              return (
                <div key={b.id} className="flex items-start gap-4">
                  <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{blockL(b, "title", locale)}</p>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{blockL(b, "text", locale)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
