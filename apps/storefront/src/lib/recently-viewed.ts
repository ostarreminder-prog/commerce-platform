"use client";

import * as React from "react";

/** localStorage helpers for the "شاهدت مؤخراً" strip — last 10 product ids, newest first. */
export const RECENTLY_VIEWED_KEY = "nakhla-recently-viewed";
const MAX = 10;

export function readRecentlyViewed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(ids) ? ids.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Push a product id to the front (deduped, capped at 10). Called on PDP mount. */
export function pushRecentlyViewed(id: string) {
  if (typeof window === "undefined") return;
  const ids = [id, ...readRecentlyViewed().filter((x) => x !== id)].slice(0, MAX);
  localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event("recently-viewed"));
}

/** Live list of recently-viewed ids (re-reads on mount + after each push). */
export function useRecentlyViewedIds(): string[] {
  const [ids, setIds] = React.useState<string[]>([]);
  React.useEffect(() => {
    const sync = () => setIds(readRecentlyViewed());
    sync();
    window.addEventListener("recently-viewed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("recently-viewed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids;
}
