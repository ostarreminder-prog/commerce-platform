"use client";

import { cn } from "@repo/ui/lib/cn";
import type { ThemeSection } from "./types";
import { isSectionType } from "./types";
import { SectionDataProvider, useSectionData, type SectionDataProviderProps } from "./data-context";
import { isVisibleOnDevice, resolveDeviceSettings, useDevice, visibilityClasses } from "./device";
import { SECTION_REGISTRY } from "./registry";
import { findScheme, schemeStyleVars } from "./schemes";

/**
 * Render one section; unknown types render nothing so old templates don't break.
 * The wrapper div scopes color-scheme tokens, hides the section on devices it
 * disabled (CSS media queries), and merges per-device setting overrides.
 */
export function SectionRenderer({ section }: { section: ThemeSection }) {
  const { colorSchemes, device: contextDevice } = useSectionData();
  const viewportDevice = useDevice();
  const device = contextDevice ?? viewportDevice;

  if (!isSectionType(section.type) || !isVisibleOnDevice(section, device)) return null;
  const Component = SECTION_REGISTRY[section.type].component;
  const scheme = findScheme(colorSchemes, section.settings.colorScheme);
  const resolved: ThemeSection = device ? { ...section, settings: resolveDeviceSettings(section.settings, device) } : section;

  return (
    <div className={cn(visibilityClasses(section.visibility))} style={scheme ? schemeStyleVars(scheme) : undefined}>
      <Component section={resolved} />
    </div>
  );
}

export interface ThemeTemplateRendererProps {
  sections: ThemeSection[];
  /** When provided, wraps the render in a SectionDataProvider. */
  data?: Omit<SectionDataProviderProps, "children">;
}

/** Render a template's sections in order, skipping hidden ones. */
export function ThemeTemplateRenderer({ sections, data }: ThemeTemplateRendererProps) {
  const body = sections.filter((s) => !s.hidden).map((s) => <SectionRenderer key={s.id} section={s} />);
  if (!data) return <>{body}</>;
  return <SectionDataProvider {...data}>{body}</SectionDataProvider>;
}
