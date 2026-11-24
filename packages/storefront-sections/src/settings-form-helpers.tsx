"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Label } from "@repo/ui/components/label";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

/** Loose translator — field/option keys are dynamic (`fields.${key}`). */
export type LooseT = ((key: string, params?: Record<string, string | number>) => string) & { has: (key: string) => boolean };

export interface FormCtx {
  t: LooseT;
  locale: "ar" | "en";
}

export function useFieldLabels() {
  const t = useTranslations("msg.editor") as unknown as LooseT;
  const { locale } = useAppLocale();
  return React.useMemo<FormCtx>(() => ({ t, locale }), [t, locale]);
}

export const asStr = (v: unknown, d = "") => (typeof v === "string" ? v : d);
export const asNum = (v: unknown, d = 0) => (typeof v === "number" ? v : d);
export const asBool = (v: unknown, d = false) => (typeof v === "boolean" ? v : d);

export function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
