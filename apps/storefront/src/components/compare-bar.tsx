"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { ProductImage } from "@repo/ui/components/product-image";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatNumber } from "@repo/ui/lib/format";
import { useStoreFeatures } from "@/lib/features";
import { useCompare } from "./compare-context";

/** Floating bottom tray shown while the visitor has products picked for compare. */
export function CompareBar() {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const pathname = usePathname();
  const { items, count, clear, remove } = useCompare();
  const { on } = useStoreFeatures();
  if (!on("compare") || count === 0 || pathname === "/compare") return null;

  return (
    <div className="bg-card/95 fixed inset-x-3 bottom-3 z-40 mx-auto max-w-xl rounded-2xl border shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center gap-3 p-3">
        <Scale className="text-primary size-5 shrink-0" aria-hidden />
        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto">
          {items.map((p) => (
            <span key={p.id} className="relative shrink-0">
              <ProductImage hue={p.imageHue} label={(p.name[locale] ?? p.name.ar)} className="size-11 rounded-lg" />
              <button
                type="button"
                aria-label={`${t("remove")}: ${(p.name[locale] ?? p.name.ar)}`}
                onClick={() => remove(p.id)}
                className="bg-foreground/70 text-background absolute -end-1 -top-1 flex size-4 items-center justify-center rounded-full"
              >
                <X className="size-2.5" aria-hidden />
              </button>
            </span>
          ))}
        </div>
        <Button size="sm" asChild>
          <Link href="/compare">{t("compare.bar", { count: formatNumber(count) })}</Link>
        </Button>
        <Button size="sm" variant="ghost" onClick={clear}>
          {t("compare.clear")}
        </Button>
      </div>
    </div>
  );
}
