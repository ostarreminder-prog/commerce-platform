"use client";

import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

const UNSCOPED = ["/login", "/signup", "/forgot", "/invite", "/mfa", "/design-system"];

export function useStoreSlug(): string {
  const params = useParams<{ store?: string }>();
  return params.store ?? "";
}

export function scopeHref(slug: string, href: string): string {
  if (!slug || !href.startsWith("/") || href.startsWith("//")) return href;
  if (UNSCOPED.some((p) => href === p || href.startsWith(`${p}/`) || href.startsWith(`${p}?`))) return href;
  if (href === `/${slug}` || href.startsWith(`/${slug}/`) || href.startsWith(`/${slug}?`)) return href;
  return href === "/" ? `/${slug}` : href.startsWith("/?") ? `/${slug}${href.slice(1)}` : `/${slug}${href}`;
}

/** Prefixes app-relative paths with the current store slug. */
export function useStoreHref() {
  const slug = useStoreSlug();
  return React.useCallback((href: string) => scopeHref(slug, href), [slug]);
}

/** Store-relative pathname: `/nakhla/orders/1` → `/orders/1`. */
export function useStorePathname(): string {
  const pathname = usePathname();
  const slug = useStoreSlug();
  if (!slug) return pathname;
  const rest = pathname.slice(slug.length + 1);
  return rest === "" ? "/" : rest;
}

export function useStoreRouter() {
  const router = useRouter();
  const href = useStoreHref();
  return React.useMemo(
    () => ({
      ...router,
      push: (to: string, opts?: Parameters<typeof router.push>[1]) => router.push(href(to), opts),
      replace: (to: string, opts?: Parameters<typeof router.replace>[1]) => router.replace(href(to), opts),
      prefetch: (to: string) => router.prefetch(href(to)),
    }),
    [router, href],
  );
}
