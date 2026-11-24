"use client";

import { useTranslations } from "next-intl";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";

/**
 * Installments line — "قسّطها على 4 دفعات بـ X ر.س" with token-colored
 * provider chips (UI only, no real Tabby/Tamara integration).
 */
export function InstallmentsLine({ price, compact = false }: { price: number; compact?: boolean }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const chips = (
    <span className="inline-flex gap-1">
      <span className="bg-success/10 text-success rounded px-1.5 py-0.5 text-[10px] font-bold" dir="ltr">
        tabby
      </span>
      <span className="bg-info/10 text-info rounded px-1.5 py-0.5 text-[10px] font-bold" dir="ltr">
        tamara
      </span>
    </span>
  );
  return (
    <p className={cn("flex flex-wrap items-center gap-1.5", compact ? "text-[11px] text-muted-foreground" : "text-sm")}>
      {chips}
      <span>{t("installments", { amount: formatMoney(Math.round(price / 4), locale) })}</span>
    </p>
  );
}
