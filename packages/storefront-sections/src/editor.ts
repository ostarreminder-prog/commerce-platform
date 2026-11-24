/** Editor-side surface: settings forms + section/block registries + section factory. */
export { SectionSettingsForm, type SectionSettingsFormProps } from "./settings-form";
export { GlobalsSettingsForm, type GlobalsSettingsFormProps } from "./globals-form";
export { SchemesEditor } from "./globals-schemes";
export { createSection, SECTION_REGISTRY, uid, type SectionRegistryEntry, type SectionComponent } from "./registry";
export { BLOCK_REGISTRY, BLOCK_TYPES, blockDef, isBlockType, type BlockType, type BlockRegistryEntry } from "./blocks";
export { SECTION_DEFINITIONS, parseSettings } from "./definitions";
export { SECTION_TYPES, isSectionType } from "./types";
export { MediaAdapterProvider, useMediaAdapter, type SectionMediaAdapter } from "./media-context";
export { SectionCommerceProvider, useSectionCommerce, type SectionCommerceAdapter } from "./commerce-context";
export {
  EXPERIENCE_IDS,
  EXPERIENCE_REGISTRY,
  isExperienceId,
  PAGE_EXPERIENCE_OPTIONS,
  isPageExperience,
  type ExperienceId,
  type ExperienceRegistryEntry,
} from "./experiences";
export { useDevice, deviceForWidth, resolveDeviceSettings, visibilityClasses, isVisibleOnDevice } from "./device";
export { schemeStyleVars, findScheme } from "./schemes";
export type { FieldMeta, FieldKind, SectionDefinition, SectionType, SelectOption } from "./types";
