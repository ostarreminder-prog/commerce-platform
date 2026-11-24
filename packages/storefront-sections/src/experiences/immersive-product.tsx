"use client";

import * as React from "react";
import { ChevronDown, Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import type { ExperienceProps } from "./types";
import { commerceLink, productHref } from "../commerce-context";
import { useSectionData } from "../data-context";
import { compareAt, MaybeImage, minPrice, productHue, strSetting } from "../sections/helpers";

/** Variant matching the picked option values — unpicked options default to their first value (options order aligns with `optionValues`). */
function resolveVariant(product: Product, picked: Record<string, string>) {
  if (!product.options.length) return product.variants[0];
  return product.variants.find((v) =>
    product.options.every((option, i) => !option.values.length || v.optionValues[i] === (picked[option.name.ar] ?? option.values[0]?.ar)),
  );
}

/**
 * Single-product immersive view — large media, variant picker, progressive
 * detail reveal and a commerce CTA (adapter add-to-cart, link fallback).
 */
export function ImmersiveProductExperience({ products, settings, adapter }: ExperienceProps) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const { pickProduct } = useSectionData();
  const product = pickProduct(strSetting(settings, "productId")) ?? products[0];
  const [mediaView, setMediaView] = React.useState(0);
  const [qty, setQty] = React.useState(1);
  const [expanded, setExpanded] = React.useState(false);
  const [picked, setPicked] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    setPicked({});
    setMediaView(0);
  }, [product?.id]);
  if (!product) {
    return (
      <section className="sec-pad">
        <div className="container">
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">{t("pickProduct")}</p>
        </div>
      </section>
    );
  }

  const name = product.name[locale] ?? product.name.ar;
  const variant = resolveVariant(product, picked);
  const price = variant?.price.amount ?? minPrice(product);
  const compare = variant?.compareAtPrice?.amount ?? compareAt(product);
  const media = product.media.length ? product.media : [undefined];
  const LinkComp = commerceLink(adapter);
  const inCart = adapter?.inCart?.(product.id, variant?.id) ?? false;
  const description = product.description[locale] ?? product.description.ar;
  const short = product.shortDescription[locale] ?? product.shortDescription.ar;
  const showBuy = Boolean(adapter?.addToCart);

  return (
    <section className="sec-pad">
      <div className="container grid items-start gap-8 md:grid-cols-2 lg:gap-14">
        <div className="space-y-3">
          <MaybeImage
            url={media[Math.min(mediaView, media.length - 1)]?.url}
            hue={productHue(product) + mediaView * 25}
            label={name}
            className="aspect-square w-full rounded-2xl"
          />
          {media.length > 1 ? (
            <div className="flex gap-3">
              {media.slice(0, 4).map((m, i) => (
                <button
                  key={m?.url ?? i}
                  type="button"
                  aria-pressed={mediaView === i}
                  aria-label={`${name} ${i + 1}`}
                  onClick={() => setMediaView(i)}
                  className={cn("overflow-hidden rounded-lg ring-offset-2", mediaView === i && "ring-primary ring-2")}
                >
                  <MaybeImage url={m?.url} hue={productHue(product) + i * 25} label={name} className="size-16" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{name}</h2>
            <span className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
              <Star className="fill-warning text-warning size-4" aria-hidden />
              <span className="num">{formatNumber(product.rating, { maximumFractionDigits: 1 })}</span>
              <span className="num">({formatNumber(product.reviewsCount)})</span>
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="num text-3xl font-bold">{formatMoney(price, locale)}</span>
            {compare && compare > price ? (
              <span className="num text-muted-foreground line-through">{formatMoney(compare, locale)}</span>
            ) : null}
          </div>
          {product.options.map((option) => (
            <div key={option.name.ar} className="space-y-1.5">
              <p className="text-sm font-medium">{option.name[locale] ?? option.name.ar}</p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((v) => {
                  const current = picked[option.name.ar] ?? option.values[0]?.ar;
                  const active = current === v.ar;
                  return (
                    <button
                      key={v.ar}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPicked((prev) => ({ ...prev, [option.name.ar]: v.ar }))}
                      className={cn(
                        "rounded-lg border px-3.5 py-1.5 text-sm",
                        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground/40",
                      )}
                    >
                      {v[locale] ?? v.ar}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-lg border" role="group" aria-label={t("quantity")}>
              <button type="button" className="hover:bg-accent inline-flex size-9 items-center justify-center" aria-label="-" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="num w-10 text-center text-sm font-semibold">{formatNumber(qty)}</span>
              <button type="button" className="hover:bg-accent inline-flex size-9 items-center justify-center" aria-label="+" onClick={() => setQty((q) => q + 1)}>
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
            {showBuy ? (
              <button
                type="button"
                onClick={() => adapter?.addToCart?.(product, { variantId: variant?.id, qty })}
                className="bg-primary text-primary-foreground inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-opacity hover:opacity-90"
              >
                <ShoppingBag className="size-4" aria-hidden />
                {inCart ? t("inCart") : t("addToCart")}
              </button>
            ) : (
              <LinkComp
                href={productHref(adapter, product)}
                className="bg-primary text-primary-foreground inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold transition-opacity hover:opacity-90"
              >
                <ShoppingBag className="size-4" aria-hidden />
                {t("viewDetails")}
              </LinkComp>
            )}
            {adapter?.wishlist ? (
              <button
                type="button"
                aria-label={t("wishlist")}
                aria-pressed={adapter.wishlist.has(product.id)}
                onClick={() => adapter.wishlist?.toggle(product)}
                className="hover:bg-accent inline-flex size-11 items-center justify-center rounded-lg border"
              >
                <Heart className={cn("size-4", adapter.wishlist.has(product.id) && "fill-destructive text-destructive")} aria-hidden />
              </button>
            ) : null}
          </div>
          {short ? <p className="text-muted-foreground leading-relaxed">{short}</p> : null}
          {description && description !== short ? (
            <div className="rounded-xl border">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start text-sm font-semibold"
                aria-expanded={expanded}
                onClick={() => setExpanded((o) => !o)}
              >
                {t("description")}
                <ChevronDown className={cn("text-muted-foreground size-4 shrink-0 transition-transform", expanded && "rotate-180")} aria-hidden />
              </button>
              {expanded ? <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed">{description}</p> : null}
            </div>
          ) : null}
          {!showBuy ? (
            <LinkComp href={productHref(adapter, product)} className="text-primary inline-block text-sm font-semibold hover:underline">
              {t("viewDetails")}
            </LinkComp>
          ) : null}
        </div>
      </div>
    </section>
  );
}
