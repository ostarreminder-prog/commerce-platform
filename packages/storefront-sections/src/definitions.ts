import type { SectionDefinition, SectionSettings, SectionType } from "./types";
import { BASE_SECTION_DEFINITIONS } from "./schemas";
import { NEW_SECTION_DEFINITIONS } from "./schemas-new";

export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
  ...BASE_SECTION_DEFINITIONS,
  ...NEW_SECTION_DEFINITIONS,
};

/** Validated settings for a section type — unknown keys are stripped, defaults applied. */
export const parseSettings = (type: SectionType, settings: SectionSettings): SectionSettings =>
  SECTION_DEFINITIONS[type].schema.parse(settings) as SectionSettings;
