"use client";

import { isRealImageUrl, placeholderHue } from "../lib/media";
import { cn } from "../lib/cn";
import { ProductImage } from "./product-image";

/** Media thumbnail: real urls render an <img>; `placeholder:<hue>` urls render the gradient placeholder. */
export function MediaThumb({ url, label, className }: { url: string | undefined | null; label: string; className?: string }) {
  if (isRealImageUrl(url)) {
    return <img src={url} alt={label} loading="lazy" className={cn("size-10 shrink-0 rounded-md object-cover", className)} />;
  }
  return <ProductImage hue={placeholderHue(url) ?? 140} label={label} className={cn("size-10", className)} />;
}
