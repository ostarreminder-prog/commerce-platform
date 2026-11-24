export type Locale = "ar" | "en";

const LRI = "\u2066";
const PDI = "\u2069";

const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-SA-u-nu-latn-ca-gregory" : "en-US");

const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export interface FormatMoneyOptions {
  /** Hide the currency label (e.g. inside a column already labelled SAR). */
  hideCurrency?: boolean;
}

/**
 * Formats an integer amount in halalas (1 SAR = 100 halalas).
 * Always uses Latin digits; the numeric part is bidi-isolated so the sign
 * and separators render correctly inside RTL text.
 * formatMoney(125000) => "1,250.00 ر.س"
 */
export function formatMoney(
  halalas: number,
  locale: Locale = "ar",
  options: FormatMoneyOptions = {},
): string {
  if (!Number.isSafeInteger(halalas)) {
    throw new TypeError(`formatMoney expects an integer amount in halalas, received ${halalas}`);
  }
  const sign = halalas < 0 ? "-" : "";
  const abs = Math.abs(halalas);
  const riyals = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(2, "0");
  const amount = `${LRI}${sign}${integerFormatter.format(riyals)}.${fraction}${PDI}`;
  if (options.hideCurrency) return amount;
  return locale === "ar" ? `${amount} ر.س` : `SAR ${amount}`;
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return `${LRI}${new Intl.NumberFormat("en-US", options).format(value)}${PDI}`;
}

export function formatPercent(ratio: number, fractionDigits = 1): string {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: fractionDigits,
  }).format(ratio);
  return `${LRI}${formatted}${PDI}`;
}

export function formatDate(value: string | Date, locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function formatDateTime(value: string | Date, locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string | Date, locale: Locale = "ar", now = Date.now()): string {
  const diffSeconds = Math.round((new Date(value).getTime() - now) / 1000);
  const rtf = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto", style: "short" });
  const abs = Math.abs(diffSeconds);
  if (abs < 60) return rtf.format(0, "minute");
  if (abs < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 2_592_000) return rtf.format(Math.round(diffSeconds / 86_400), "day");
  return formatDate(value, locale);
}

export function formatShortDate(value: string | Date, locale: Locale = "ar"): string {
  return new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short" }).format(
    new Date(value),
  );
}
