"use client";

import { Bot, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar } from "../agent-meta";
import type { TreeIndex } from "../tree";
import {
  AgentTag,
  Composer,
  ErrorBubble,
  type Props,
  Suggestions,
  Typing,
  useAutoScroll,
} from "./sim-shared";

function WebAvatar({ index, id }: { index: TreeIndex; id?: string }) {
  const agent = id ? index.byId.get(id) : undefined;
  return agent ? <AgentAvatar agent={agent} size="sm" className="rounded-full" /> : null;
}

export function WebChat(p: Props) {
  const t = useTranslations("studio.lab");
  const ref = useAutoScroll(p.turns.length + Number(p.pending));
  return (
    <div className="bg-card flex h-[620px] flex-col overflow-hidden rounded-2xl border shadow-sm">
      <div className="bg-primary text-primary-foreground flex items-center gap-3 px-4 py-3">
        <span className="bg-paper/15 flex size-9 items-center justify-center rounded-full">
          <Bot className="size-5" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-semibold">{t("webTitle")}</p>
          <p className="flex items-center gap-1.5 text-xs opacity-80">
            <span className="bg-success/50 size-1.5 rounded-full" aria-hidden />
            {t("webSubtitle")}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="hover:text-primary-foreground hover:bg-paper/10"
          onClick={p.onReset}
          aria-label={t("reset")}
        >
          <RotateCcw aria-hidden />
        </Button>
      </div>
      <div ref={ref} className="bg-muted/30 flex-1 space-y-3 overflow-y-auto p-4">
        {p.turns.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center text-sm">
            <p className="text-foreground mb-1 text-base font-semibold">{t("webHello")}</p>
            {t("webHelloBody")}
          </div>
        ) : null}
        {p.turns.map((m) =>
          m.from === "customer" ? (
            <div key={m.id} className="flex justify-end">
              <p
                dir="auto"
                className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-ee-sm px-3.5 py-2 text-sm"
              >
                {m.text}
              </p>
            </div>
          ) : m.from === "error" ? (
            <ErrorBubble key={m.id} onRetry={p.onRetry} />
          ) : (
            <div key={m.id} className="flex items-end gap-2">
              <WebAvatar index={p.index} id={m.agentId} />
              <button
                type="button"
                onClick={() => p.onSelect(m.id)}
                className={cn(
                  "bg-background max-w-[80%] rounded-2xl rounded-es-sm border px-3.5 py-2 text-start text-sm shadow-sm",
                  p.selected === m.id && "ring-primary ring-2",
                )}
              >
                <AgentTag index={p.index} id={m.agentId} className="mb-1" />
                <span dir="auto" className="block">
                  {m.text}
                </span>
              </button>
            </div>
          ),
        )}
        {p.pending ? (
          <div className="bg-background text-muted-foreground w-fit rounded-2xl border px-3.5 py-3">
            <Typing />
          </div>
        ) : null}
      </div>
      <div className="space-y-2 border-t p-3">
        {p.turns.length === 0 ? (
          <Suggestions items={p.suggestions} onPick={p.onSend} disabled={p.pending} />
        ) : null}
        <Composer
          onSend={p.onSend}
          disabled={p.pending}
          placeholder={t("placeholderWeb")}
          tone="web"
        />
      </div>
    </div>
  );
}
