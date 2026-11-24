import type { MetadataRoute } from "next";
import { commerce } from "@repo/api-client";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001";

/** Static sitemap built from the mock catalog — a real backend would regenerate per publish. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, categories, products] = await Promise.all([
    commerce.pages.list(),
    commerce.categories.list(),
    commerce.products.list(),
  ]);
  return [
    { url: `${BASE}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/products`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/search`, changeFrequency: "weekly", priority: 0.5 },
    ...pages.filter((p) => p.status === "published").map((p) => ({ url: `${BASE}/pages/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.4 })),
    ...categories.map((c) => ({ url: `${BASE}/c/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...products.filter((p) => p.status === "active").map((p) => ({ url: `${BASE}/p/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
