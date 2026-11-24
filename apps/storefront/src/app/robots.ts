import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/account", "/preview"] },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
