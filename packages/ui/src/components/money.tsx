import * as React from "react";
import { useLocale } from "next-intl";
import { cn } from "../lib/cn";
import { formatMoney, type FormatMoneyOptions, type Locale } from "../lib/format";

export interface MoneyProps extends FormatMoneyOptions {
  /** Integer amount in halalas. */
  amount: number;
  className?: string;
}

export function Money({ amount, className, ...options }: MoneyProps) {
  const locale = useLocale() as Locale;
  return (
    <span className={cn("num whitespace-nowrap", className)}>
      {formatMoney(amount, locale, options)}
    </span>
  );
}
