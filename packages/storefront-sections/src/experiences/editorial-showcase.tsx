"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import type { ExperienceProps } from "./types";
import type { SectionCommerceAdapter } from "../commerce-context";
import { commerceLink, productHref } from "../commerce-context";
import { boolSetting, compareAt, MaybeImage, minPrice, productHue, useLocalized } from "../sections/helpers";

/** Large overlay card — the hero spans two tracks, secondary tiles stagger. */
function EditorialCard({
  product,
  featured,
  adapter,
  className,
}: {
  product: Product;
  featured?: boolean;
  adapter?: SectionCommerceAdapter | null;
  className?: string;
}) {
  const { locale } = useAppLocale();
  const name = product.name[locale] ?? product.name.ar;
  const price = minPrice(product);
  const LinkComp = commerceLink(adapter);
  return (
    <LinkComp
      href={productHref(adapter, product)}
      className={cn("group relative flex flex-col overflow-hidden rounded-2xl", className)}
    >
      <MaybeImage
        url={product.media[0]?.url}
        hue={productHue(product)}
        label={name}
        className={cn(
          "aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105",
          featured && "h-full min-h-72 md:aspect-auto lg:min-h-96",
        )}
      />
      <div className="from-overlay/80 absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent p-4 pt-12">
        <p className={cn("text-paper line-clamp-2 font-semibold leading-snug", featured ? "text-lg md:text-2xl" : "text-sm")}>
          {name}
        </p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="num text-paper/90 text-sm font-semibold">{formatMoney(price, locale)}</span>
          {compareAt(product) ? (
            <span className="num text-paper/60 text-xs line-through">{formatMoney(compareAt(product) ?? 0, locale)}</span>
          ) : null}
        </div>
      </div>
    </LinkComp>
  );
}

/**
 * Magazine-style showcase — one hero product plus staggered secondary tiles.
 * Falls back gracefully to simpler layouts when fewer than three products.
 */
export function EditorialShowcaseExperience({ products, section, adapter }: ExperienceProps) {
  const t = useTranslations("msg.sections");
  const { dir } = useAppLocale();
  const s = section.settings;
  const L = useLocalized(s);
  const [hero, ...rest] = products;

  return (
    <section className="sec-pad">
      <div className="container">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div className="max-w-2xl">
            {L("title") ? <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{L("title")}</h2> : null}
            {L("subtitle") ? <p className="text-muted-foreground mt-3 text-sm md:text-base">{L("subtitle")}</p> : null}
          </div>
          {boolSetting(s, "showViewAll", true) ? (
            <a href="/products" className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold hover:underline">
              {t("viewAll")}
              <ArrowLeft className={cn("size-4", dir === "ltr" && "rotate-180")} aria-hidden />
            </a>
          ) : null}
        </div>
        {!hero ? (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        ) : (
          <div className={cn("grid gap-5", rest.length ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-2")}>
            <EditorialCard product={hero} featured adapter={adapter} className={rest.length ? "md:col-span-2 lg:row-span-2" : ""} />
            {rest.slice(0, 4).map((p, i) => (
              <EditorialCard key={p.id} product={p} adapter={adapter} className={cn(i % 2 === 1 && "lg:translate-y-6")} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
