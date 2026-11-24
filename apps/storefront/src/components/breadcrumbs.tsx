"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

export interface Crumb {
  label: string;
  href?: string;
}

/** Shared breadcrumb trail — home → … → current page (last item is text). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations("store");
  const { dir } = useAppLocale();
  const Sep = dir === "rtl" ? ChevronLeft : ChevronRight;
  return (
    <nav aria-label="breadcrumb" className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
      <Link href="/" className="hover:text-foreground">
        {t("home")}
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <Sep className="size-4" aria-hidden />
          {item.href ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground truncate">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
