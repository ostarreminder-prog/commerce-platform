import type { PreviewEntity, PreviewPersona } from "@repo/storefront-sections";
import type { Theme, ThemeDevice } from "@repo/contracts";

/**
 * postMessage contract between the theme editor (admin) and the storefront
 * `/preview` route (implemented in the storefront app).
 *
 * Editor → preview:
 *   { type: "theme:update", theme, template, device?, previewEntity? } — sent
 *     on every state change (and re-sent when the preview posts
 *     `preview:ready`). Extra fields are optional so older previews ignore them.
 *   { type: "section:select", sectionId } — sent when the editor selects a
 *     section so the preview can highlight/scroll to it.
 *   { type: "device:update", device } — preview renders for this device.
 *   { type: "entity:select", entity } — context entity (e.g. the product a
 *     `main-product` section resolves in the product template).
 *   { type: "persona", value } — "preview as" persona (guest/customer/with-cart).
 *
 * Preview → editor:
 *   { type: "preview:ready" } — the preview finished loading; editor re-sends
 *     the current theme.
 *   { type: "section:click", sectionId } — user clicked a section in the
 *     preview; editor selects it in the settings panel.
 */

/** Base URL of the storefront app (port 3001 in dev). */
export const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001";
/** Route inside the storefront that renders the live theme preview. */
export const PREVIEW_PATH = "/preview";
export const PREVIEW_URL = `${STOREFRONT_URL}${PREVIEW_PATH}`;

/** postMessage targetOrigin for the preview iframe. */
export const PREVIEW_ORIGIN = (() => {
  try {
    return new URL(STOREFRONT_URL).origin;
  } catch {
    return STOREFRONT_URL;
  }
})();

/* ---- editor → preview ---- */
export interface ThemeUpdateMessage {
  type: "theme:update";
  theme: Theme;
  /** Template currently being edited — a base ThemeTemplate or a `customTemplates` id. */
  template: string;
  /** Active preview device — sections apply visibility + overrides for it. */
  device?: ThemeDevice;
  /** Context entity — e.g. the picked product for the product template. */
  previewEntity?: PreviewEntity | null;
  /** "Preview as" persona stored in `SectionData.previewPersona`. */
  previewPersona?: PreviewPersona;
  /** True when `theme` is a version snapshot being previewed — preview ignores it. */
  previewOnly?: boolean;
}
export interface SectionSelectMessage {
  type: "section:select";
  sectionId: string | null;
}
export interface DeviceUpdateMessage {
  type: "device:update";
  device: ThemeDevice;
}
export interface EntitySelectMessage {
  type: "entity:select";
  entity: PreviewEntity | null;
}
export interface PersonaMessage {
  type: "persona";
  value: PreviewPersona;
}
export type EditorToPreviewMessage =
  | ThemeUpdateMessage
  | SectionSelectMessage
  | DeviceUpdateMessage
  | EntitySelectMessage
  | PersonaMessage;

/* ---- preview → editor ---- */
export interface PreviewReadyMessage {
  type: "preview:ready";
}
export interface SectionClickMessage {
  type: "section:click";
  sectionId: string;
}
export type PreviewToEditorMessage = PreviewReadyMessage | SectionClickMessage;

export function isPreviewToEditorMessage(data: unknown): data is PreviewToEditorMessage {
  if (!data || typeof data !== "object") return false;
  const type = (data as { type?: unknown }).type;
  return type === "preview:ready" || type === "section:click";
}
