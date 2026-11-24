"use client";

import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { useTranslations } from "next-intl";
import type { SectionBlock, ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { blockText } from "../blocks-render";
import { MaybeImage, SectionHeading, SectionProductCard, isRealImageUrl, useLocalized } from "./helpers";

/* Asymmetric layout per tile count — the first tile is always the feature tile. */
const GRID: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};
const SPAN: Record<number, string[]> = {
  2: ["", ""],
  3: ["md:row-span-2", "md:col-span-2", "md:col-span-2"],
  4: ["md:col-span-2 md:row-span-2", "md:col-span-2", "", ""],
};

function CollageTile({ block }: { block: SectionBlock }) {
  const { locale } = useAppLocale();
  const { pickProduct } = useSectionData();
  const s = block.settings;

  switch (block.type) {
    case "image":
      return (
        <MaybeImage
          url={s.image}
          hue={Number(s.hue ?? 30) || 30}
          label={blockText(block, "alt", locale) || "·"}
          className="h-full w-full rounded-2xl object-cover"
        />
      );
    case "promo-card": {
      const title = blockText(block, "title", locale);
      const text = blockText(block, "text", locale);
      const cta = blockText(block, "ctaLabel", locale);
      const hue = Number(s.hue ?? 25) || 25;
      return (
        <a
          href={s.url || "/"}
          className="text-paper relative flex h-full min-h-40 flex-col justify-end overflow-hidden rounded-2xl p-6 shadow-sm"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${(hue + 30) % 360} 50% 22%))` }}
        >
          {isRealImageUrl(s.image) ? (
            <>
              <img src={s.image} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
              <span aria-hidden className="bg-ink/45 absolute inset-0" />
            </>
          ) : null}
          <span className="relative">
            {title ? <span className="block text-lg font-bold">{title}</span> : null}
            {text ? <span className="mt-1 block text-sm opacity-85">{text}</span> : null}
            {cta ? <span className="bg-paper/15 mt-3 inline-block rounded-full px-4 py-1.5 text-xs font-semibold">{cta}</span> : null}
          </span>
        </a>
      );
    }
    case "product-card": {
      const product = pickProduct(s.productId ?? "");
      if (!product) return null;
      return (
        <div className="bg-card h-full rounded-2xl border p-4">
          <SectionProductCard product={product} />
        </div>
      );
    }
    default:
      return null;
  }
}

/** Asymmetric 2–4 tile grid mixing image / promo-card / product-card blocks. */
export function CollageSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const L = useLocalized(section.settings);
  const tiles = section.blocks.slice(0, 4);
  const n = Math.max(2, tiles.length);

  return (
    <section className="sec-pad">
      <div className="container">
        <SectionHeading title={L("title")} align="start" />
        {tiles.length ? (
          <div className={cn("grid auto-rows-[minmax(9rem,auto)] gap-4", GRID[n] ?? GRID[4])}>
            {tiles.map((b, i) => (
              <div key={b.id} className={cn(SPAN[n]?.[i])}>
                <CollageTile block={b} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
