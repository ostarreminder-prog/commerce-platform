"use client";

import * as React from "react";

interface ShortcutDeps {
  undo: () => void;
  redo: () => void;
  selectedSectionIdRef: React.MutableRefObject<string | null>;
  selectSection: (id: string | null) => void;
  removeSection: (id: string) => void;
  duplicateSection: (id: string) => void;
  copySection: (id: string) => void;
  cutSection: (id: string) => void;
  pasteSection: () => void;
}

const isEditableTarget = (e: KeyboardEvent) =>
  Boolean((e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable='true']"));

/**
 * Editor keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z redo,
 * Delete/Backspace remove, Ctrl/Cmd+D duplicate, Ctrl/Cmd+C/X copy/cut,
 * Ctrl/Cmd+V paste, Esc deselect. Skipped while typing in form fields.
 */
export function useEditorShortcuts(deps: ShortcutDeps) {
  const depsRef = React.useRef(deps);
  React.useEffect(() => {
    depsRef.current = deps;
  });
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e)) return;
      const d = depsRef.current;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      const sel = d.selectedSectionIdRef.current;
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) d.redo();
        else d.undo();
      } else if (mod && key === "d" && sel) {
        e.preventDefault();
        d.duplicateSection(sel);
      } else if (mod && key === "c" && sel) {
        e.preventDefault();
        d.copySection(sel);
      } else if (mod && key === "x" && sel) {
        e.preventDefault();
        d.cutSection(sel);
      } else if (mod && key === "v") {
        e.preventDefault();
        d.pasteSection();
      } else if ((e.key === "Delete" || e.key === "Backspace") && sel) {
        e.preventDefault();
        d.removeSection(sel);
      } else if (e.key === "Escape") {
        d.selectSection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
