"use client";

import { Sparkles } from "lucide-react";
import { Checkbox } from "@repo/ui/components/checkbox";
import { ImageField } from "@repo/ui/components/image-field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import type { FieldMeta, SectionSettings } from "./types";
import { useSectionData } from "./data-context";
import { useMediaAdapter } from "./media-context";
import { ExperienceSelectField } from "./settings-experience-field";
import { asBool, asNum, asStr, FieldRow, useFieldLabels } from "./settings-form-helpers";

/** Radix Select rejects empty-string values — "" (scheme inherit) rides as a sentinel. */
const NONE = "__default__";

export type SettingChange = (key: string, value: string | number | boolean | string[]) => void;

/** One auto-generated settings control driven by its FieldMeta. */
export function SettingField({
  field,
  settings,
  onChange,
  aiAssist,
}: {
  field: FieldMeta;
  settings: SectionSettings;
  onChange: SettingChange;
  /** "Write it for me" filler — text/localized fields show a sparkles button. */
  aiAssist?: (key: string) => string;
}) {
  const { t, locale } = useFieldLabels();
  const { products, categories, colorSchemes } = useSectionData();
  const media = useMediaAdapter();
  const label = t.has(`fields.${field.labelKey}`) ? t(`fields.${field.labelKey}`) : field.key;
  const optLabel = (value: string) => (t.has(`options.${value}`) ? t(`options.${value}`) : value);
  const aiButton = aiAssist ? (
    <button
      type="button"
      onClick={() => onChange(field.kind === "localized" ? `${field.key}Ar` : field.key, aiAssist(field.key))}
      aria-label={t("aiWrite")}
      title={t("aiWrite")}
      className="text-muted-foreground hover:text-primary absolute end-1 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded"
    >
      <Sparkles className="size-3.5" aria-hidden />
    </button>
  ) : null;

  switch (field.kind) {
    case "text":
      return (
        <FieldRow label={label}>
          <div className="relative">
            <Input value={asStr(settings[field.key])} onChange={(e) => onChange(field.key, e.target.value)} className={aiAssist ? "pe-8" : undefined} />
            {aiButton}
          </div>
        </FieldRow>
      );
    case "localized":
      return (
        <FieldRow label={label}>
          <div className="grid gap-2">
            <div className="relative">
              <Input
                dir="rtl"
                lang="ar"
                placeholder={t("arabic")}
                value={asStr(settings[`${field.key}Ar`])}
                onChange={(e) => onChange(`${field.key}Ar`, e.target.value)}
                className={aiAssist ? "pe-8" : undefined}
              />
              {aiButton}
            </div>
            <Input
              dir="ltr"
              lang="en"
              placeholder={t("english")}
              value={asStr(settings[`${field.key}En`])}
              onChange={(e) => onChange(`${field.key}En`, e.target.value)}
            />
          </div>
        </FieldRow>
      );
    case "number":
      return (
        <FieldRow label={label}>
          <Input
            type="number"
            min={field.min}
            max={field.max}
            value={asNum(settings[field.key])}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
          />
        </FieldRow>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between gap-3">
          <Label>{label}</Label>
          <Switch checked={asBool(settings[field.key])} onCheckedChange={(v) => onChange(field.key, v)} />
        </div>
      );
    case "select": {
      if (field.optionsSource === "experiences") {
        return <ExperienceSelectField label={label} value={asStr(settings[field.key])} onChange={(v) => onChange(field.key, v)} />;
      }
      if (field.optionsSource === "colorSchemes") {
        const value = asStr(settings[field.key]) || NONE;
        return (
          <FieldRow label={label}>
            <Select value={value} onValueChange={(v) => onChange(field.key, v === NONE ? "" : v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{optLabel("default")}</SelectItem>
                {(colorSchemes ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {locale === "ar" ? s.nameAr : s.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>
        );
      }
      return (
        <FieldRow label={label}>
          <Select value={asStr(settings[field.key])} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {optLabel(o.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      );
    }
    case "color": {
      const value = asStr(settings[field.key]);
      const swatch = /^#[0-9a-fA-F]{3,8}$/.test(value) ? value : "#000000";
      return (
        <FieldRow label={label}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={swatch}
              onChange={(e) => onChange(field.key, e.target.value)}
              className="border-input bg-background size-10 shrink-0 cursor-pointer rounded-md border p-1"
              aria-label={label}
            />
            <Input value={value} placeholder={t("colorPlaceholder")} dir="ltr" onChange={(e) => onChange(field.key, e.target.value)} />
          </div>
        </FieldRow>
      );
    }
    case "image": {
      const value = asStr(settings[field.key]);
      const set = (v: string | null) => onChange(field.key, v ?? "");
      if (media) {
        return (
          <FieldRow label={label}>
            <ImageField
              value={value}
              images={media.images}
              uploading={media.uploading}
              onSelect={(m) => set(m.url)}
              onUpload={
                media.upload
                  ? (file) => {
                      void Promise.resolve(media.upload?.(file)).then((m) => {
                        if (m && typeof m === "object" && "url" in m) set(m.url);
                      });
                    }
                  : undefined
              }
              onCropResult={set}
              onRemove={() => set(null)}
            />
            <Input dir="ltr" placeholder="https://…" value={value} onChange={(e) => set(e.target.value)} />
          </FieldRow>
        );
      }
      return (
        <FieldRow label={label}>
          <Input dir="ltr" placeholder="https://…" value={value} onChange={(e) => onChange(field.key, e.target.value)} />
        </FieldRow>
      );
    }
    case "entity-ref": {
      const items = field.entity === "category" ? categories : products;
      const current = asStr(settings[field.key]);
      return (
        <FieldRow label={label}>
          <Select value={current} onValueChange={(v) => onChange(field.key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={t("pickEntity")} />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name[locale] ?? item.name.ar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      );
    }
    case "entity-list": {
      const items = field.entity === "category" ? categories : products;
      const selected = Array.isArray(settings[field.key]) ? (settings[field.key] as string[]) : [];
      const toggle = (id: string, on: boolean) =>
        onChange(field.key, on ? [...selected, id] : selected.filter((x) => x !== id));
      return (
        <FieldRow label={label}>
          <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border p-2">
            {items.map((item) => {
              const checked = selected.includes(item.id);
              return (
                <label key={item.id} className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm">
                  <Checkbox checked={checked} onCheckedChange={(v) => toggle(item.id, v === true)} />
                  <span className="line-clamp-1">{item.name[locale] ?? item.name.ar}</span>
                </label>
              );
            })}
            {!items.length ? <p className="text-muted-foreground px-2 py-3 text-xs">{t("noEntities")}</p> : null}
          </div>
        </FieldRow>
      );
    }
    default:
      return null;
  }
}
