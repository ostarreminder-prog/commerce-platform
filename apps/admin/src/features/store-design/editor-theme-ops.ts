import type { ActorRef, Theme, ThemeSection } from "@repo/contracts";
import { uid } from "@repo/storefront-sections/editor";

/** Base template key or a `customTemplates` id — the picker can target either. */
export type EditorTemplateId = string;

/** Section list for a base template or a custom template id. */
export const sectionsOfTemplate = (d: Theme, tpl: EditorTemplateId): ThemeSection[] =>
  (d.sections as Record<string, ThemeSection[]>)[tpl] ??
  d.customTemplates?.find((c) => c.id === tpl)?.sections ??
  [];

/** Draft updater targeting a base template key or a `customTemplates` id. */
export const withSections =
  (tpl: EditorTemplateId, fn: (list: ThemeSection[]) => ThemeSection[]) =>
  (d: Theme): Theme => {
    if (Object.prototype.hasOwnProperty.call(d.sections, tpl)) {
      return { ...d, sections: { ...d.sections, [tpl]: fn((d.sections as Record<string, ThemeSection[]>)[tpl] ?? []) } };
    }
    return {
      ...d,
      customTemplates: (d.customTemplates ?? []).map((c) => (c.id === tpl ? { ...c, sections: fn(c.sections) } : c)),
    };
  };

/** Fresh ids for a pasted/duplicated section (section + nested blocks). */
export const cloneSection = (s: ThemeSection): ThemeSection => ({
  ...structuredClone(s),
  id: uid("sec"),
  blocks: s.blocks.map((b) => ({ ...b, id: uid("blk") })),
});

/** Local version snapshot — mirrors the api-client's (nested snapshots stripped). */
export const localSnapshot = (d: Theme): Theme => {
  const snap = structuredClone(d);
  snap.versions = snap.versions.map((v) => ({ ...v, snapshot: undefined }));
  return snap;
};

/** Actor stamped on client-side version entries (e.g. pre-preset snapshots). */
export const EDITOR_ACTOR: ActorRef = { type: "staff", id: "editor", name: "editor" };
