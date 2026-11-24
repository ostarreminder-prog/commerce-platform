import * as React from "react";
import { getTranslations } from "next-intl/server";

export const DS_SECTIONS = [
  "colors",
  "typography",
  "buttons",
  "badges",
  "forms",
  "money",
  "cards",
  "states",
  "table",
  "overlays",
  "misc",
] as const;

export type DsSectionId = (typeof DS_SECTIONS)[number];

export async function DsSection({ id, children }: { id: DsSectionId; children: React.ReactNode }) {
  const t = await getTranslations(`designSystem.sections.${id}`);
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-24 space-y-5 border-t pt-10 first:border-t-0 first:pt-0"
    >
      <div className="space-y-1">
        <h2 id={`${id}-title`} className="text-xl font-semibold">
          {t("title")}
        </h2>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>
      {children}
    </section>
  );
}
