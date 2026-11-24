"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { useStoreList } from "@repo/api-client";
import type { Store } from "@repo/contracts";
import { useStoreSlug } from "@/lib/store-route";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

export const storeHue = (s: Pick<Store, "id">) =>
  [...s.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
export const storeName = (s: Pick<Store, "name">, locale: "ar" | "en") =>
  (locale === "en" && s.name.en) || s.name.ar;
export const useCurrentStore = () => {
  const slug = useStoreSlug();
  const q = useStoreList();
  return { ...q, data: q.data?.find((s) => s.slug === slug) };
};

export function StoreLogo({ hue, name }: { hue: number; name: string }) {
  return (
    <span
      aria-hidden
      className="text-paper flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
      style={{ background: `hsl(${hue} 45% 32%)` }}
    >
      {name.charAt(0)}
    </span>
  );
}

export function StoreSwitcher() {
  const t = useTranslations();
  const { locale } = useAppLocale();
  const { data: current } = useCurrentStore();
  const { data: stores } = useStoreList();
  if (!current) {
    return (
      <div className="flex items-center gap-3 p-2">
        <Skeleton className="size-9 rounded-lg" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" /> <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hover:bg-sidebar-accent focus-visible:ring-ring flex w-full items-center gap-3 rounded-lg p-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2"
        aria-label={t("topbar.switchStore")}
      >
        <StoreLogo hue={storeHue(current)} name={storeName(current, locale)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{storeName(current, locale)}</span>
          <span className="text-muted-foreground block truncate text-xs" dir="ltr">
            /{current.slug}
          </span>
        </span>
        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{t("topbar.stores")}</DropdownMenuLabel>
        {stores?.map((s) => (
          <DropdownMenuItem key={s.id} className="gap-3" asChild>
            <NextLink href={`/${s.slug}`}>
              <StoreLogo hue={storeHue(s)} name={storeName(s, locale)} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{storeName(s, locale)}</span>
                <span className="text-muted-foreground block text-xs" dir="ltr">
                  /{s.slug}
                </span>
              </span>
              {s.id === current.id ? <Check className="text-primary" aria-hidden /> : null}
            </NextLink>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <NextLink href="/signup">
            <Plus aria-hidden /> {t("topbar.addStore")}
          </NextLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
