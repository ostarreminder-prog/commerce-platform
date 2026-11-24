"use client";

import * as React from "react";
import { Mic, SendHorizonal, X } from "lucide-react";
import type { EntityType } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Popover, PopoverAnchor, PopoverContent } from "@repo/ui/components/popover";
import { Textarea } from "@repo/ui/components/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { useSpeechDictation } from "./speech";
import { useCopilotView, type CopilotRefLike } from "./view-context";

/** A picked entity mention — `token` is the literal text inserted into the composer. */
export interface CopilotComposerRef extends CopilotRefLike {
  token: string;
}

/** Props the per-app entity menu (admin: EntityRefMenu) receives from the composer. */
export interface CopilotEntityMenuProps {
  /** Fixed type from #/@ triggers; `null` while the `/` trigger picks a type. */
  type: EntityType | null;
  slashType: EntityType | null;
  query: string;
  onPickType: (type: EntityType) => void;
  onPick: (ref: CopilotComposerRef) => void;
}

interface TriggerState {
  /** "#" → order, "@" → customer, "/" → entity-type menu then items. */
  char: "#" | "@" | "/";
  /** Index in the text where the trigger char sits. */
  start: number;
  /** Text typed after the trigger char. */
  query: string;
}

const TRIGGER_TYPE: Record<"#" | "@", EntityType> = { "#": "order", "@": "customer" };

/** Finds a trigger token ending at the cursor: `#abc`, `@xyz`, `/…`. */
const findTrigger = (text: string, cursor: number): TriggerState | null => {
  const m = text.slice(0, cursor).match(/([#@/])([\p{L}\p{N}_-]*)$/u);
  if (!m) return null;
  return { char: m[1] as TriggerState["char"], start: cursor - m[0].length, query: m[2] ?? "" };
};

/**
 * Shared composer — textarea + send + speech stub. The entity-mention menu is
 * app-provided via `entityMenu` (admin injects the commerce-backed EntityRefMenu);
 * apps without an entity surface get a plain composer.
 */
export function CopilotInput({
  focusOnMount = false,
  entityMenu,
}: {
  focusOnMount?: boolean;
  entityMenu?: (props: CopilotEntityMenuProps) => React.ReactNode;
}) {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  const copilot = useCopilotView();
  const [text, setText] = React.useState("");
  const [refs, setRefs] = React.useState<CopilotComposerRef[]>([]);
  const [trigger, setTrigger] = React.useState<TriggerState | null>(null);
  const [slashType, setSlashType] = React.useState<EntityType | null>(null);
  const { listening, hasSpeech, toggle: toggleMic } = useSpeechDictation(
    React.useCallback((transcript: string) => setText((v) => (v ? `${v} ${transcript}` : transcript)), []),
  );
  const areaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (focusOnMount) areaRef.current?.focus();
  }, [focusOnMount]);

  /* "Edit" on an action card re-opens the request for refinement. */
  React.useEffect(() => {
    const onDraft = (e: Event) => {
      setText((e as CustomEvent<string>).detail);
      areaRef.current?.focus();
    };
    window.addEventListener("copilot:set-draft", onDraft);
    return () => window.removeEventListener("copilot:set-draft", onDraft);
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);
    const next = entityMenu ? findTrigger(value, e.target.selectionStart ?? value.length) : null;
    setTrigger(next);
    if (!next || next.char !== "/") setSlashType(null);
  };

  const closeMenu = () => {
    setTrigger(null);
    setSlashType(null);
  };

  const insertRef = (ref: CopilotComposerRef) => {
    const area = areaRef.current;
    const cursor = area?.selectionStart ?? text.length;
    const start = trigger?.start ?? cursor;
    const next = `${text.slice(0, start)}${ref.token} ${text.slice(cursor)}`;
    setText(next);
    setRefs((list) => [...list.filter((r) => r.id !== ref.id), ref]);
    closeMenu();
    requestAnimationFrame(() => {
      area?.focus();
      const pos = start + ref.token.length + 1;
      area?.setSelectionRange(pos, pos);
    });
  };

  const removeRef = (ref: CopilotComposerRef) => {
    setRefs((list) => list.filter((r) => r.id !== ref.id));
    setText((v) => v.replace(ref.token, "").replace(/\s{2,}/g, " "));
  };

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    copilot.send(value, refs.length ? refs : undefined);
    setText("");
    setRefs([]);
    closeMenu();
  };

  const mic = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-9", listening && "text-destructive animate-pulse")}
      disabled={!hasSpeech}
      aria-label={listening ? t("copilot.listening") : t("copilot.listen")}
      onClick={toggleMic}
    >
      <Mic className="size-4" aria-hidden />
    </Button>
  );

  return (
    <div className="space-y-1.5">
      {refs.length ? (
        <div className="flex flex-wrap gap-1">
          {refs.map((ref) => (
            <span key={ref.id} className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs">
              {ref.label}
              <button type="button" aria-label={ref.label} onClick={() => removeRef(ref)}>
                <X className="size-3" aria-hidden />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <Popover open={trigger !== null} onOpenChange={(v) => !v && closeMenu()}>
        <PopoverAnchor asChild>
          <div className="relative">
            <Textarea
              ref={areaRef}
              value={text}
              onChange={onChange}
              rows={2}
              placeholder={t("copilot.placeholder")}
              aria-label={t("copilot.title")}
              className="min-h-16 resize-none pe-20"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
                if (e.key === "Escape") closeMenu();
              }}
            />
            <div className="absolute bottom-2 end-2 flex items-center gap-1">
              {hasSpeech ? (
                mic
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{mic}</span>
                  </TooltipTrigger>
                  <TooltipContent>{t("copilot.micUnavailable")}</TooltipContent>
                </Tooltip>
              )}
              <Button
                type="button"
                size="icon"
                className="size-9"
                aria-label={t("copilot.send")}
                disabled={!text.trim() || copilot.thinking}
                onClick={submit}
              >
                <SendHorizonal className="size-4 rtl:-scale-x-100" aria-hidden />
              </Button>
            </div>
          </div>
        </PopoverAnchor>
        {trigger && entityMenu ? (
          <PopoverContent
            side="top"
            align="start"
            className="w-64 p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {entityMenu({
              type: trigger.char === "/" ? null : TRIGGER_TYPE[trigger.char],
              slashType,
              query: trigger.query,
              onPickType: setSlashType,
              onPick: insertRef,
            })}
          </PopoverContent>
        ) : null}
      </Popover>
      {listening ? <p className="text-destructive text-xs">{t("copilot.listening")}</p> : null}
    </div>
  );
}
