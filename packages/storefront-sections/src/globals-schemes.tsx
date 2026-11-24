"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import type { ColorScheme } from "./types";
import { useFieldLabels } from "./settings-form-helpers";

const COLOR_KEYS = ["background", "text", "buttonBg", "buttonText", "accent"] as const;

const isHex = (v: string) => /^#[0-9a-fA-F]{3,8}$/.test(v);

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="color"
          value={isHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="border-input bg-background size-8 shrink-0 cursor-pointer rounded-md border p-0.5"
          aria-label={label}
        />
        <Input dir="ltr" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-xs" />
      </div>
    </div>
  );
}

/** Color-scheme manager — list/edit/add/remove named token sets for sections. */
export function SchemesEditor({ schemes, onChange }: { schemes: ColorScheme[]; onChange: (next: ColorScheme[]) => void }) {
  const { t } = useFieldLabels();
  const seq = React.useRef(0);

  const update = (id: string, patch: Partial<ColorScheme>) =>
    onChange(schemes.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id: string) => onChange(schemes.filter((s) => s.id !== id));
  const add = () =>
    onChange([
      ...schemes,
      {
        id: `scheme_${Date.now().toString(36)}${(seq.current++).toString(36)}`,
        nameAr: "",
        nameEn: "",
        background: "#ffffff",
        text: "#1a1a2e",
        buttonBg: "#0d6e5f",
        buttonText: "#ffffff",
        accent: "#e8f4f0",
      },
    ]);

  const fieldLabel = (key: string) => (t.has(`fields.${key}`) ? t(`fields.${key}`) : key);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>{t("schemes")}</Label>
        <button
          type="button"
          onClick={add}
          className="border-input hover:bg-accent inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium"
        >
          <Plus className="size-3.5" aria-hidden />
          {t("addScheme")}
        </button>
      </div>
      {schemes.map((scheme, i) => (
        <div key={scheme.id} className="space-y-3 rounded-lg border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground text-xs font-medium">
              {scheme.nameAr || scheme.nameEn || `${t("schemes")} ${i + 1}`}
            </span>
            <button
              type="button"
              onClick={() => remove(scheme.id)}
              className="text-destructive hover:bg-destructive/10 inline-flex size-7 items-center justify-center rounded-md"
              aria-label={t("removeScheme")}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          </div>
          <div className="grid gap-2">
            <Input
              dir="rtl"
              placeholder={`${fieldLabel("nameAr")}`}
              value={scheme.nameAr}
              onChange={(e) => update(scheme.id, { nameAr: e.target.value })}
            />
            <Input
              dir="ltr"
              placeholder={`${fieldLabel("nameEn")}`}
              value={scheme.nameEn}
              onChange={(e) => update(scheme.id, { nameEn: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {COLOR_KEYS.map((key) => (
              <ColorInput
                key={key}
                label={fieldLabel(key === "accent" ? "accentColor" : key)}
                value={scheme[key]}
                onChange={(v) => update(scheme.id, { [key]: v })}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
