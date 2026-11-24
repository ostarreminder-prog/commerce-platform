"use client";

import * as React from "react";
import { ArrowLeft, Eye, Heart, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { ProductImage } from "@repo/ui/components/product-image";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { isRealImageUrl } from "@repo/ui/lib/media";
import { formatMoney } from "@repo/ui/lib/format";
import type { SectionSettings } from "../types";
import { commerceLink, productHref, useSectionCommerce } from "../commerce-context";

/** Reads localized settings stored as `<base>Ar` / `<base>En` flat keys, with cross-locale fallback. */
export function useLocalized(settings: SectionSettings) {
  const { locale } = useAppLocale();
  return React.useCallback(
    (base: string): string => {
      const primary = settings[`${base}${locale === "ar" ? "Ar" : "En"}`];
      if (typeof primary === "string" && primary.trim()) return primary;
      const fallback = settings[`${base}${locale === "ar" ? "En" : "Ar"}`];
      return typeof fallback === "string" ? fallback : "";
    },
    [settings, locale],
  );
}

export const strSetting = (s: SectionSettings, key: string, d = ""): string => {
  const v = s[key];
  return typeof v === "string" ? v : d;
};
export const numSetting = (s: SectionSettings, key: string, d = 0): number => {
  const v = s[key];
  return typeof v === "number" ? v : d;
};
export const boolSetting = (s: SectionSettings, key: string, d = false): boolean => {
  const v = s[key];
  return typeof v === "boolean" ? v : d;
};
export const idsSetting = (s: SectionSettings, key: string): string[] => {
  const v = s[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
};

export { isRealImageUrl };

/** Media urls are `placeholder:<hue>` until real assets land — recover the hue for ProductImage. */
export function productHue(p: Product): number {
  const url = p.media[0]?.url ?? "";
  const match = /^placeholder:(\d+)/.exec(url);
  if (match) return Number(match[1]);
  let hash = 0;
  for (const ch of p.id) hash = (hash * 31 + ch.charCodeAt(0)) % 360;
  return hash;
}

export function minPrice(p: Product): number {
  if (!p.variants.length) return 0;
  return Math.min(...p.variants.map((v) => v.price.amount));
}

export function compareAt(p: Product): number | null {
  const variant = p.variants.find((v) => v.compareAtPrice && v.compareAtPrice.amount > v.price.amount);
  return variant?.compareAtPrice?.amount ?? null;
}

/**
 * Real image (`https:`/`data:`/`blob:` url) with a `placeholder:<hue>` fallback —
 * used wherever a section or entity media url may hold either.
 */
export function MaybeImage({
  url,
  hue,
  label,
  className,
}: {
  url?: string | null;
  hue: number;
  label: string;
  className?: string;
}) {
  if (isRealImageUrl(url)) {
    return <img src={url} alt={label} loading="lazy" className={cn("aspect-square w-full object-cover", className)} />;
  }
  return <ProductImage hue={hue} label={label} className={className} />;
}

/** Small overlay icon button (wishlist / quick view) on the card image. */
function CardIcon({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "bg-background/90 flex size-8 items-center justify-center rounded-full shadow-sm transition-colors hover:bg-background",
        active && "text-destructive",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Compact product tile used by hero collages, featured grids and sliders.
 * Without a commerce adapter it renders the plain link card (unchanged DOM);
 * with one it gains wishlist/quick-view overlays and an add-to-cart button.
 */
export function SectionProductCard({ product, className }: { product: Product; className?: string }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const adapter = useSectionCommerce();
  const name = product.name[locale] ?? product.name.ar;
  const price = minPrice(product);
  const compare = compareAt(product);
  const saleBadge = compare ? (
    <span className="bg-destructive text-destructive-foreground absolute start-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold">
      %
    </span>
  ) : null;

  if (!adapter) {
    return (
      <a href={`/p/${product.slug || product.id}`} className={cn("group flex flex-col", className)}>
        <div className="relative overflow-hidden rounded-xl">
          <MaybeImage
            url={product.media[0]?.url}
            hue={productHue(product)}
            label={name}
            className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
          />
          {saleBadge}
        </div>
        <p className="mt-3 line-clamp-2 text-sm font-medium leading-snug">{name}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num text-sm font-semibold">{formatMoney(price, locale)}</span>
          {compare ? <span className="num text-muted-foreground text-xs line-through">{formatMoney(compare, locale)}</span> : null}
        </div>
      </a>
    );
  }

  const LinkComp = commerceLink(adapter);
  const href = productHref(adapter, product);
  const wishlisted = adapter.wishlist?.has(product.id) ?? false;
  return (
    <div className={cn("group relative flex flex-col", className)}>
      <LinkComp href={href} className="relative block overflow-hidden rounded-xl">
        <MaybeImage
          url={product.media[0]?.url}
          hue={productHue(product)}
          label={name}
          className="aspect-square w-full transition-transform duration-300 group-hover:scale-105"
        />
        {saleBadge}
      </LinkComp>
      <div className="absolute end-2 top-2 z-10 flex flex-col gap-1.5">
        {adapter.wishlist ? (
          <CardIcon label={t("wishlist")} active={wishlisted} onClick={() => adapter.wishlist?.toggle(product)}>
            <Heart className={cn("size-4", wishlisted && "fill-destructive")} aria-hidden />
          </CardIcon>
        ) : null}
        {adapter.quickView ? (
          <CardIcon label={t("quickView")} onClick={() => adapter.quickView?.(product)}>
            <Eye className="size-4" aria-hidden />
          </CardIcon>
        ) : null}
      </div>
      <LinkComp href={href} className="mt-3 line-clamp-2 text-sm font-medium leading-snug hover:underline">
        {name}
      </LinkComp>
      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="num text-sm font-semibold">{formatMoney(price, locale)}</span>
          {compare ? <span className="num text-muted-foreground text-xs line-through">{formatMoney(compare, locale)}</span> : null}
        </div>
        {adapter.addToCart ? (
          <button
            type="button"
            aria-label={`${t("addToCart")}: ${name}`}
            onClick={() => adapter.addToCart?.(product)}
            className="border-input hover:bg-accent inline-flex size-8 shrink-0 items-center justify-center rounded-lg border"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Experience header — start-aligned localized title/subtitle with the shared
 * "view all" link (`showViewAll` setting). Used by the experience renderers.
 */
export function ExperienceHeader({ s, className }: { s: SectionSettings; className?: string }) {
  const t = useTranslations("msg.sections");
  const { dir } = useAppLocale();
  const L = useLocalized(s);
  return (
    <div className={cn("mb-8 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {L("title") ? <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{L("title")}</h2> : null}
        {L("subtitle") ? <p className="text-muted-foreground mt-2 text-sm md:text-base">{L("subtitle")}</p> : null}
      </div>
      {boolSetting(s, "showViewAll", true) ? (
        <a href="/products" className="text-primary inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold hover:underline">
          {t("viewAll")}
          <ArrowLeft className={cn("size-4", dir === "ltr" && "rotate-180")} aria-hidden />
        </a>
      ) : null}
    </div>
  );
}

/** Shared centred section heading (title + optional subtitle). */
export function SectionHeading({ title, subtitle, align = "center" }: { title: string; subtitle?: string; align?: "center" | "start" }) {
  if (!title && !subtitle) return null;
  return (
    <div className={cn("mb-8", align === "center" ? "text-center" : "text-start")}>
      {title ? <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2> : null}
      {subtitle ? <p className="text-muted-foreground mx-auto mt-2 max-w-2xl text-sm md:text-base">{subtitle}</p> : null}
    </div>
  );
}
