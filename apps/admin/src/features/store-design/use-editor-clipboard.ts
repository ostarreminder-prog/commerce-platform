"use client";

import * as React from "react";
import type { Theme, ThemeSection } from "@repo/contracts";
import { isSectionType } from "@repo/storefront-sections/editor";
import type { useMsgToast } from "@repo/ui/components/msg-toast";
import { cloneSection, sectionsOfTemplate, withSections, type EditorTemplateId } from "./editor-theme-ops";

interface ClipboardDeps {
  draftRef: React.MutableRefObject<Theme>;
  templateRef: React.MutableRefObject<EditorTemplateId>;
  apply: (fn: (d: Theme) => Theme) => void;
  selectSection: (id: string | null) => void;
  mt: ReturnType<typeof useMsgToast>;
  t: (key: string) => string;
}

/**
 * Section clipboard — copy/cut store a section clone; paste inserts it (fresh
 * ids) at the end of the *current* template's list, so sections can move
 * between templates. Cut removes the section immediately.
 */
export function useEditorClipboard({ draftRef, templateRef, apply, selectSection, mt, t }: ClipboardDeps) {
  const clipboardRef = React.useRef<ThemeSection | null>(null);
  const [hasClipboard, setHasClipboard] = React.useState(false);

  const findSection = React.useCallback(
    (id: string) => sectionsOfTemplate(draftRef.current, templateRef.current).find((s) => s.id === id),
    [draftRef, templateRef],
  );
  const label = React.useCallback(
    (s: ThemeSection) => (isSectionType(s.type) ? t(`sectionType.${s.type}`) : s.type),
    [t],
  );

  const copySection = React.useCallback(
    (id: string) => {
      const s = findSection(id);
      if (!s) return;
      clipboardRef.current = structuredClone(s);
      setHasClipboard(true);
      mt.success("editor.clipboard.copied", { section: label(s) });
    },
    [findSection, label, mt],
  );
  const cutSection = React.useCallback(
    (id: string) => {
      const s = findSection(id);
      if (!s) return;
      clipboardRef.current = structuredClone(s);
      setHasClipboard(true);
      apply(withSections(templateRef.current, (l) => l.filter((x) => x.id !== id)));
      selectSection(null);
      mt.success("editor.clipboard.cutToast", { section: label(s) });
    },
    [findSection, apply, templateRef, selectSection, label, mt],
  );
  const pasteSection = React.useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip) return;
    const next = cloneSection(clip);
    apply(withSections(templateRef.current, (l) => [...l, next]));
    selectSection(next.id);
    mt.success("editor.clipboard.pasted", { section: label(next) });
  }, [apply, templateRef, selectSection, label, mt]);
  const duplicateSection = React.useCallback(
    (id: string) => {
      const tpl = templateRef.current;
      const list = sectionsOfTemplate(draftRef.current, tpl);
      const index = list.findIndex((s) => s.id === id);
      const src = list[index];
      if (!src) return;
      const next = cloneSection(src);
      apply(withSections(tpl, (l) => [...l.slice(0, index + 1), next, ...l.slice(index + 1)]));
      selectSection(next.id);
    },
    [apply, draftRef, templateRef, selectSection],
  );

  return { hasClipboard, copySection, cutSection, pasteSection, duplicateSection };
}
