"use client";

import * as React from "react";
import { Label } from "@repo/ui/components/label";
import { Switch } from "@repo/ui/components/switch";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { cn } from "@repo/ui/lib/cn";
import type { SectionBlock, SectionSettings, ThemeDevice, ThemeSection } from "./types";
import { isSectionType } from "./types";
import { SECTION_DEFINITIONS } from "./definitions";
import { experienceEntry } from "./experiences/registry";
import { BlocksEditor } from "./settings-blocks";
import { SettingField, type SettingChange } from "./settings-field";
import { useFieldLabels } from "./settings-form-helpers";

const DEVICE_TABS: ("all" | "mobile" | "tablet")[] = ["all", "mobile", "tablet"];
const DEVICES: ThemeDevice[] = ["mobile", "tablet", "desktop"];

export interface SectionSettingsFormProps {
  section: ThemeSection;
  onChange: (next: ThemeSection) => void;
  /**
   * Optional "write it for me" helper — when provided, text/localized fields
   * show a sparkles button that fills the field with `aiAssist(field.key)`.
   */
  aiAssist?: (key: string) => string;
  className?: string;
}

/**
 * Auto-generated settings form — fields come from the section's FieldMeta.
 * Device tabs (mobile/tablet) write overrides into `settings[device]` and a
 * per-device visibility group controls `section.visibility`.
 */
export function SectionSettingsForm({ section, onChange, aiAssist, className }: SectionSettingsFormProps) {
  const { t } = useFieldLabels();
  const [deviceTab, setDeviceTab] = React.useState<"all" | "mobile" | "tablet">("all");
  if (!isSectionType(section.type)) return null;
  const def = SECTION_DEFINITIONS[section.type];
  const { fields } = def;
  const setSetting: SettingChange = (key, value) =>
    onChange({ ...section, settings: { ...section.settings, [key]: value } });
  const setBlocks = (blocks: SectionBlock[]) => onChange({ ...section, blocks });

  /* Per-device writes go to `settings[device]`; display shows the merged value. */
  const deviceOverrides = (deviceTab !== "all" ? section.settings[deviceTab] : undefined) as
    | Record<string, string | number | boolean | string[]>
    | undefined;
  const mergedSettings: SectionSettings = { ...section.settings, ...(deviceOverrides ?? {}) };
  const setDeviceSetting: SettingChange = (key, value) =>
    onChange({
      ...section,
      settings: { ...section.settings, [deviceTab]: { ...(deviceOverrides ?? {}), [key]: value } },
    });
  const setVisible = (device: ThemeDevice, visible: boolean) =>
    onChange({ ...section, visibility: { ...section.visibility, [device]: visible } });

  const overrideable = new Set(def.deviceOverrides ?? []);
  const deviceFields = fields.filter((fld) => fld.kind !== "blocks" && overrideable.has(fld.key));

  /* Sections with a `view` experience-select render the picked experience's
   * own fields (e.g. immersive-product's productId) below the section fields. */
  const hasViewField = fields.some((fld) => fld.optionsSource === "experiences");
  const experienceFields = hasViewField ? (experienceEntry(section.settings.view).fields ?? []) : [];

  return (
    <div className={cn("space-y-4", className)}>
      <Tabs value={deviceTab} onValueChange={(v) => setDeviceTab(v as typeof deviceTab)}>
        <TabsList className="w-full">
          {DEVICE_TABS.map((d) => (
            <TabsTrigger key={d} value={d} className="flex-1 text-xs">
              {t(`device.${d}`)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {deviceTab === "all" ? (
        fields.map((field) =>
          field.kind === "blocks" ? (
            <BlocksEditor key={field.key} field={field} blocks={section.blocks} onChange={setBlocks} />
          ) : (
            <SettingField key={field.key} field={field} settings={section.settings} onChange={setSetting} aiAssist={aiAssist} />
          ),
        )
      ) : null}
      {deviceTab === "all"
        ? experienceFields.map((field) =>
            /* Block-kind experience fields (e.g. contextual-shopping hotspots)
             * write to `section.blocks`, same as the section's own blocks. */
            field.kind === "blocks" ? (
              <BlocksEditor key={`exp:${field.key}`} field={field} blocks={section.blocks} onChange={setBlocks} />
            ) : (
              <SettingField key={`exp:${field.key}`} field={field} settings={section.settings} onChange={setSetting} aiAssist={aiAssist} />
            ),
          )
        : null}
      {deviceTab !== "all" && (
        <>
          <p className="text-muted-foreground text-xs">{t("deviceHint")}</p>
          {deviceFields.length ? (
            deviceFields.map((field) => (
              <SettingField key={field.key} field={field} settings={mergedSettings} onChange={setDeviceSetting} />
            ))
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-center text-xs">{t("noDeviceFields")}</p>
          )}
        </>
      )}

      <div className="space-y-2 border-t pt-4">
        <Label>{t("visibility")}</Label>
        {DEVICES.map((device) => (
          <div key={device} className="flex items-center justify-between gap-3">
            <span className="text-sm">{t(`device.${device}`)}</span>
            <Switch checked={section.visibility?.[device] !== false} onCheckedChange={(v) => setVisible(device, v)} />
          </div>
        ))}
      </div>
    </div>
  );
}
