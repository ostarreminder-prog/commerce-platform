"use client";

import { useTranslations } from "next-intl";
import type { Category, Product } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import type { ExperienceProps } from "./types";
import { commerceLink, productHref } from "../commerce-context";
import { useSectionData } from "../data-context";
import type { SectionCommerceAdapter } from "../commerce-context";
import {
  boolSetting,
  compareAt,
  ExperienceHeader,
  idsSetting,
  MaybeImage,
  minPrice,
  productHue,
  strSetting,
} from "../sections/helpers";

const GRID = {
  compact: "grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6",
  normal: "grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4",
} as const;
const ASPECT = { compact: "aspect-square", normal: "aspect-[4/5]" } as const;

/** Shared overlay chrome — hidden until hover/focus/tap (focus-within). */
function TileOverlay({ title, sub }: { title: string; sub?: string | null }) {
  return (
    <div className="from-overlay/80 absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t to-transparent p-3 pt-10 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
      <p className="text-paper line-clamp-2 text-sm font-semibold leading-snug">{title}</p>
      {sub ? <p className="num text-paper/90 mt-1 text-xs font-semibold">{sub}</p> : null}
    </div>
  );
}

/** Product tile — image fills the tile, name+price reveal on hover/focus. */
function ProductTile({
  product,
  aspect,
  showPrice,
  adapter,
}: {
  product: Product;
  aspect: string;
  showPrice: boolean;
  adapter?: SectionCommerceAdapter | null;
}) {
  const { locale } = useAppLocale();
  const name = product.name[locale] ?? product.name.ar;
  const compare = compareAt(product);
  const LinkComp = commerceLink(adapter);
  return (
    <LinkComp href={productHref(adapter, product)} className={cn("group relative block overflow-hidden rounded-2xl", aspect)}>
      <MaybeImage
        url={product.media[0]?.url}
        hue={productHue(product)}
        label={name}
        className="aspect-auto absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <TileOverlay
        title={name}
        sub={
          showPrice
            ? `${formatMoney(minPrice(product), locale)}${compare ? `  ·  ${formatMoney(compare, locale)}` : ""}`
            : null
        }
      />
    </LinkComp>
  );
}

/** Category tile — category image + name overlay; links to the category anchor. */
function CategoryTile({ category, index, aspect, adapter }: { category: Category; index: number; aspect: string; adapter?: SectionCommerceAdapter | null }) {
  const { locale } = useAppLocale();
  const name = category.name[locale] ?? category.name.ar;
  const LinkComp = commerceLink(adapter);
  return (
    <LinkComp href={`/#${category.slug || category.id}`} className={cn("group relative block overflow-hidden rounded-2xl", aspect)}>
      <MaybeImage
        url={category.image?.url}
        hue={(index * 47 + 20) % 360}
        label={name}
        className="aspect-auto absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <TileOverlay title={name} />
    </LinkComp>
  );
}

/**
 * Visual discovery — image-first tiles with no card chrome. `source` picks
 * product tiles (the section's resolved list) or category tiles (`categoryIds`,
 * catalog fallback); `density` tightens the grid and `showPrice` gates the
 * price line in the reveal overlay.
 */
export function VisualDiscoveryExperience({ products, settings, adapter }: ExperienceProps) {
  const t = useTranslations("msg.sections");
  const { categories, pickCategory } = useSectionData();
  const source = strSetting(settings, "source", "products");
  const mode = strSetting(settings, "density", "normal") === "compact" ? "compact" : "normal";
  const density = GRID[mode];
  const aspect = ASPECT[mode];
  const showPrice = boolSetting(settings, "showPrice", true);

  const cats =
    source === "categories"
      ? (() => {
          const picked = idsSetting(settings, "categoryIds")
            .map(pickCategory)
            .filter((c): c is Category => Boolean(c));
          return picked.length ? picked : categories;
        })()
      : [];

  return (
    <section className="sec-pad">
      <div className="container">
        <ExperienceHeader s={settings} />
        {source === "categories" ? (
          cats.length ? (
            <div className={cn("grid", density)}>
              {cats.map((c, i) => (
                <CategoryTile key={c.id} category={c} index={i} aspect={aspect} adapter={adapter} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
          )
        ) : products.length ? (
          <div className={cn("grid", density)}>
            {products.map((p) => (
              <ProductTile key={p.id} product={p} aspect={aspect} showPrice={showPrice} adapter={adapter} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        )}
      </div>
    </section>
  );
}
