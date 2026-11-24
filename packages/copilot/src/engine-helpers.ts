import type { Product } from "@repo/contracts";
import type { PlannedStep } from "./types";

/* -------------------------------------------------------- text utils */

let seq = 0;
export const uid = (p: string) => `${p}_${Date.now().toString(36)}${(seq++).toString(36)}`;

/**
 * Arabic normalization for keyword matching: strips tatweel + tashkeel,
 * unifies hamza/alef forms, folds ة→ه and ى→ي, lowercases, collapses spaces.
 */
export const normalizeArabic = (s: string): string =>
  s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/* --------------------------------------------------------- fmt utils */

/** halalas → "1,234.5 ر.س" */
export const fmtSAR = (halalas: number): string =>
  `${(halalas / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} ر.س`;

/** Latest timestamp in a dataset — the mock clock is anchored to a fixed
 *  "now", so relative windows are computed against the data itself. */
export const dataNow = (dates: (string | null | undefined)[]): number =>
  dates.reduce((m, d) => Math.max(m, d ? +new Date(d) : 0), 0) || Date.now();

export const DAY_MS = 86_400_000;

/* ------------------------------------------------------ entity utils */

export const minVariantPrice = (p: Product): number => Math.min(...p.variants.map((v) => v.price.amount));

export const step = (title: string, toolName: string, args: Record<string, unknown>): PlannedStep => ({
  id: uid("st"), title, toolName, args, status: "pending",
});
