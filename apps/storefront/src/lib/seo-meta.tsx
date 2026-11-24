"use client";

import * as React from "react";
import { useStorefrontSeo } from "@repo/api-client";

const setMeta = (selector: string, attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/**
 * Applies the merchant's storefront-SEO settings (admin /storefront/seo) to the
 * live document — title, description and Open Graph tags. Client-side sync is
 * the honest scope here: server-rendered meta needs a real backend, so search
 * crawlers see the static defaults while visitors get the saved values.
 */
export function SeoMeta() {
  const { data: seo } = useStorefrontSeo();

  React.useEffect(() => {
    if (!seo) return;
    if (seo.title.trim()) document.title = seo.title.trim();
    if (seo.description.trim()) {
      setMeta('meta[name="description"]', "name", "description", seo.description.trim());
      setMeta('meta[property="og:description"]', "property", "og:description", seo.description.trim());
    }
    if (seo.title.trim()) setMeta('meta[property="og:title"]', "property", "og:title", seo.title.trim());
    if (seo.shareImage?.url) setMeta('meta[property="og:image"]', "property", "og:image", seo.shareImage.url);
  }, [seo]);

  return null;
}
