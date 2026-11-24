"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActiveTheme, useCategoryList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { LocaleSwitcher } from "@repo/ui/components/locale-switcher";
import { ProductImage } from "@repo/ui/components/product-image";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { setLocale } from "@/actions/locale";
import { useStoreFeatures } from "@/lib/features";
import { useStore, useStoreProducts } from "@/lib/store-product";
import { HeaderMenu } from "./store-menus";
import { useCart } from "./cart-context";
import { useSession } from "./session-context";
import { useWishlist } from "./wishlist-context";

/** Live search field — debounced suggestions, full keyboard navigation. */
function SearchBox() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const router = useRouter();
  const { data: products = [] } = useStoreProducts();
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(-1);
  const boxRef = React.useRef<HTMLDivElement>(null);

  const term = q.trim().toLowerCase();
  const hits = React.useMemo(() => {
    if (term.length < 2) return [];
    return products
      .filter((p) => p.status === "active" && (p.name.ar.toLowerCase().includes(term) || p.name.en?.toLowerCase().includes(term)))
      .sort((a, b) => b.salesCount - a.salesCount)
      .slice(0, 6);
  }, [products, term]);

  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  React.useEffect(() => setActive(-1), [q]);

  const goSearch = () => {
    if (term) {
      setOpen(false);
      router.push(`/search?q=${encodeURIComponent(term)}`);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? hits.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (open && hits[active]) {
        e.preventDefault();
        setOpen(false);
        router.push(`/products/${hits[active].id}`);
      }
    }
  };

  return (
    <div ref={boxRef} className="relative mx-auto hidden w-full max-w-md md:block" role="search">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goSearch();
        }}
      >
        <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={t("search")}
          aria-label={t("search")}
          role="combobox"
          aria-expanded={open && hits.length > 0}
          aria-controls="search-suggestions"
          aria-activedescendant={active >= 0 ? `sug-${hits[active]?.id}` : undefined}
          className="bg-muted/50 rounded-full ps-9"
        />
      </form>
      {open && hits.length > 0 ? (
        <div id="search-suggestions" role="listbox" className="bg-popover absolute start-0 end-0 top-full z-50 mt-2 overflow-hidden rounded-xl border shadow-lg">
          <ul className="max-h-80 overflow-y-auto py-1">
            {hits.map((p, i) => (
              <li key={p.id}>
                <Link
                  id={`sug-${p.id}`}
                  role="option"
                  aria-selected={i === active}
                  href={`/products/${p.id}`}
                  onClick={() => setOpen(false)}
                  className={cn("hover:bg-muted flex items-center gap-3 px-3 py-2", i === active && "bg-muted")}
                >
                  <ProductImage hue={p.imageHue} label={p.name[locale] ?? p.name.ar} className="size-9 shrink-0 rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name[locale] ?? p.name.ar}</span>
                    <span className="text-muted-foreground num block text-xs">{formatMoney(p.price, locale)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={goSearch}
            className="text-primary hover:bg-muted flex w-full items-center justify-center gap-1.5 border-t px-3 py-2 text-sm font-medium"
          >
            <Search className="size-3.5" aria-hidden />
            {t("searchAll", { q: term })}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function StoreHeader() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const { count } = useCart();
  const wishlist = useWishlist();
  const { on } = useStoreFeatures();
  const { status } = useSession();
  const { data: categories = [] } = useCategoryList();
  const { data: theme } = useActiveTheme();
  const { data: store } = useStore();
  /* Theme globals drive the announcement bar + the merchant-configured store
   * name wins over the bundled translation once settings are saved. */
  const announcement = theme?.globals.announcementBar?.trim() || t("announcement");
  const storeName = store?.name[locale] ?? store?.name.ar ?? t("name");

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <p className="bg-primary text-primary-foreground px-4 py-1.5 text-center text-xs">{announcement}</p>
      <div className="container flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          {store?.logo?.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary merchant media url
            <img src={store.logo.url} alt={storeName} className="size-9 rounded-lg object-cover" />
          ) : (
            <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg text-lg font-bold">{storeName.charAt(0)}</span>
          )}
          <span className="text-lg font-bold">{storeName}</span>
        </Link>
        <SearchBox />
        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <LocaleSwitcher onLocaleChange={setLocale} />
          <Button variant="ghost" size="icon" asChild>
            <Link href={status === "authed" ? "/account/orders" : "/account/login"} aria-label={t("account.title")}>
              <User aria-hidden />
            </Link>
          </Button>
          {on("wishlist") ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/wishlist" aria-label={`${t("wishlist.title")} (${wishlist.count})`} className="relative">
                <Heart aria-hidden />
                {wishlist.count > 0 ? (
                  <span className="bg-primary text-primary-foreground num absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                    {formatNumber(wishlist.count)}
                  </span>
                ) : null}
              </Link>
            </Button>
          ) : null}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart" aria-label={`${t("cart")} (${count})`} className="relative">
              <ShoppingBag aria-hidden />
              {count > 0 ? (
                <span className="bg-primary text-primary-foreground num absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
                  {formatNumber(count)}
                </span>
              ) : null}
            </Link>
          </Button>
        </div>
      </div>
      <nav className="no-scrollbar container flex gap-6 overflow-x-auto pb-3 text-sm" aria-label={t("categories")}>
        <HeaderMenu />
        {categories.map((c) => (
          <Link key={c.id} href={`/c/${c.slug}`} className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
            {(c.name[locale] ?? c.name.ar)}
          </Link>
        ))}
        <Link href="/brands" className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
          {t("brands.title")}
        </Link>
        <Link href="/offers" className="text-destructive shrink-0 font-semibold transition-colors hover:opacity-80">
          {t("offers.title")}
        </Link>
      </nav>
    </header>
  );
}
