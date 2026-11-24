"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import type { ExperienceProps } from "./types";
import { boolSetting, SectionProductCard, useLocalized } from "../sections/helpers";

/**
 * The classic products grid — the default `view` for featured-products.
 * Its DOM mirrors the section's original markup so existing selectors hold.
 */
export function AdaptiveGridExperience({ products, section }: ExperienceProps) {
  const t = useTranslations("msg.sections");
  const { dir } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);

  return (
    <section className="sec-pad">
      <div className="container">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            {L("title") ? <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{L("title")}</h2> : null}
            {L("subtitle") ? <p className="text-muted-foreground mt-2 text-sm md:text-base">{L("subtitle")}</p> : null}
          </div>
          {boolSetting(s, "showViewAll", true) ? (
            <a href="/products" className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold hover:underline">
              {t("viewAll")}
              <ArrowLeft className={cn("size-4", dir === "ltr" && "rotate-180")} aria-hidden />
            </a>
          ) : null}
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <SectionProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
