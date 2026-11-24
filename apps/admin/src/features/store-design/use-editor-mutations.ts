"use client";

import * as React from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { ColorScheme, Theme, ThemeFeatureSettings, ThemeGlobals, ThemePreset, ThemeSection, ThemeVersion } from "@repo/contracts";
import { createSection, isSectionType, uid, type SectionType } from "@repo/storefront-sections/editor";
import type { useMsgToast } from "@repo/ui/components/msg-toast";
import { formatDateTime, type Locale } from "@repo/ui/lib/format";
import { EDITOR_ACTOR, localSnapshot, sectionsOfTemplate, withSections, type EditorTemplateId } from "./editor-theme-ops";

interface MutationDeps {
  draftRef: React.MutableRefObject<Theme>;
  templateRef: React.MutableRefObject<EditorTemplateId>;
  selectedSectionIdRef: React.MutableRefObject<string | null>;
  apply: (fn: (d: Theme) => Theme) => void;
  selectSection: (id: string | null) => void;
  mt: ReturnType<typeof useMsgToast>;
  t: (key: string) => string;
  locale: Locale;
}

/** Draft mutations: section CRUD, globals/schemes, presets (snapshot-first), AI apply, version restore. */
export function useEditorMutations({ draftRef, templateRef, selectedSectionIdRef, apply, selectSection, mt, t, locale }: MutationDeps) {
  const updateSection = React.useCallback(
    (next: ThemeSection) =>
      apply(withSections(templateRef.current, (list) => list.map((s) => (s.id === next.id ? next : s)))),
    [apply, templateRef],
  );
  const toggleSectionHidden = React.useCallback(
    (id: string) =>
      apply(withSections(templateRef.current, (list) => list.map((s) => (s.id === id ? { ...s, hidden: !s.hidden } : s)))),
    [apply, templateRef],
  );
  const moveSection = React.useCallback(
    (activeId: string, overId: string) =>
      apply(
        withSections(templateRef.current, (list) => {
          const from = list.findIndex((s) => s.id === activeId);
          const to = list.findIndex((s) => s.id === overId);
          return from < 0 || to < 0 || from === to ? list : arrayMove(list, from, to);
        }),
      ),
    [apply, templateRef],
  );
  const addSection = React.useCallback(
    (type: SectionType) => {
      const section = createSection(type);
      apply(withSections(templateRef.current, (list) => [...list, section]));
      selectSection(section.id);
    },
    [apply, templateRef, selectSection],
  );
  const removeSection = React.useCallback(
    (id: string) => {
      const tpl = templateRef.current;
      const index = sectionsOfTemplate(draftRef.current, tpl).findIndex((s) => s.id === id);
      const removed = index >= 0 ? sectionsOfTemplate(draftRef.current, tpl)[index] : undefined;
      if (!removed) return;
      apply(withSections(tpl, (l) => l.filter((s) => s.id !== id)));
      if (selectedSectionIdRef.current === id) selectSection(null);
      const label = isSectionType(removed.type) ? t(`sectionType.${removed.type}`) : removed.type;
      mt.success("editor.section.removed", { section: label }, {
        undo: () => apply(withSections(tpl, (l) => [...l.slice(0, index), removed, ...l.slice(index)])),
      });
    },
    [apply, templateRef, draftRef, selectedSectionIdRef, selectSection, mt, t],
  );
  const setGlobals = React.useCallback((globals: ThemeGlobals) => apply((d) => ({ ...d, globals })), [apply]);
  /** Full-page experience for the real PDP/PLP — stored on `theme.pageExperiences` ("classic" = built-in layout). */
  const setPageExperience = React.useCallback(
    (tpl: "product" | "category", value: string) =>
      apply((d) => ({ ...d, pageExperiences: { ...d.pageExperiences, [tpl]: value } as Theme["pageExperiences"] })),
    [apply],
  );
  /** "مميزات المتجر" card — feature toggles + numeric feature settings live on the theme root. */
  const setFeatures = React.useCallback(
    (features: Theme["features"], featureSettings: ThemeFeatureSettings) => apply((d) => ({ ...d, features, featureSettings })),
    [apply],
  );
  const setColorSchemes = React.useCallback(
    (colorSchemes: ColorScheme[]) => apply((d) => ({ ...d, colorSchemes })),
    [apply],
  );
  /** Apply a preset — snapshots the current draft as a version first, then merges globals + scheme overrides. */
  const applyPreset = React.useCallback(
    (preset: ThemePreset) => {
      apply((d) => ({
        ...d,
        versions: [
          ...d.versions,
          { id: uid("ver"), at: new Date().toISOString(), actor: EDITOR_ACTOR, note: `preset:${preset.id}`, snapshot: localSnapshot(d) },
        ],
        globals: { ...d.globals, ...preset.globals },
        colorSchemes: preset.colorSchemeOverrides
          ? (d.colorSchemes ?? []).map((s) =>
              preset.colorSchemeOverrides?.[s.id] ? { ...s, ...preset.colorSchemeOverrides[s.id] } : s,
            )
          : d.colorSchemes,
      }));
      mt.success("editor.presetApplied", { preset: locale === "ar" ? preset.nameAr : preset.nameEn });
    },
    [apply, mt, locale],
  );
  /** AI-generated look — replaces globals and optionally re-orders a template's sections. */
  const applyGenerated = React.useCallback(
    (globals: ThemeGlobals, order?: { template: EditorTemplateId; sectionIds: string[] }) => {
      apply((d) => {
        let next: Theme = { ...d, globals };
        if (order) {
          next = withSections(order.template, (list) => {
            const byId = new Map(list.map((s) => [s.id, s]));
            const sorted = order.sectionIds.map((id) => byId.get(id)).filter((s): s is ThemeSection => Boolean(s));
            return [...sorted, ...list.filter((s) => !order.sectionIds.includes(s.id))];
          })(next);
        }
        return next;
      });
      mt.success("editor.ai.applied");
    },
    [apply, mt],
  );
  /** Restore a version snapshot as the draft (history keeps the pre-restore state). */
  const restoreVersion = React.useCallback(
    (version: ThemeVersion) => {
      if (version.snapshot) {
        const snap = structuredClone(version.snapshot);
        apply((d) => ({
          ...snap,
          id: d.id,
          status: "draft",
          versions: d.versions,
          scheduledPublish: d.scheduledPublish,
          activeWindow: d.activeWindow,
          publishedAt: d.publishedAt,
        }));
      } else {
        apply((d) => d); // legacy version without a snapshot — history push only
      }
      mt.success("editor.version.restored", { date: formatDateTime(version.at, locale) });
    },
    [apply, mt, locale],
  );

  return {
    updateSection,
    toggleSectionHidden,
    moveSection,
    addSection,
    removeSection,
    setGlobals,
    setPageExperience,
    setFeatures,
    setColorSchemes,
    applyPreset,
    applyGenerated,
    restoreVersion,
  };
}
