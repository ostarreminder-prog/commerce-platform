"use client";

import * as React from "react";
import { usePublishTheme, useScheduleTheme } from "@repo/api-client";
import type { Theme, ThemeSection } from "@repo/contracts";
import { uid } from "@repo/storefront-sections/editor";
import type { useMsgToast } from "@repo/ui/components/msg-toast";
import { formatDateTime, type Locale } from "@repo/ui/lib/format";
import type { SaveState } from "./use-editor-state";

type ApplyFn = (fn: (d: Theme) => Theme) => void;
type MutRef<T> = React.MutableRefObject<T>;

interface ActionDeps {
  draftRef: MutRef<Theme>;
  savedRef: MutRef<Theme>;
  setDraftSync: (theme: Theme) => void;
  setSaveState: (state: SaveState) => void;
  apply: ApplyFn;
  selectTemplate: (tpl: string) => void;
  templateRef: MutRef<string>;
  mt: ReturnType<typeof useMsgToast>;
  locale: Locale;
}

/** Server-side editor actions: publish, scheduled publish, custom landing templates. */
export function useEditorActions({ draftRef, savedRef, setDraftSync, setSaveState, apply, selectTemplate, templateRef, mt, locale }: ActionDeps) {
  /* ---- custom templates (landing pages) ---- */
  const addCustomTemplate = React.useCallback(
    (nameAr: string, nameEn: string) => {
      const tpl = { id: uid("ct"), nameAr, nameEn, sections: [] as ThemeSection[] };
      apply((d) => ({ ...d, customTemplates: [...(d.customTemplates ?? []), tpl] }));
      selectTemplate(tpl.id);
    },
    [apply, selectTemplate],
  );
  const removeCustomTemplate = React.useCallback(
    (id: string) => {
      apply((d) => ({ ...d, customTemplates: (d.customTemplates ?? []).filter((c) => c.id !== id) }));
      if (templateRef.current === id) selectTemplate("home");
    },
    [apply, selectTemplate, templateRef],
  );

  /* ---- publish ---- */
  const publishTheme = usePublishTheme();
  const publish = React.useCallback(() => {
    publishTheme.mutate([draftRef.current.id], {
      onSuccess: (updated) => {
        const next = structuredClone(updated);
        savedRef.current = next;
        setDraftSync(next);
        setSaveState("saved");
        /* A future schedule wins over an immediate publish — the theme stays scheduled. */
        const pendingAt = updated.scheduledPublish?.at;
        if (pendingAt && +new Date(pendingAt) > Date.now() && updated.status !== "published") {
          mt.success("editor.scheduleSaved", { date: formatDateTime(pendingAt, locale) });
        } else {
          mt.success("editor.published");
        }
      },
      onError: () => mt.error("common.server.error"),
    });
  }, [publishTheme, draftRef, savedRef, setDraftSync, setSaveState, mt, locale]);

  /* ---- scheduled publish ---- */
  const scheduleTheme = useScheduleTheme();
  const schedule = React.useCallback(
    (at: string | null) => {
      scheduleTheme.mutate([draftRef.current.id, at], {
        onSuccess: (updated) => {
          const next = structuredClone(updated);
          savedRef.current = next;
          setDraftSync(next);
          if (at) mt.success("editor.scheduleSaved", { date: formatDateTime(at, locale) });
          else mt.success("editor.scheduleCleared");
        },
        onError: () => mt.error("common.save.error"),
      });
    },
    [scheduleTheme, draftRef, savedRef, setDraftSync, mt, locale],
  );

  return {
    addCustomTemplate,
    removeCustomTemplate,
    publish,
    publishing: publishTheme.isPending,
    schedule,
    scheduling: scheduleTheme.isPending,
  };
}
