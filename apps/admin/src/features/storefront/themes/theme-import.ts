import { z } from "zod";
import type { Theme, ThemeSection } from "@repo/contracts";
import { isSectionType, SECTION_DEFINITIONS } from "@repo/storefront-sections/editor";

/** One import error — `key` resolves under `msg.editor.import.errors.*`. */
export interface ImportError {
  key: string;
  params?: Record<string, string | number>;
}

const sectionSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  hidden: z.boolean().default(false),
  visibility: z.record(z.boolean()).optional(),
  settings: z.record(z.unknown()).default({}),
  blocks: z
    .array(z.object({ id: z.string(), type: z.string(), settings: z.record(z.string()).default({}) }))
    .default([]),
});

const globalsSchema = z.object({
  primaryColor: z.string().default("#0f766e"),
  font: z.string().default("default"),
  headingFont: z.string().default(""),
  spacing: z.enum(["compact", "normal", "relaxed"]).default("normal"),
  radius: z.number().default(8),
  logoPosition: z.enum(["start", "center"]).default("start"),
  announcementBar: z.string().default(""),
  logo: z.string().optional(),
});

const themeSchema = z
  .object({
    name: z.string().min(1),
    sections: z.record(z.array(sectionSchema)),
    globals: globalsSchema,
    colorSchemes: z.array(z.record(z.unknown())).optional(),
    presets: z.array(z.record(z.unknown())).optional(),
    customTemplates: z
      .array(z.object({ id: z.string(), nameAr: z.string().default(""), nameEn: z.string().default(""), sections: z.array(sectionSchema).default([]) }))
      .optional(),
    pageExperiences: z.record(z.string()).optional(),
  })
  .passthrough();

/**
 * Validate a parsed JSON payload as a Theme — checks the envelope via zod and
 * every section's settings against its registry schema. Returns either a
 * draft-ready Theme or a list of msg keys to render.
 */
export function validateThemeImport(payload: unknown): { theme?: Theme; errors: ImportError[] } {
  const errors: ImportError[] = [];
  const parsed = themeSchema.safeParse(payload);
  if (!parsed.success) {
    return { errors: [{ key: "shape" }] };
  }
  const raw = parsed.data;

  const checkSections = (list: ThemeSection[], where: string) => {
    list.forEach((s, i) => {
      if (!isSectionType(s.type)) {
        errors.push({ key: "unknownType", params: { type: s.type, section: `${where} ${i + 1}` } });
        return;
      }
      const res = SECTION_DEFINITIONS[s.type].schema.safeParse(s.settings);
      if (!res.success) {
        errors.push({ key: "section", params: { section: `${where} ${i + 1}`, type: s.type } });
      } else {
        s.settings = res.data as ThemeSection["settings"];
      }
    });
  };
  Object.entries(raw.sections).forEach(([tpl, list]) => checkSections(list as ThemeSection[], tpl));
  (raw.customTemplates ?? []).forEach((c) => checkSections(c.sections as ThemeSection[], c.nameAr || c.id));
  if (errors.length) return { errors };

  const theme: Theme = {
    id: "import",
    name: raw.name,
    sections: raw.sections as Theme["sections"],
    globals: raw.globals,
    colorSchemes: raw.colorSchemes as Theme["colorSchemes"],
    presets: raw.presets as Theme["presets"],
    customTemplates: raw.customTemplates as Theme["customTemplates"],
    pageExperiences: raw.pageExperiences as Theme["pageExperiences"],
    scheduledPublish: null,
    activeWindow: null,
    status: "draft",
    versions: [],
    publishedAt: null,
  };
  return { theme, errors };
}
