"use client";

import { useTranslations } from "next-intl";
import { THEME_FEATURES, type ThemeFeatureSettings, type ThemePreset } from "@repo/contracts";
import { ImageField } from "@repo/ui/components/image-field";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { cn } from "@repo/ui/lib/cn";
import { useMediaAdapter } from "./media-context";
import type { ColorScheme, ThemeGlobals } from "./types";
import { SchemesEditor } from "./globals-schemes";
import { useFieldLabels } from "./settings-form-helpers";

export interface GlobalsSettingsFormProps {
  value: ThemeGlobals;
  onChange: (next: ThemeGlobals) => void;
  /** Theme color schemes — the manager renders when both props are provided. */
  schemes?: ColorScheme[];
  onSchemesChange?: (next: ColorScheme[]) => void;
  /** Theme presets — the picker renders when both props are provided. */
  presets?: ThemePreset[];
  onApplyPreset?: (preset: ThemePreset) => void;
  /** Storefront feature toggles (Theme.features) — the "مميزات المتجر" card renders when the callback is set. */
  features?: Record<string, boolean>;
  featureSettings?: ThemeFeatureSettings;
  onFeaturesChange?: (features: Record<string, boolean>, settings: ThemeFeatureSettings) => void;
  className?: string;
}

const FONT_OPTIONS = ["default", "cairo", "tajawal", "ibm"] as const;
const LOGO_POSITIONS = ["start", "center"] as const;
const SPACING_OPTIONS = ["compact", "normal", "relaxed"] as const;

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useFieldLabels();
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value || "default"} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FONT_OPTIONS.map((f) => (
            <SelectItem key={f} value={f}>
              {t.has(`options.font.${f}`) ? t(`options.font.${f}`) : f}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Settings form for Theme.globals — colors, typography, density, radius, logo, announcement + schemes/presets. */
export function GlobalsSettingsForm({ value, onChange, schemes, onSchemesChange, presets, onApplyPreset, features, featureSettings, onFeaturesChange, className }: GlobalsSettingsFormProps) {
  const t = useTranslations("msg.editor");
  const tf = useTranslations("msg.features");
  const { locale } = useFieldLabels();
  const media = useMediaAdapter();
  const set = <K extends keyof ThemeGlobals>(key: K, v: ThemeGlobals[K]) => onChange({ ...value, [key]: v });
  const swatch = /^#[0-9a-fA-F]{3,8}$/.test(value.primaryColor) ? value.primaryColor : "#000000";

  return (
    <div className={cn("space-y-4", className)}>
      {presets?.length && onApplyPreset ? (
        <div className="space-y-1.5">
          <Label>{t("preset")}</Label>
          <Select
            onValueChange={(id) => {
              const preset = presets.find((p) => p.id === id);
              if (preset) onApplyPreset(preset);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("preset")} />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {locale === "ar" ? p.nameAr : p.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
      <div className="space-y-1.5">
        <Label>{t("fields.primaryColor")}</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={swatch}
            onChange={(e) => set("primaryColor", e.target.value)}
            className="border-input bg-background size-10 shrink-0 cursor-pointer rounded-md border p-1"
            aria-label={t("fields.primaryColor")}
          />
          <Input dir="ltr" value={value.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} />
        </div>
      </div>
      <FontSelect label={t("fields.font")} value={value.font} onChange={(v) => set("font", v)} />
      <FontSelect label={t("fields.headingFont")} value={value.headingFont} onChange={(v) => set("headingFont", v)} />
      <div className="space-y-1.5">
        <Label>{t("fields.spacing")}</Label>
        <Select value={value.spacing} onValueChange={(v) => set("spacing", v as ThemeGlobals["spacing"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPACING_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {t.has(`options.${s}`) ? t(`options.${s}`) : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>{t("fields.radius")}</Label>
        <Input
          type="number"
          min={0}
          max={24}
          value={value.radius}
          onChange={(e) => set("radius", Number(e.target.value))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("fields.logo")}</Label>
        {media ? (
          <ImageField
            value={value.logo ?? ""}
            images={media.images}
            uploading={media.uploading}
            onSelect={(m) => set("logo", m.url)}
            onUpload={
              media.upload
                ? (file) => {
                    void Promise.resolve(media.upload?.(file)).then((m) => {
                      if (m && typeof m === "object" && "url" in m) set("logo", m.url);
                    });
                  }
                : undefined
            }
            onCropResult={(d) => set("logo", d)}
            onRemove={() => set("logo", "")}
          />
        ) : (
          <Input dir="ltr" placeholder="https://…" value={value.logo ?? ""} onChange={(e) => set("logo", e.target.value)} />
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{t("fields.logoPosition")}</Label>
        <Select value={value.logoPosition} onValueChange={(v) => set("logoPosition", v as ThemeGlobals["logoPosition"])}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOGO_POSITIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {t.has(`options.${p}`) ? t(`options.${p}`) : p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="globals-announcement">{t("fields.announcement")}</Label>
        <Input id="globals-announcement" value={value.announcementBar} onChange={(e) => set("announcementBar", e.target.value)} />
      </div>
      {schemes && onSchemesChange ? (
        <div className="border-t pt-4">
          <SchemesEditor schemes={schemes} onChange={onSchemesChange} />
        </div>
      ) : null}
      {onFeaturesChange ? (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-semibold">{tf("title")}</p>
          {THEME_FEATURES.map((key) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <Label htmlFor={`feat-${key}`} className="font-normal">
                {tf.has(key) ? tf(key) : key}
              </Label>
              <Switch
                id={`feat-${key}`}
                checked={features?.[key] !== false}
                onCheckedChange={(v) => onFeaturesChange({ ...(features ?? {}), [key]: v }, featureSettings ?? {})}
              />
            </div>
          ))}
          <div className="space-y-1.5 pt-1">
            <Label htmlFor="feat-threshold">{tf("scarcityThreshold")}</Label>
            <Input
              id="feat-threshold"
              type="number"
              min={1}
              max={50}
              disabled={features?.scarcity === false}
              value={featureSettings?.scarcityThreshold ?? 5}
              onChange={(e) => onFeaturesChange(features ?? {}, { ...(featureSettings ?? {}), scarcityThreshold: Math.max(1, Number(e.target.value) || 1) })}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
