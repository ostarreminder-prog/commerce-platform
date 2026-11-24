"use client";

import { cn } from "@repo/ui/lib/cn";
import type { ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { SectionBlocks } from "../blocks-render";
import { idsSetting, MaybeImage, productHue, strSetting } from "./helpers";

/**
 * Block-driven hero — content (badge/heading/text/button/image…) lives in
 * `section.blocks`; `productIds` still drives the split-layout collage.
 */
export function HeroSection({ section }: { section: ThemeSection }) {
  const s = section.settings;
  const { pickProduct } = useSectionData();

  const centered = strSetting(s, "layout", "split") === "center";
  const collage = idsSetting(s, "productIds").map(pickProduct).filter((p): p is NonNullable<typeof p> => Boolean(p)).slice(0, 3);

  return (
    <section className="from-primary via-primary/90 to-primary/70 text-primary-foreground bg-gradient-to-br">
      <div className={cn("container grid items-center gap-10 sec-pad-lg", !centered && collage.length && "md:grid-cols-2")}>
        <SectionBlocks blocks={section.blocks} onPrimary className={cn(centered && "mx-auto max-w-2xl items-center text-center")} />
        {collage.length ? (
          <div className={cn("hidden gap-4 md:flex", centered ? "mx-auto max-w-md justify-center" : "justify-end")}>
            {collage.map((p, i) => (
              <MaybeImage
                key={p.id}
                url={p.media[0]?.url}
                hue={productHue(p)}
                label={p.name.ar}
                className={cn(
                  "w-28 rounded-2xl shadow-lg ring-1 ring-foreground/10 lg:w-36",
                  i === 1 ? "translate-y-6" : i === 2 ? "-translate-y-4" : "",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
