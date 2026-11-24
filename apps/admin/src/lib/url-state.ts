"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Filters, search, tabs and sorting live in the URL (SCREENS_SPEC §1.3).
 * Defaults are omitted from the query string so links stay short.
 */
export function useUrlState<T extends Record<string, string>>(defaults: T) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const defaultsRef = React.useRef(defaults);

  const state = React.useMemo(() => {
    const out = { ...defaultsRef.current } as T;
    for (const key of Object.keys(out)) {
      const v = params.get(key);
      if (v !== null) (out as Record<string, string>)[key] = v;
    }
    return out;
  }, [params]);

  const set = React.useCallback(
    (patch: Partial<T>, opts: { resetPage?: boolean } = { resetPage: true }) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === "" || v === defaultsRef.current[k]) next.delete(k);
        else next.set(k, v as string);
      }
      if (opts.resetPage && !("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  return [state, set] as const;
}

const SCROLL_KEY = (path: string) => `scroll:${path}`;

/** Restores list scroll position when coming back from a detail screen. */
export function useScrollRestore(ready: boolean) {
  const pathname = usePathname();
  const params = useSearchParams();
  const key = SCROLL_KEY(`${pathname}?${params.toString()}`);
  React.useEffect(() => {
    if (!ready) return;
    const saved = sessionStorage.getItem(key);
    if (saved) window.scrollTo({ top: Number(saved) });
    const onScroll = () => sessionStorage.setItem(key, String(window.scrollY));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [key, ready]);
}

/** Remembers the last list URL (with filters) so detail breadcrumbs/back go to it. */
export function rememberListUrl(listPath: string, url: string) {
  sessionStorage.setItem(`list:${listPath}`, url);
}
export function recallListUrl(listPath: string): string {
  if (typeof window === "undefined") return listPath;
  return sessionStorage.getItem(`list:${listPath}`) ?? listPath;
}
