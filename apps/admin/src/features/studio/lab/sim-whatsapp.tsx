"use client";

import { CheckCheck, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar } from "../agent-meta";
import {
  AgentTag,
  Composer,
  ErrorBubble,
  type Props,
  Suggestions,
  time,
  Typing,
  useAutoScroll,
} from "./sim-shared";

export function WhatsApp(p: Props) {
  const t = useTranslations("studio.lab");
  const ref = useAutoScroll(p.turns.length + Number(p.pending));
  const lastAgent = [...p.turns].reverse().find((x) => x.agentId)?.agentId;
  const current = lastAgent ? p.index.byId.get(lastAgent) : p.index.roots[0];
  return (
    <div className="bg-wa-bg flex h-[620px] flex-col overflow-hidden rounded-2xl border">
      <div className="bg-wa-header text-paper flex items-center gap-3 px-4 py-3">
        {current ? <AgentAvatar agent={current} className="!bg-paper/90 rounded-full" /> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{t("storeName")}</p>
          <p className="text-paper/80 truncate text-xs">
            {p.pending
              ? t("typing")
              : current
                ? t("servedBy", { name: current.name })
                : t("online")}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-paper hover:bg-paper/10 hover:text-paper"
          onClick={p.onReset}
          aria-label={t("reset")}
        >
          <RotateCcw aria-hidden />
        </Button>
      </div>
      <div
        ref={ref}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-4"
        style={{
          backgroundImage: "radial-gradient(hsl(var(--foreground) / 0.05) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <p className="bg-wa-notice text-wa-muted dark:bg-wa-input dark:text-wa-muted mx-auto w-fit rounded-md px-3 py-1 text-center text-[11px]">
          {t("waNotice")}
        </p>
        {p.turns.map((m) =>
          m.from === "customer" ? (
            <div key={m.id} className="flex justify-end">
              <div className="bg-wa-bubble-out text-wa-text dark:bg-wa-bubble-out dark:text-wa-text max-w-[80%] rounded-lg rounded-se-none px-2.5 py-1.5 text-sm shadow-sm">
                <p dir="auto" className="whitespace-pre-wrap">
                  {m.text}
                </p>
                <p className="mt-0.5 flex items-center justify-end gap-1 text-[10px] opacity-60">
                  <span className="num">{time(m.at)}</span>
                  <CheckCheck className="text-wa-tick size-3.5" aria-hidden />
                </p>
              </div>
            </div>
          ) : m.from === "error" ? (
            <ErrorBubble key={m.id} onRetry={p.onRetry} />
          ) : (
            <button
              key={m.id}
              type="button"
              onClick={() => p.onSelect(m.id)}
              className={cn(
                "bg-paper text-wa-text dark:text-wa-text block max-w-[80%] rounded-lg rounded-ss-none px-2.5 py-1.5 text-start text-sm shadow-sm transition-shadow",
                p.selected === m.id && "ring-primary ring-2",
              )}
            >
              <AgentTag index={p.index} id={m.agentId} className="mb-0.5" />
              <p dir="auto" className="whitespace-pre-wrap">
                {m.text}
              </p>
              <p className="num mt-0.5 text-end text-[10px] opacity-60">{time(m.at)}</p>
            </button>
          ),
        )}
        {p.pending ? (
          <div className="bg-paper text-wa-muted w-fit rounded-lg rounded-ss-none px-3 py-2.5 shadow-sm">
            <Typing />
          </div>
        ) : null}
      </div>
      <div className="bg-wa-composer space-y-2 p-2.5">
        {p.turns.length === 0 ? (
          <Suggestions items={p.suggestions} onPick={p.onSend} disabled={p.pending} />
        ) : null}
        <Composer
          onSend={p.onSend}
          disabled={p.pending}
          placeholder={t("placeholderWa")}
          tone="wa"
        />
      </div>
    </div>
  );
}
