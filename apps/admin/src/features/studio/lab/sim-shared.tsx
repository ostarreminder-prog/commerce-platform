"use client";

import * as React from "react";
import { Mic, SendHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AgentChannel, SimulatedTurn } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar } from "../agent-meta";
import type { TreeIndex } from "../tree";

export interface ChatTurn {
  id: string;
  from: "customer" | "agent" | "error";
  text: string;
  agentId?: string;
  turn?: SimulatedTurn;
  at: Date;
}

export interface Props {
  channel: AgentChannel;
  turns: ChatTurn[];
  pending: boolean;
  index: TreeIndex;
  selected: string | null;
  onSelect: (id: string) => void;
  onSend: (text: string) => void;
  onRetry: () => void;
  onReset: () => void;
  suggestions: string[];
}

export const time = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export function useAutoScroll(dep: unknown) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [dep]);
  return ref;
}

export function Composer({
  onSend,
  disabled,
  placeholder,
  tone,
}: {
  onSend: (t: string) => void;
  disabled?: boolean;
  placeholder: string;
  tone: "wa" | "web" | "voice";
}) {
  const t = useTranslations("studio.lab");
  const [text, setText] = React.useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
  };
  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        dir="auto"
        className={cn(
          tone === "wa" && "bg-paper dark:bg-wa-input rounded-full border-0",
          tone === "voice" && "border-paper/20 bg-paper/10 text-paper placeholder:text-paper/50",
        )}
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled || !text.trim()}
        aria-label={t("send")}
        className={cn(
          "shrink-0",
          tone === "wa" && "bg-wa-accent hover:bg-wa-accent-strong rounded-full",
          tone === "voice" && "bg-paper/15 hover:bg-paper/25",
        )}
      >
        {tone === "voice" ? (
          <Mic aria-hidden />
        ) : (
          <SendHorizontal className="rtl:-scale-x-100" aria-hidden />
        )}
      </Button>
    </form>
  );
}

export function Suggestions({
  items,
  onPick,
  disabled,
  dark,
}: {
  items: string[];
  onPick: (s: string) => void;
  disabled: boolean;
  dark?: boolean;
}) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          disabled={disabled}
          onClick={() => onPick(s)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50",
            dark
              ? "border-paper/20 text-paper/80 hover:bg-paper/10"
              : "bg-background hover:bg-muted",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export function Typing({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-current"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

export function AgentTag({
  index,
  id,
  className,
}: {
  index: TreeIndex;
  id?: string;
  className?: string;
}) {
  const agent = id ? index.byId.get(id) : undefined;
  if (!agent) return null;
  return (
    <span
      className={cn("flex items-center gap-1 text-[11px] font-semibold", className)}
      style={{ color: `hsl(${agent.avatar.hue} 55% 38%)` }}
    >
      <AgentAvatar agent={agent} size="sm" className="size-4 rounded-full [&_svg]:size-2.5" />
      {agent.name}
    </span>
  );
}

export function ErrorBubble({ onRetry, dark }: { onRetry: () => void; dark?: boolean }) {
  const t = useTranslations("studio.lab");
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-2 rounded-lg border px-3 py-2 text-xs",
        dark
          ? "border-destructive/40 text-destructive"
          : "border-destructive/30 bg-destructive/5 text-destructive",
      )}
    >
      {t("simError")}
      <button type="button" className="font-semibold underline" onClick={onRetry}>
        {t("retry")}
      </button>
    </div>
  );
}
