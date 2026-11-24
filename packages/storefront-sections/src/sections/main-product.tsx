"use client";

import * as React from "react";
import { ChevronDown, Minus, Plus, ShoppingBag } from "lucide-react";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import { useTranslations } from "next-intl";
import type { Product } from "@repo/contracts";
import type { SectionBlock, ThemeSection } from "../types";
import { useSectionData } from "../data-context";
import { BlockRenderer, blockText } from "../blocks-render";
import { compareAt, MaybeImage, minPrice, productHue, strSetting } from "./helpers";

function ProductBlock({ block, product }: { block: SectionBlock; product: Product }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const [qty, setQty] = React.useState(1);
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState<Record<string, string>>({});
  const s = block.settings;
  const price = minPrice(product);
  const compare = compareAt(product);

  switch (block.type) {
    case "title":
      return <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{product.name[locale] ?? product.name.ar}</h1>;
    case "price":
      return (
        <div className="flex items-baseline gap-3">
          <span className="num text-2xl font-bold">{formatMoney(price, locale)}</span>
          {compare && s.showCompare !== "false" ? (
            <span className="num text-muted-foreground line-through">{formatMoney(compare, locale)}</span>
          ) : null}
        </div>
      );
    case "variant-picker":
      if (!product.options.length) return null;
      return (
        <div className="space-y-3">
          {product.options.map((option, oi) => (
            <div key={oi} className="space-y-1.5">
              <p className="text-sm font-medium">{option.name[locale] ?? option.name.ar}</p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((v) => {
                  const value = v[locale] ?? v.ar;
                  const active = picked[option.name.ar] === v.ar;
                  return (
                    <button
                      key={v.ar}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setPicked((p) => ({ ...p, [option.name.ar]: v.ar }))}
                      className={cn(
                        "rounded-lg border px-3.5 py-1.5 text-sm",
                        active ? "border-primary bg-primary text-primary-foreground" : "hover:border-foreground/40",
                      )}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    case "quantity":
      return (
        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("quantity")}</p>
          <div className="inline-flex items-center rounded-lg border">
            <button type="button" className="hover:bg-accent inline-flex size-9 items-center justify-center" aria-label="-" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="num w-10 text-center text-sm font-semibold">{qty}</span>
            <button type="button" className="hover:bg-accent inline-flex size-9 items-center justify-center" aria-label="+" onClick={() => setQty((q) => q + 1)}>
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      );
    case "buy-button":
      return (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="bg-primary text-primary-foreground inline-flex h-11 items-center gap-2 rounded-lg px-6 text-sm font-semibold transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="size-4" aria-hidden />
            {blockText(block, "buyLabel", locale) || t("addToCart")}
          </button>
          {s.showBuyNow !== "false" ? (
            <button type="button" className="border-primary text-primary inline-flex h-11 items-center rounded-lg border px-6 text-sm font-semibold">
              {t("buyNow")}
            </button>
          ) : null}
        </div>
      );
    case "description": {
      const text = s.source === "short" ? product.shortDescription[locale] : product.description[locale];
      if (!text) return null;
      return <p className="text-muted-foreground leading-relaxed">{text}</p>;
    }
    case "accordion": {
      const title = blockText(block, "title", locale);
      const content = blockText(block, "content", locale);
      if (!title && !content) return null;
      return (
        <div className="rounded-xl border">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-start text-sm font-semibold"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {title}
            <ChevronDown className={cn("text-muted-foreground size-4 shrink-0 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open ? <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed">{content}</p> : null}
        </div>
      );
    }
    default:
      return <BlockRenderer block={block} />;
  }
}

/**
 * Product-page main section — renders the context product (`previewEntity`)
 * or the `productId` setting. Content column is block-driven.
 */
export function MainProductSection({ section }: { section: ThemeSection }) {
  const t = useTranslations("msg.sections");
  const { locale } = useAppLocale();
  const { previewEntity, pickProduct, products } = useSectionData();
  const s = section.settings;
  const [view, setView] = React.useState(0);

  const product =
    (previewEntity?.type === "product" ? pickProduct(previewEntity.id) : undefined) ??
    pickProduct(strSetting(s, "productId")) ??
    products[0];
  const galleryEnd = strSetting(s, "gallerySide", "start") === "end";

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
  const media = product.media.length ? product.media : [undefined];

  return (
    <section className="sec-pad">
      <div className="container grid items-start gap-8 md:grid-cols-2 lg:gap-12">
        <div className={cn("space-y-3", galleryEnd && "md:order-2")}>
          <MaybeImage
            url={media[Math.min(view, media.length - 1)]?.url}
            hue={productHue(product) + view * 25}
            label={name}
            className="aspect-square w-full rounded-2xl"
          />
          {media.length > 1 ? (
            <div className="flex gap-3">
              {media.slice(0, 4).map((m, i) => (
                <button
                  key={m?.url ?? i}
                  type="button"
                  aria-pressed={view === i}
                  aria-label={`${name} ${i + 1}`}
                  onClick={() => setView(i)}
                  className={cn("overflow-hidden rounded-lg ring-offset-2", view === i && "ring-primary ring-2")}
                >
                  <MaybeImage url={m?.url} hue={productHue(product) + i * 25} label={name} className="size-16" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className={cn("space-y-5", galleryEnd && "md:order-1")}>
          {section.blocks.map((block) => (
            <ProductBlock key={block.id} block={block} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
