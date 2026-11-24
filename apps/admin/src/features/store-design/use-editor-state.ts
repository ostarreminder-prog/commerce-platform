"use client";

import * as React from "react";
import type { Theme, ThemeDevice } from "@repo/contracts";
import type { PreviewEntity, PreviewPersona } from "@repo/storefront-sections";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { sectionsOfTemplate, type EditorTemplateId } from "./editor-theme-ops";
import { useEditorActions } from "./use-editor-actions";
import { useEditorChannel, type SaveState } from "./use-editor-channel";
import { useEditorClipboard } from "./use-editor-clipboard";
import { useEditorMutations } from "./use-editor-mutations";
import { useEditorShortcuts } from "./use-editor-shortcuts";

const HISTORY_CAP = 50;

export type { EditorTemplateId, SaveState };
export { sectionsOfTemplate };
export type EditorController = ReturnType<typeof useEditorState>;

/** Editor state: draft clone, undo/redo stack, preview channel, section clipboard, shortcuts. */
export function useEditorState(theme: Theme) {
  const mt = useMsgToast();
  const strictT = useMsg();
  const t = React.useMemo(() => strictT as unknown as (key: string) => string, [strictT]);
  const { locale } = useAppLocale();

  const [draft, setDraft] = React.useState<Theme>(() => structuredClone(theme));
  const draftRef = React.useRef(draft);
  const setDraftSync = React.useCallback((next: Theme) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  const [selectedTemplate, setSelectedTemplateState] = React.useState<EditorTemplateId>("home");
  const templateRef = React.useRef<EditorTemplateId>(selectedTemplate);
  const [selectedSectionId, setSelectedSectionId] = React.useState<string | null>(null);
  const selectedSectionIdRef = React.useRef<string | null>(null);
  const [device, setDeviceState] = React.useState<ThemeDevice>("desktop");
  const deviceRef = React.useRef<ThemeDevice>(device);
  const [previewEntity, setPreviewEntityState] = React.useState<PreviewEntity | null>(null);
  const previewEntityRef = React.useRef<PreviewEntity | null>(null);
  const [persona, setPersonaState] = React.useState<PreviewPersona>("guest");
  const personaRef = React.useRef<PreviewPersona>(persona);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const savedRef = React.useRef<Theme>(draft);

  /* ---- local history (undo/redo, capped at 50) ---- */
  const pastRef = React.useRef<Theme[]>([]);
  const futureRef = React.useRef<Theme[]>([]);
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);
  const syncHist = React.useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  /** Clone → push history → update draft (autosave + broadcast follow via channel effects). */
  const apply = React.useCallback(
    (fn: (d: Theme) => Theme) => {
      pastRef.current = [...pastRef.current.slice(-(HISTORY_CAP - 1)), draftRef.current];
      futureRef.current = [];
      setDraftSync(fn(structuredClone(draftRef.current)));
      syncHist();
    },
    [setDraftSync, syncHist],
  );
  const undo = React.useCallback(() => {
    const prev = pastRef.current[pastRef.current.length - 1];
    if (!prev) return;
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [draftRef.current, ...futureRef.current];
    setDraftSync(prev);
    syncHist();
  }, [setDraftSync, syncHist]);
  const redo = React.useCallback(() => {
    const [next, ...rest] = futureRef.current;
    if (!next) return;
    futureRef.current = rest;
    pastRef.current = [...pastRef.current, draftRef.current];
    setDraftSync(next);
    syncHist();
  }, [setDraftSync, syncHist]);

  /* ---- preview channel (post needed by the setters below) ---- */
  const selectSectionRef = React.useRef<(id: string | null) => void>(() => {});
  const onSectionClick = React.useCallback((id: string | null) => selectSectionRef.current(id), []);
  const channel = useEditorChannel({
    draftRef,
    savedRef,
    templateRef,
    deviceRef,
    previewEntityRef,
    personaRef,
    draft,
    selectedTemplate,
    setSaveState,
    selectSection: onSectionClick,
    mt,
  });
  const { post } = channel;

  const selectSection = React.useCallback(
    (id: string | null) => {
      selectedSectionIdRef.current = id;
      setSelectedSectionId(id);
      post({ type: "section:select", sectionId: id });
    },
    [post],
  );
  selectSectionRef.current = selectSection;
  const selectTemplate = React.useCallback(
    (tpl: EditorTemplateId) => {
      templateRef.current = tpl;
      setSelectedTemplateState(tpl);
      selectSection(null);
    },
    [selectSection],
  );
  const setDevice = React.useCallback(
    (d: ThemeDevice) => {
      deviceRef.current = d;
      setDeviceState(d);
      post({ type: "device:update", device: d });
    },
    [post],
  );
  const setPreviewEntity = React.useCallback(
    (entity: PreviewEntity | null) => {
      previewEntityRef.current = entity;
      setPreviewEntityState(entity);
      post({ type: "entity:select", entity });
    },
    [post],
  );
  const setPersona = React.useCallback(
    (p: PreviewPersona) => {
      personaRef.current = p;
      setPersonaState(p);
      post({ type: "persona", value: p });
    },
    [post],
  );

  /* ---- section/globals mutations · clipboard · shortcuts · server actions ---- */
  const mutations = useEditorMutations({ draftRef, templateRef, selectedSectionIdRef, apply, selectSection, mt, t, locale });
  const clipboard = useEditorClipboard({ draftRef, templateRef, apply, selectSection, mt, t });
  useEditorShortcuts({
    undo,
    redo,
    selectedSectionIdRef,
    selectSection,
    removeSection: mutations.removeSection,
    duplicateSection: clipboard.duplicateSection,
    copySection: clipboard.copySection,
    cutSection: clipboard.cutSection,
    pasteSection: clipboard.pasteSection,
  });
  const actions = useEditorActions({
    draftRef,
    savedRef,
    setDraftSync,
    setSaveState,
    apply,
    selectTemplate,
    templateRef,
    mt,
    locale,
  });

  return {
    draft,
    selectedTemplate,
    selectedSectionId,
    selectedSection: sectionsOfTemplate(draft, selectedTemplate).find((s) => s.id === selectedSectionId) ?? null,
    saveState,
    canUndo,
    canRedo,
    device,
    previewEntity,
    persona,
    selectTemplate,
    selectSection,
    setDevice,
    setPreviewEntity,
    setPersona,
    undo,
    redo,
    ...mutations,
    ...clipboard,
    ...channel,
    ...actions,
  };
}
