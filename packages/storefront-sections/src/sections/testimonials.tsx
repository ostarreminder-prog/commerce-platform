"use client";

import { Quote, Star } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { SectionHeading, useLocalized } from "./helpers";

function blockL(block: ThemeSection["blocks"][number], base: string, locale: "ar" | "en"): string {
  const s = block.settings;
  return s[`${base}${locale === "ar" ? "Ar" : "En"}`] || s[`${base}${locale === "ar" ? "En" : "Ar"}`] || "";
}

export function TestimonialsSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const L = useLocalized(section.settings);

  return (
    <section className="bg-muted/40 sec-pad-lg">
      <div className="container">
        <SectionHeading title={L("title")} />
        {section.blocks.length ? (
          <div className="grid gap-5 md:grid-cols-3">
            {section.blocks.map((b) => {
              const rating = Math.min(5, Math.max(1, Number(b.settings.rating ?? "5") || 5));
              return (
                <figure key={b.id} className="bg-card text-card-foreground flex flex-col gap-4 rounded-2xl border p-6 shadow-sm">
                  <Quote className="text-primary/60 size-7" aria-hidden />
                  <div className="flex gap-0.5" aria-label={`${rating}/5`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn("size-4", i < rating ? "fill-warning text-warning" : "text-muted")} aria-hidden />
                    ))}
                  </div>
                  <blockquote className="text-sm leading-relaxed">{blockL(b, "quote", locale)}</blockquote>
                  <figcaption className="mt-auto">
                    <p className="text-sm font-semibold">{b.settings.name ?? ""}</p>
                    <p className="text-muted-foreground text-xs">{blockL(b, "role", locale)}</p>
                  </figcaption>
                </figure>
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
