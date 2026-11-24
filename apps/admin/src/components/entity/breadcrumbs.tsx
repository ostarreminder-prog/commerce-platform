"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "@/components/store-link";

export interface Crumb {
  label: React.ReactNode;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const t = useTranslations("common");
  return (
    <nav aria-label={t("breadcrumb")} className="text-muted-foreground mb-2 text-sm">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 ? (
<ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden />
            ) : null}
            {c.href && i < items.length - 1 ? (
              <Link href={c.href} className="hover:text-foreground transition-colors">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === items.length - 1 ? "page" : undefined} className={i === items.length - 1 ? "text-foreground font-medium" : undefined}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
