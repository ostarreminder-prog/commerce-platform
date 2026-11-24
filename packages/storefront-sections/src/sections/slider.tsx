"use client";

import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { isRealImageUrl } from "@repo/ui/lib/media";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { SectionHeading, useLocalized } from "./helpers";

function blockL(block: ThemeSection["blocks"][number], base: string, locale: "ar" | "en"): string {
  const s = block.settings;
  const primary = s[`${base}${locale === "ar" ? "Ar" : "En"}`];
  if (primary?.trim()) return primary;
  return s[`${base}${locale === "ar" ? "En" : "Ar"}`] ?? "";
}

export function SliderSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const L = useLocalized(section.settings);
  const slides = section.blocks;

  return (
    <section className="sec-pad">
      <div className="container">
        <SectionHeading title={L("title")} align="start" />
        <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2">
          {slides.map((slide) => {
            const hue = Number(slide.settings.hue ?? 200) || 0;
            const image = slide.settings.image;
            return (
              <div
                key={slide.id}
                className="relative w-72 shrink-0 snap-start overflow-hidden rounded-2xl p-6 text-paper shadow-sm md:w-80"
                style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 30%), hsl(${(hue + 30) % 360} 50% 22%))` }}
              >
                {isRealImageUrl(image) ? (
                  <>
                    <img src={image} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
                    <span aria-hidden className="bg-ink/45 absolute inset-0" />
                  </>
                ) : null}
                <div className="relative">
                  <p className="text-lg font-bold leading-snug">{blockL(slide, "title", locale)}</p>
                  <p className="mt-2 text-sm opacity-85">{blockL(slide, "text", locale)}</p>
                  <span className="bg-paper/15 mt-4 inline-block rounded-full px-4 py-1.5 text-xs font-semibold">
                    {blockL(slide, "ctaLabel", locale) || t("shopNow")}
                  </span>
                </div>
              </div>
            );
          })}
          {!slides.length ? <p className="text-muted-foreground py-8 text-sm">{t("empty")}</p> : null}
        </div>
      </div>
    </section>
  );
}
