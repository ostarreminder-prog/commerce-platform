"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";

/**
 * Unsaved-changes guard for editor screens (product editor, collection detail…).
 * While `dirty`:
 *  - `beforeunload` warns on tab close / hard reload.
 *  - clicks on internal `<a href>` are intercepted and confirmed via a
 *    ConfirmDialog; on confirm the pending navigation resumes.
 * Render the returned element next to the editor — it stays null until needed.
 */
export function useUnsavedGuard(dirty: boolean) {
  const router = useRouter();
  const [pendingHref, setPendingHref] = React.useState<string | null>(null);
  const dirtyRef = React.useRef(dirty);
  dirtyRef.current = dirty;

  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    /* Capture phase so we win over inner onClick handlers (EntityLink etc.). */
    const onClick = (e: MouseEvent) => {
      if (!dirtyRef.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
      if (!a || a.getAttribute("target") === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") ?? "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      if (href === `${window.location.pathname}${window.location.search}`) return;
      e.preventDefault();
      e.stopPropagation();
      setPendingHref(href);
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  return (
    <ConfirmDialog
      open={pendingHref !== null}
      onOpenChange={(v) => !v && setPendingHref(null)}
      titleKey="common.unsaved.title"
      bodyKey="common.unsaved.body"
      confirmKey="common.unsaved.confirm"
      onConfirm={() => {
        const href = pendingHref;
        setPendingHref(null);
        if (href) router.push(href);
      }}
    />
  );
}
