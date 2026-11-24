"use client";

import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { SectionBlock, ThemeSection } from "../types";
import { MaybeImage, SectionHeading, boolSetting, useLocalized } from "./helpers";

/** Brand logos row — static centered wrap, or an auto-scrolling marquee. */
export function LogoListSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const s = section.settings;
  const L = useLocalized(s);
  const marquee = boolSetting(s, "marquee");
  const grayscale = boolSetting(s, "grayscale", true);
  const logos = section.blocks;

  const item = (b: SectionBlock) => (
    <div key={b.id} className="flex w-32 shrink-0 flex-col items-center gap-2 md:w-36">
      <MaybeImage
        url={b.settings.image}
        hue={Number(b.settings.hue ?? 200) || 200}
        label={b.settings.name || "·"}
        className={cn(
          "h-14 w-full rounded-xl border object-contain p-2 transition",
          grayscale && "opacity-70 grayscale hover:opacity-100 hover:grayscale-0",
        )}
      />
      {b.settings.name ? <span className="text-muted-foreground text-xs font-medium">{b.settings.name}</span> : null}
    </div>
  );

  return (
    <section className="sec-pad">
      <div className="container">
        <SectionHeading title={L("title")} />
        {!logos.length ? (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        ) : marquee ? (
          /* dir="ltr" keeps the -50% translate loop direction-stable under RTL. */
          <div className="overflow-hidden" dir="ltr">
            <div className="animate-marquee flex w-max hover:[animation-play-state:paused]">
              {[0, 1].map((dup) => (
                <div key={dup} className="flex gap-8 pe-8" aria-hidden={dup === 1 || undefined}>
                  {logos.map(item)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">{logos.map(item)}</div>
        )}
      </div>
    </section>
  );
}
