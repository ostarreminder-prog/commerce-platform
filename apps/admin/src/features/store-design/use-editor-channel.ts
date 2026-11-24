"use client";

import * as React from "react";
import { useUpdateTheme } from "@repo/api-client";
import type { Theme, ThemeDevice, ThemeVersion } from "@repo/contracts";
import type { PreviewEntity, PreviewPersona } from "@repo/storefront-sections";
import type { useMsgToast } from "@repo/ui/components/msg-toast";
import { isPreviewToEditorMessage, PREVIEW_ORIGIN, type EditorToPreviewMessage } from "./editor-messages";

export const AUTOSAVE_MS = 5_000;
export type SaveState = "idle" | "dirty" | "saving" | "saved";

interface ChannelDeps {
  draftRef: React.MutableRefObject<Theme>;
  savedRef: React.MutableRefObject<Theme>;
  templateRef: React.MutableRefObject<string>;
  deviceRef: React.MutableRefObject<ThemeDevice>;
  previewEntityRef: React.MutableRefObject<PreviewEntity | null>;
  personaRef: React.MutableRefObject<PreviewPersona>;
  /** Latest draft + template values — drives the broadcast + autosave effects. */
  draft: Theme;
  selectedTemplate: string;
  setSaveState: (s: SaveState) => void;
  selectSection: (id: string | null) => void;
  mt: ReturnType<typeof useMsgToast>;
}

/**
 * Editor ↔ preview channel + autosave. Posts `theme:update` on every change,
 * answers `preview:ready`, selects sections on `section:click`, debounce-saves
 * the draft, and supports previewing a version snapshot (`previewOnly`).
 */
export function useEditorChannel({
  draftRef,
  savedRef,
  templateRef,
  deviceRef,
  previewEntityRef,
  personaRef,
  draft,
  selectedTemplate,
  setSaveState,
  selectSection,
  mt,
}: ChannelDeps) {
  const previewRef = React.useRef<Window | null>(null);
  const [versionPreview, setVersionPreview] = React.useState<ThemeVersion | null>(null);
  const versionPreviewRef = React.useRef<ThemeVersion | null>(null);
  /* Preview health — `preview:ready` is the only trustworthy "loaded" signal;
   * if it never arrives (storefront down / blocked) we surface a retry overlay. */
  const [previewFailed, setPreviewFailed] = React.useState(false);
  const [frameKey, setFrameKey] = React.useState(0);
  const readyRef = React.useRef(false);
  const failTimerRef = React.useRef<number | undefined>(undefined);

  const post = React.useCallback((msg: EditorToPreviewMessage) => {
    previewRef.current?.postMessage(msg, PREVIEW_ORIGIN);
  }, []);
  const postTheme = React.useCallback(
    () =>
      post({
        type: "theme:update",
        theme: draftRef.current,
        template: templateRef.current,
        device: deviceRef.current,
        previewEntity: previewEntityRef.current,
        previewPersona: personaRef.current,
      }),
    [post, draftRef, templateRef, deviceRef, previewEntityRef, personaRef],
  );
  const postVersion = React.useCallback(
    (v: ThemeVersion) => {
      if (!v.snapshot) return;
      post({
        type: "theme:update",
        theme: v.snapshot,
        template: templateRef.current,
        device: deviceRef.current,
        previewEntity: previewEntityRef.current,
        previewPersona: personaRef.current,
        previewOnly: true,
      });
    },
    [post, templateRef, deviceRef, previewEntityRef, personaRef],
  );
  const bindPreview = React.useCallback(
    (win: Window | null) => {
      previewRef.current = win;
      if (!win) return;
      readyRef.current = false;
      setPreviewFailed(false);
      window.clearTimeout(failTimerRef.current);
      failTimerRef.current = window.setTimeout(() => {
        if (!readyRef.current) setPreviewFailed(true);
      }, 10_000);
      if (versionPreviewRef.current) postVersion(versionPreviewRef.current);
      else postTheme();
    },
    [postTheme, postVersion],
  );
  /** Remount the iframe (key bump) and re-arm the ready timer. */
  const retryPreview = React.useCallback(() => {
    readyRef.current = false;
    setPreviewFailed(false);
    setFrameKey((k) => k + 1);
  }, []);

  /* ---- version snapshot preview (banner lives in the preview column) ---- */
  const startVersionPreview = React.useCallback(
    (v: ThemeVersion) => {
      if (!v.snapshot) return;
      versionPreviewRef.current = v;
      setVersionPreview(v);
      postVersion(v);
    },
    [postVersion],
  );
  const exitVersionPreview = React.useCallback(() => {
    versionPreviewRef.current = null;
    setVersionPreview(null);
    postTheme();
  }, [postTheme]);

  /* ---- debounced autosave ---- */
  const updateTheme = useUpdateTheme();
  const updateThemeRef = React.useRef(updateTheme);
  const mtRef = React.useRef(mt);
  React.useEffect(() => {
    updateThemeRef.current = updateTheme;
    mtRef.current = mt;
  });
  React.useEffect(() => {
    if (draft === savedRef.current) return;
    setSaveState("dirty");
    const id = window.setTimeout(() => {
      setSaveState("saving");
      updateThemeRef.current.mutate(
        [draft.id, { sections: draft.sections, globals: draft.globals, colorSchemes: draft.colorSchemes, presets: draft.presets, customTemplates: draft.customTemplates, pageExperiences: draft.pageExperiences, versions: draft.versions, features: draft.features, featureSettings: draft.featureSettings }],
        {
          onSuccess: () => {
            savedRef.current = draft;
            setSaveState("saved");
          },
          onError: () => {
            setSaveState("dirty");
            mtRef.current.error("common.save.error");
          },
        },
      );
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(id);
  }, [draft, savedRef, setSaveState]);

  /* ---- broadcast every state change to the preview (skipped during version preview) ---- */
  React.useEffect(() => {
    if (!versionPreviewRef.current) postTheme();
  }, [draft, selectedTemplate, postTheme]);

  /* ---- listen for preview → editor messages ---- */
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== PREVIEW_ORIGIN || !isPreviewToEditorMessage(event.data)) return;
      if (event.data.type === "preview:ready") {
        readyRef.current = true;
        setPreviewFailed(false);
        window.clearTimeout(failTimerRef.current);
        if (versionPreviewRef.current) postVersion(versionPreviewRef.current);
        else postTheme();
      } else if (event.data.type === "section:click") selectSection(event.data.sectionId);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postTheme, postVersion, selectSection]);

  return { post, postTheme, bindPreview, versionPreview, startVersionPreview, exitVersionPreview, previewFailed, previewFrameKey: frameKey, retryPreview };
}
