import type { Media, Theme, ThemeSection } from "@repo/contracts";
import { SECTION_DEFINITIONS, isSectionType } from "@repo/storefront-sections/editor";
import { sectionsOfTemplate } from "./editor-theme-ops";

export type QualityIssueKind =
  | "heavy-image"
  | "low-contrast"
  | "missing-en"
  | "missing-alt"
  | "empty-section"
  | "broken-link"
  | "button-no-url";

export interface QualityIssue {
  kind: QualityIssueKind;
  /** Template the section lives in — empty for theme-level issues (schemes). */
  template: string;
  /** Target section — null for theme-level issues. */
  sectionId: string | null;
  /** Offending settings key / scheme id, for context. */
  detail?: string;
}

export type QualityScore = "fast" | "medium" | "slow";

export interface QualityReport {
  issues: QualityIssue[];
  score: QualityScore;
  counts: { sections: number; images: number; heavyImages: number };
}

export const HEAVY_IMAGE_BYTES = 500 * 1024;
/** WCAG-ish threshold — lenient (large text) since schemes drive headings too. */
const CONTRAST_MIN = 3;

const asStr = (v: unknown) => (typeof v === "string" ? v : "");

const hexToRgb = (hex: string): [number, number, number] | null => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  const raw = m?.[1];
  if (!raw) return null;
  const h = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

const luminance = ([r, g, b]: [number, number, number]) => {
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

export const contrastRatio = (a: string, b: string): number | null => {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  if (!ra || !rb) return null;
  const [l1 = 0, l2 = 0] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const templateIds = (theme: Theme): string[] => [
  ...Object.keys(theme.sections),
  ...(theme.customTemplates ?? []).map((c) => c.id),
];

const sectionTemplates = (theme: Theme): { template: string; section: ThemeSection }[] =>
  templateIds(theme).flatMap((tpl) => sectionsOfTemplate(theme, tpl).map((section) => ({ template: tpl, section })));

/** Audit the draft sections → clickable issues + a rough performance score. */
export function auditTheme(theme: Theme, media: Media[]): QualityReport {
  const issues: QualityIssue[] = [];
  const mediaByUrl = new Map(media.map((m) => [m.url, m]));
  let imageCount = 0;
  let heavyImages = 0;
  const seenImages = new Set<string>();

  /* Theme-level: low-contrast color schemes. */
  for (const scheme of theme.colorSchemes ?? []) {
    const ratio = contrastRatio(scheme.background, scheme.text);
    if (ratio !== null && ratio < CONTRAST_MIN) {
      issues.push({ kind: "low-contrast", template: "", sectionId: null, detail: scheme.id });
    }
  }

  for (const { template, section } of sectionTemplates(theme)) {
    const def = isSectionType(section.type) ? SECTION_DEFINITIONS[section.type] : null;
    const fields = def?.fields ?? [];
    const put = (kind: QualityIssueKind, detail?: string) => issues.push({ kind, template, sectionId: section.id, detail });
    const checkImage = (url: string) => {
      if (!url) return;
      const m = mediaByUrl.get(url);
      if (!m) return;
      if (!seenImages.has(m.id)) {
        seenImages.add(m.id);
        imageCount += 1;
      }
      if (m.sizeBytes > HEAVY_IMAGE_BYTES) {
        heavyImages += 1;
        put("heavy-image", m.id);
      }
      if (!m.altAr && !m.altEn) put("missing-alt", m.id);
    };
    let hasContent = section.blocks.length > 0;

    for (const field of fields) {
      if (field.kind === "localized") {
        const ar = asStr(section.settings[`${field.key}Ar`]);
        const en = asStr(section.settings[`${field.key}En`]);
        if (ar.trim() || en.trim()) hasContent = true;
        if (ar.trim() && !en.trim()) put("missing-en", field.key);
      } else if (field.kind === "text" || field.kind === "color") {
        if (asStr(section.settings[field.key]).trim()) hasContent = true;
      } else if (field.kind === "image") {
        const url = asStr(section.settings[field.key]);
        if (url) hasContent = true;
        checkImage(url);
      } else if (field.kind === "entity-ref" || field.kind === "entity-list") {
        const v = section.settings[field.key];
        if (typeof v === "string" ? v : Array.isArray(v) && v.length) hasContent = true;
      }
    }
    /* URL settings: label set but url empty/"#" → broken link. */
    for (const [key, value] of Object.entries(section.settings)) {
      if (!/url$/i.test(key) || typeof value !== "string") continue;
      if (value === "" || value === "#") {
        const labelKey = key.replace(/url$/i, "Label");
        const hasLabel = asStr(section.settings[labelKey]).trim() || asStr(section.settings[`${labelKey}Ar`]).trim();
        if (hasLabel) put("broken-link", key);
      }
    }
    /* Blocks: buttons without url + image checks on block settings. */
    for (const block of section.blocks) {
      if (block.type === "button" && (!block.settings.url || block.settings.url === "#")) put("button-no-url", block.id);
      for (const [key, value] of Object.entries(block.settings)) {
        if (/image|url$/i.test(key) && value) checkImage(value);
      }
    }
    if (!hasContent) put("empty-section", section.type);
  }

  const sections = sectionTemplates(theme).length;
  const score: QualityScore = heavyImages >= 4 || sections >= 45 ? "slow" : heavyImages >= 1 || sections >= 20 ? "medium" : "fast";
  return { issues, score, counts: { sections, images: imageCount, heavyImages } };
}
