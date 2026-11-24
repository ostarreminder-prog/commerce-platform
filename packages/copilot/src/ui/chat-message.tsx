"use client";

import * as React from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import type { ResponseLink } from "../types";
import { Button } from "@repo/ui/components/button";
import { useMsg } from "@repo/ui/hooks/use-msg";
import { cn } from "@repo/ui/lib/cn";
import { ActionCard } from "./action-card";
import { ClarifyCard } from "./clarify-card";
import { DangerActionCard } from "./danger-action-card";
import { PlanCard } from "./plan-card";
import { ResponseChart } from "./response-chart";
import { ResponseTable } from "./response-table";
import { defaultLinkRenderer, useCopilotView, type CopilotChatMessage, type CopilotLinkRenderer, type CopilotRefLike } from "./view-context";

const useMsgT = () => {
  const strictT = useMsg();
  return strictT as unknown as (key: string) => string;
};

/** Renders one entity-ref chip on a user bubble — apps can inject EntityLink. */
export type RefRenderer = (ref: CopilotRefLike) => React.ReactNode;

const defaultRefRenderer: RefRenderer = (ref) => <span>{ref.label}</span>;

export interface CopilotMessageRenderers {
  renderLink?: CopilotLinkRenderer;
  renderRef?: RefRenderer;
}

function LinkChips({ links, renderLink }: { links: ResponseLink[]; renderLink: CopilotLinkRenderer }) {
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {links.map((l) => (
        <React.Fragment key={l.href + l.label}>
          {renderLink({
            href: l.href,
            className: "bg-muted hover:bg-accent text-primary rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            children: l.label,
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

function AssistantBody({ message, renderLink }: { message: CopilotChatMessage; renderLink: CopilotLinkRenderer }) {
  const t = useMsgT();
  const copilot = useCopilotView();
  const r = message.response;
  if (!r) return message.text ? <p className="text-sm">{message.text}</p> : null;

  switch (r.kind) {
    case "text":
      return (
        <div className="space-y-2">
          <p className="text-sm leading-6">{r.text}</p>
          {r.table ? <ResponseTable title={r.table.title} columns={r.table.columns} rows={r.table.rows} /> : null}
          {r.links ? <LinkChips links={r.links} renderLink={renderLink} /> : null}
        </div>
      );
    case "table":
      return (
        <div className="space-y-2">
          <ResponseTable title={r.title} columns={r.columns} rows={r.rows} />
          {r.chart ? <ResponseChart title={r.chart.title} chartType={r.chart.chartType} series={r.chart.series} /> : null}
        </div>
      );
    case "chart":
      return <ResponseChart title={r.title} chartType={r.chartType} series={r.series} />;
    case "action":
      return r.dangerLevel === "dangerous" ? (
        <DangerActionCard response={r} />
      ) : (
        <ActionCard response={r} />
      );
    case "plan":
      return <PlanCard messageId={message.id} response={r} />;
    case "clarify":
      return <ClarifyCard response={r} />;
    case "result":
      return (
        <div className="space-y-2">
          <p className="text-sm leading-6">{r.summary}</p>
          {r.links.length ? <LinkChips links={r.links} renderLink={renderLink} /> : null}
          {r.undoable ? (
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={copilot.undoResult}>
              <RotateCcw className="size-3.5" aria-hidden />
              {t("copilot.undo")}
            </Button>
          ) : null}
        </div>
      );
  }
}

/** One chat bubble — user messages show entity-ref chips; assistant dispatches by response kind. */
export function ChatMessageView({ message, renderLink, renderRef }: { message: CopilotChatMessage } & CopilotMessageRenderers) {
  const t = useMsgT();
  const link = renderLink ?? defaultLinkRenderer;
  const refChip = renderRef ?? defaultRefRenderer;
  if (message.role === "user") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {message.refs?.length ? (
          <div className="flex flex-wrap justify-end gap-1">
            {message.refs.map((ref) => (
              <span key={ref.id} className="bg-muted inline-flex items-center rounded-full px-2 py-0.5 text-xs">
                {refChip(ref)}
              </span>
            ))}
          </div>
        ) : null}
        <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-se-sm px-3.5 py-2 text-sm">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2">
      <span className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
        <Sparkles className="size-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <span className="sr-only">{t("copilot.title")}</span>
        <AssistantBody message={message} renderLink={link} />
      </div>
    </div>
  );
}

export function ThinkingBubble() {
  const t = useMsgT();
  return (
    <div className={cn("flex items-center gap-2")}>
      <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-full">
        <Sparkles className="size-3.5 animate-pulse" aria-hidden />
      </span>
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
        {t("copilot.thinking")}
        <span className="flex gap-0.5" aria-hidden>
          <span className="bg-muted-foreground/60 size-1 animate-bounce rounded-full" />
          <span className="bg-muted-foreground/60 size-1 animate-bounce rounded-full [animation-delay:150ms]" />
          <span className="bg-muted-foreground/60 size-1 animate-bounce rounded-full [animation-delay:300ms]" />
        </span>
      </span>
    </div>
  );
}
