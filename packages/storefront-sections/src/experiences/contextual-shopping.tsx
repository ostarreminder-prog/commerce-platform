"use client";

import * as React from "react";
import { ShoppingBag, X } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import type { ExperienceProps } from "./types";
import { commerceLink, productHref, type SectionCommerceAdapter } from "../commerce-context";
import { useSectionData } from "../data-context";
import { ExperienceHeader, MaybeImage, minPrice, numSetting, productHue, strSetting } from "../sections/helpers";

interface Spot {
  id: string;
  product: Product;
  /** Scene-space coordinates (0–100% of the image box — physical, not logical). */
  x: number;
  y: number;
}

const pct = (v: unknown, d = 50) => Math.min(100, Math.max(0, Number(v ?? d) || d));

/** Mini product card that opens from a hotspot dot. */
function SpotCard({ spot, adapter, onClose }: { spot: Spot; adapter?: SectionCommerceAdapter | null; onClose: () => void }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const name = spot.product.name[locale] ?? spot.product.name.ar;
  const LinkComp = commerceLink(adapter);
  return (
    <div
      data-hotspot-card
      className="bg-card absolute z-20 w-56 rounded-xl border p-3 shadow-lg"
      style={{ left: `clamp(7rem, ${spot.x}%, calc(100% - 7rem))`, top: `${spot.y}%`, transform: "translate(-50%, 1.25rem)" }}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("closeMenu")}
        className="hover:bg-accent absolute end-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-md"
      >
        <X className="size-3.5" aria-hidden />
      </button>
      <div className="flex items-start gap-3">
        <LinkComp href={productHref(adapter, spot.product)} className="shrink-0">
          <MaybeImage url={spot.product.media[0]?.url} hue={productHue(spot.product)} label={name} className="size-12 rounded-lg" />
        </LinkComp>
        <div className="min-w-0">
          <LinkComp href={productHref(adapter, spot.product)} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">
            {name}
          </LinkComp>
          <p className="num mt-1 text-sm font-semibold">{formatMoney(minPrice(spot.product), locale)}</p>
        </div>
      </div>
      {adapter?.addToCart ? (
        <button
          type="button"
          onClick={() => adapter.addToCart?.(spot.product)}
          className="bg-primary text-primary-foreground mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="size-3.5" aria-hidden />
          {t("addToCart")}
        </button>
      ) : (
        <LinkComp
          href={productHref(adapter, spot.product)}
          className="bg-primary text-primary-foreground mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
        >
          <ShoppingBag className="size-3.5" aria-hidden />
          {t("viewDetails")}
        </LinkComp>
      )}
    </div>
  );
}

/**
 * Shop-the-look — a scene image (`sceneImage`/`sceneHue`) with `hotspot`
 * blocks pinned at x/y percentages. Dots pulse; clicking one opens a mini
 * product card (add-to-cart via the adapter, product-link fallback). A chip
 * strip under the scene lists the same products for small screens, plus an
 * optional "add all" action.
 */
export function ContextualShoppingExperience({ section, settings, adapter }: ExperienceProps) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const { pickProduct } = useSectionData();
  const [openId, setOpenId] = React.useState<string | null>(null);

  const spots: Spot[] = section.blocks
    .filter((b) => b.type === "hotspot")
    .map((b) => ({ id: b.id, product: pickProduct(b.settings.productId ?? ""), x: pct(b.settings.x), y: pct(b.settings.y) }))
    .filter((s): s is Spot => Boolean(s.product));

  const openSpot = spots.find((s) => s.id === openId) ?? null;
  const sceneImage = strSetting(settings, "sceneImage");
  const sceneHue = numSetting(settings, "sceneHue", 200);
  const LinkComp = commerceLink(adapter);

  if (!sceneImage && !spots.length) {
    return (
      <section className="sec-pad">
        <div className="container">
          <ExperienceHeader s={settings} />
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">{t("pickScene")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="sec-pad">
      <div className="container">
        <ExperienceHeader s={settings} />
        <div className="relative" data-scene>
          <MaybeImage
            url={sceneImage}
            hue={sceneHue}
            label=""
            className="aspect-[16/10] w-full rounded-2xl object-cover"
          />
          {spots.map((spot) => {
            const name = spot.product.name[locale] ?? spot.product.name.ar;
            const open = openId === spot.id;
            return (
              <button
                key={spot.id}
                type="button"
                data-hotspot
                aria-label={name}
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : spot.id)}
                className="absolute flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center"
                style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              >
                <span aria-hidden className="bg-primary/50 absolute inline-flex size-full animate-ping rounded-full" />
                <span aria-hidden className="ring-paper bg-primary relative inline-flex size-3.5 rounded-full shadow ring-2" />
              </button>
            );
          })}
          {openSpot ? <SpotCard spot={openSpot} adapter={adapter} onClose={() => setOpenId(null)} /> : null}
        </div>
        {spots.length ? (
          <div className="mt-4 flex items-stretch gap-3 overflow-x-auto pb-1" data-scene-chips>
            {spots.map((spot) => {
              const name = spot.product.name[locale] ?? spot.product.name.ar;
              return (
                <LinkComp
                  key={spot.id}
                  href={productHref(adapter, spot.product)}
                  className={cn(
                    "hover:border-primary flex w-44 shrink-0 items-center gap-2.5 rounded-xl border p-2 transition-colors",
                    openId === spot.id && "border-primary",
                  )}
                >
                  <MaybeImage url={spot.product.media[0]?.url} hue={productHue(spot.product)} label={name} className="size-10 rounded-lg" />
                  <span className="min-w-0">
                    <span className="line-clamp-1 block text-xs font-medium">{name}</span>
                    <span className="num mt-0.5 block text-xs font-semibold">{formatMoney(minPrice(spot.product), locale)}</span>
                  </span>
                </LinkComp>
              );
            })}
            {adapter?.addToCart && spots.length > 1 ? (
              <button
                type="button"
                onClick={() => spots.forEach((s) => adapter.addToCart?.(s.product))}
                className="bg-primary text-primary-foreground inline-flex shrink-0 items-center gap-2 rounded-xl px-4 text-xs font-semibold transition-opacity hover:opacity-90"
              >
                <ShoppingBag className="size-3.5" aria-hidden />
                {t("addAllToCart")}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
