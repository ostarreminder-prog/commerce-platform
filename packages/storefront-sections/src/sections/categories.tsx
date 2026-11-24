"use client";

import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { idsSetting, MaybeImage, strSetting, useLocalized, SectionHeading } from "./helpers";

const GRID: Record<string, string> = {
  "3": "grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-4",
  "6": "grid-cols-3 md:grid-cols-6",
};

export function CategoriesSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);
  const { categories, pickCategory } = useSectionData();

  const picked = idsSetting(s, "categoryIds").map(pickCategory).filter((c): c is NonNullable<typeof c> => Boolean(c));
  const list = picked.length ? picked : categories;
  const cols = GRID[strSetting(s, "columns", "6")] ?? GRID["6"];

  return (
    <section className="sec-pad">
      <div className="container">
        <SectionHeading title={L("title")} />
        {list.length ? (
          <div className={cn("grid gap-4", cols)}>
            {list.map((c, i) => {
              const name = c.name[locale] ?? c.name.ar;
              return (
                <a key={c.id} href={`/#${c.slug || c.id}`} className="group flex flex-col items-center gap-3 text-center">
                  <MaybeImage
                    url={c.image?.url}
                    hue={(i * 47 + 20) % 360}
                    label={name}
                    className="aspect-square w-full rounded-2xl border transition-shadow group-hover:shadow-md"
                  />
                  <span className="text-sm font-medium">{name}</span>
                </a>
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
