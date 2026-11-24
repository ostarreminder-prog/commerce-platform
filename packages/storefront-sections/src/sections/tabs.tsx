"use client";

import * as React from "react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { SectionBlock, ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { blockText } from "../blocks-render";
import { SectionHeading, SectionProductCard, useLocalized } from "./helpers";

/** `tab` blocks — each tab shows localized content text and/or a product grid. */
export function TabsSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const L = useLocalized(section.settings);
  const { pickProduct } = useSectionData();
  const [active, setActive] = React.useState(0);

  const tabs = section.blocks;
  const current = tabs[Math.min(active, tabs.length - 1)];
  const content = current ? blockText(current, "content", locale) : "";
  const products = (current?.settings.productIds ?? "")
    .split(",")
    .map((id) => pickProduct(id.trim()))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <section className="sec-pad">
      <div className="container">
        <SectionHeading title={L("title")} />
        {!tabs.length ? (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        ) : (
          <>
            <div className="no-scrollbar mb-8 flex justify-start gap-2 overflow-x-auto border-b md:justify-center" role="tablist">
              {tabs.map((b: SectionBlock, i) => {
                const isActive = i === Math.min(active, tabs.length - 1);
                return (
                  <button
                    key={b.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActive(i)}
                    className={cn(
                      "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
                      isActive ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground border-transparent",
                    )}
                  >
                    {blockText(b, "label", locale) || `${i + 1}`}
                  </button>
                );
              })}
            </div>
            {current ? (
              <div role="tabpanel" className="space-y-8">
                {content ? <p className="text-muted-foreground mx-auto max-w-2xl text-center leading-relaxed">{content}</p> : null}
                {products.length ? (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
                    {products.map((p) => (
                      <SectionProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : null}
                {!content && !products.length ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
