"use client";

import * as React from "react";
import { ShoppingBag, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import type { ExperienceProps } from "./types";
import type { SectionCommerceAdapter } from "../commerce-context";
import { commerceLink, productHref } from "../commerce-context";
import { boolSetting, compareAt, ExperienceHeader, MaybeImage, minPrice, numSetting, productHue } from "../sections/helpers";

interface SpecRow {
  key: string;
  /** Comparable value — rows whose raws differ across columns get highlighted. */
  raw: (p: Product, locale: "ar" | "en") => string;
  render: (p: Product, locale: "ar" | "en") => React.ReactNode;
}

/** Product column header — media, name, price and a commerce CTA. */
function CompareColumn({ product, adapter }: { product: Product; adapter?: SectionCommerceAdapter | null }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const name = product.name[locale] ?? product.name.ar;
  const LinkComp = commerceLink(adapter);
  return (
    <div className="bg-background flex flex-col p-4" data-compare-col>
      <LinkComp href={productHref(adapter, product)} className="group block">
        <MaybeImage
          url={product.media[0]?.url}
          hue={productHue(product)}
          label={name}
          className="aspect-square w-full rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </LinkComp>
      <LinkComp href={productHref(adapter, product)} className="mt-3 line-clamp-2 min-h-10 text-sm font-medium leading-snug hover:underline">
        {name}
      </LinkComp>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="num text-sm font-bold">{formatMoney(minPrice(product), locale)}</span>
        {compareAt(product) ? (
          <span className="num text-muted-foreground text-xs line-through">{formatMoney(compareAt(product) ?? 0, locale)}</span>
        ) : null}
      </div>
      {adapter?.addToCart ? (
        <button
          type="button"
          onClick={() => adapter.addToCart?.(product)}
          className="bg-primary text-primary-foreground mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="size-3.5" aria-hidden />
          {t("addToCart")}
        </button>
      ) : (
        <LinkComp
          href={productHref(adapter, product)}
          className="bg-primary text-primary-foreground mt-3 inline-flex h-9 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
        >
          {t("viewDetails")}
        </LinkComp>
      )}
    </div>
  );
}

/**
 * Spec comparison — one column per product with commerce-styled spec rows
 * (price / rating / brand / options / variants / type / shipping). Rows whose
 * values differ get an accent tint when `highlightDiffs` is on. The registry
 * guards with `minProducts: 2` (a lone product falls back to the grid).
 */
export function ComparisonExperience({ products, settings, adapter }: ExperienceProps) {
  /* Loose translator — row labels resolve dynamically (`compare.${key}`). */
  const t = useTranslations("msg.sections") as unknown as (key: string) => string;
  const { locale } = useAppLocale();
  const max = Math.max(2, numSetting(settings, "maxColumns", 4));
  const highlight = boolSetting(settings, "highlightDiffs", true);
  const list = products.slice(0, max);

  const rows: SpecRow[] = [
    {
      key: "price",
      raw: (p) => String(minPrice(p)),
      render: (p, loc) => <span className="num text-sm font-semibold">{formatMoney(minPrice(p), loc)}</span>,
    },
    {
      key: "rating",
      raw: (p) => `${p.rating}/${p.reviewsCount}`,
      render: (p) => (
        <span className="flex items-center gap-1 text-sm">
          <Star className="fill-warning text-warning size-4" aria-hidden />
          <span className="num">{formatNumber(p.rating, { maximumFractionDigits: 1 })}</span>
          <span className="text-muted-foreground num text-xs">({formatNumber(p.reviewsCount)})</span>
        </span>
      ),
    },
    {
      key: "brand",
      raw: (p) => p.brand ?? "",
      render: (p) => <span className="text-sm">{p.brand ?? "—"}</span>,
    },
    {
      key: "options",
      raw: (p, loc) => p.options.map((o) => o.name[loc] ?? o.name.ar).join(","),
      render: (p, loc) =>
        p.options.length ? (
          <span className="text-sm">{p.options.map((o) => o.name[loc] ?? o.name.ar).join("، ")}</span>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: "variants",
      raw: (p) => String(p.variants.length),
      render: (p) => <span className="num text-sm">{formatNumber(p.variants.length)}</span>,
    },
    {
      key: "type",
      raw: (p) => p.type,
      render: (p) => <span className="text-sm">{t(`compare.${p.type}`)}</span>,
    },
    {
      key: "shipping",
      raw: (p) => String(p.requiresShipping),
      render: (p) => <span className="text-sm">{t(p.requiresShipping ? "compare.shipsYes" : "compare.shipsNo")}</span>,
    },
  ];

  if (list.length < 2) {
    return (
      <section className="sec-pad">
        <div className="container">
          <ExperienceHeader s={settings} />
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="sec-pad">
      <div className="container">
        <ExperienceHeader s={settings} />
        <div className="overflow-x-auto">
          <div
            className="bg-border grid min-w-max gap-px overflow-hidden rounded-xl border"
            style={{ gridTemplateColumns: `minmax(6.5rem,9rem) repeat(${list.length}, minmax(11rem,1fr))` }}
          >
            <div className="bg-background" aria-hidden />
            {list.map((p) => (
              <CompareColumn key={p.id} product={p} adapter={adapter} />
            ))}
            {rows.map((row) => {
              const diff = new Set(list.map((p) => row.raw(p, locale))).size > 1;
              const marked = highlight && diff;
              return (
                <React.Fragment key={row.key}>
                  <div
                    data-diff={diff || undefined}
                    className={cn(
                      "bg-background text-muted-foreground flex items-center p-3 text-xs font-medium md:text-sm",
                      marked && "text-primary font-semibold",
                    )}
                  >
                    {t(`compare.${row.key}`)}
                  </div>
                  {list.map((p) => (
                    <div key={p.id} className={cn("bg-background flex items-center p-3", marked && "bg-accent/60")}>
                      {row.render(p, locale)}
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
