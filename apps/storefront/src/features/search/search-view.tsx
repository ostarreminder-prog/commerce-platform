"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { History, Search, TrendingUp, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBrandList } from "@repo/api-client";
import { useStoreProducts, type StoreProduct } from "@/lib/store-product";
import { Input } from "@repo/ui/components/input";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FiltersSheetButton, FiltersSide, FiltersToolbar } from "@/components/filters-ui";
import { ProductCard } from "@/components/product-card";
import { useProductFilters } from "@/components/product-filters";
import { usePageExperience } from "@/lib/page-experience";

const RECENTS_KEY = "nakhla-recent-searches";

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, 8) : [];
  } catch {
    return [];
  }
}

/** Push the query to the front of the persisted recents (deduped, max 8). */
function pushRecent(q: string) {
  try {
    localStorage.setItem(RECENTS_KEY, JSON.stringify([q, ...readRecents().filter((x) => x !== q)].slice(0, 8)));
  } catch {
    /* storage may be unavailable */
  }
}

function matches(p: StoreProduct, q: string): boolean {
  const needle = q.toLowerCase();
  return [p.name.ar, p.name.en ?? "", p.description.ar, p.description.en ?? "", p.sku, ...(p.product.tags ?? []), p.product.brand ?? ""].some((f) => f.toLowerCase().includes(needle));
}

export function SearchView() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = (params.get("q") ?? "").trim();
  const [input, setInput] = React.useState(q);
  const [recents, setRecents] = React.useState<string[]>([]);
  const { data: all = [], isPending } = useStoreProducts();
  const { data: brands = [] } = useBrandList();

  React.useEffect(() => {
    setInput(q);
    setRecents(readRecents());
    if (q) pushRecent(q);
  }, [q]);

  const update = (value: string) => {
    setInput(value);
    const next = value.trim();
    router.replace(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname, { scroll: false });
  };

  const base = all.filter((p) => p.status === "active" && (!q || matches(p, q))).sort((a, b) => b.salesCount - a.salesCount);
  const filters = useProductFilters(base, { showCategories: true });
  const results = filters.filtered;
  /* Shares the PLP page experience — search results are a product listing too. */
  const experience = usePageExperience("category");
  const discovery = experience === "visual-discovery";
  /* No-results fallbacks — matching brands + the catalog bestsellers. */
  const brandHits = q ? brands.filter((b) => b.status === "active" && [b.name.ar, b.name.en ?? ""].some((n) => n.toLowerCase().includes(q.toLowerCase()))) : [];
  const popular = React.useMemo(() => all.filter((p) => p.status === "active").sort((a, b) => b.salesCount - a.salesCount).slice(0, 4), [all]);

  return (
    <div className="container space-y-8 py-8">
      <Breadcrumbs items={[{ label: t("searchPage.title") }]} />
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">{t("searchPage.title")}</h1>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input
            value={input}
            onChange={(e) => update(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="bg-muted/50 h-12 rounded-full ps-9 text-base"
          />
        </div>
        {recents.length && !q ? (
          <div className="flex flex-wrap items-center gap-2">
            <History className="text-muted-foreground size-3.5" aria-hidden />
            {recents.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => router.replace(`${pathname}?q=${encodeURIComponent(r)}`)}
                className="bg-muted hover:bg-accent rounded-full px-3 py-1 text-xs font-medium transition-colors"
              >
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(RECENTS_KEY);
                } catch {
                  /* ignore */
                }
                setRecents([]);
              }}
              className="text-muted-foreground hover:text-destructive inline-flex items-center gap-1 text-xs"
            >
              <X className="size-3" aria-hidden />
              {t("searchPage.clearRecents")}
            </button>
          </div>
        ) : null}
        <p className="text-muted-foreground text-sm">
          {isPending ? null : q ? t("searchPage.resultsFor", { count: formatNumber(results.length), q }) : t("searchPage.allProducts")}
        </p>
      </div>
      <div className={discovery ? "space-y-4" : "flex gap-8"} data-experience={experience}>
        {discovery ? null : <FiltersSide f={filters} />}
        <div className="flex-1 space-y-4">
          {isPending ? null : (
            <div className="flex flex-wrap items-center gap-2">
              {discovery ? <FiltersSheetButton f={filters} /> : null}
              <FiltersToolbar f={filters} hideSheetTrigger={discovery} />
            </div>
          )}
          {isPending ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          ) : results.length ? (
            <div className={discovery ? "grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3" : "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4"}>
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <MsgEmptyState emptyKey="search" params={{ query: q }} />
              {brandHits.length ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold">{t("searchPage.brandHits")}</h2>
                  <div className="flex flex-wrap gap-2">
                    {brandHits.map((b) => (
                      <Link key={b.id} href={`/brands/${b.id}`} className="hover:border-primary/40 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors">
                        {b.name[locale] ?? b.name.ar}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
              {popular.length ? (
                <section className="space-y-4">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="text-primary size-4" aria-hidden />
                    {t("searchPage.popular")}
                  </h2>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-4">
                    {popular.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
