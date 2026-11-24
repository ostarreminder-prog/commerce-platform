"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { useCopilotView } from "./view-context";

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement &&
  (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);

/** Cmd/Ctrl+J toggles the panel — skipped while typing in inputs. */
export function useCopilotHotkey(toggle: () => void) {
  const ref = React.useRef(toggle);
  React.useEffect(() => {
    ref.current = toggle;
  });
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j" && !isEditable(e.target)) {
        e.preventDefault();
        ref.current();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

/** Topbar toggle — sparkles button with a pending-action badge. */
export function CopilotToggle() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const { setOpen, pendingCount } = useCopilotView();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label={t("copilot.open")}
      onClick={() => setOpen((v) => !v)}
    >
      <Sparkles className="size-4" aria-hidden />
      {pendingCount > 0 ? (
        <span className="bg-primary text-primary-foreground num absolute -top-0.5 -end-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
          {pendingCount}
        </span>
      ) : null}
    </Button>
  );
}
