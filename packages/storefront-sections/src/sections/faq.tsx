"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { SectionHeading, useLocalized } from "./helpers";

function blockL(block: ThemeSection["blocks"][number], base: string, locale: "ar" | "en"): string {
  const s = block.settings;
  return s[`${base}${locale === "ar" ? "Ar" : "En"}`] || s[`${base}${locale === "ar" ? "En" : "Ar"}`] || "";
}

export function FaqSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const L = useLocalized(section.settings);
  const [open, setOpen] = React.useState<number>(0);

  return (
    <section className="sec-pad-lg">
      <div className="container max-w-3xl">
        <SectionHeading title={L("title")} />
        {section.blocks.length ? (
          <div className="divide-y rounded-2xl border">
            {section.blocks.map((b, i) => {
              const isOpen = open === i;
              return (
                <div key={b.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start text-sm font-semibold"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    {blockL(b, "q", locale)}
                    <ChevronDown className={cn("text-muted-foreground size-4 shrink-0 transition-transform", isOpen && "rotate-180")} aria-hidden />
                  </button>
                  {isOpen ? <p className="text-muted-foreground px-5 pb-5 text-sm leading-relaxed">{blockL(b, "a", locale)}</p> : null}
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
