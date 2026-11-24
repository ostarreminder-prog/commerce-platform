"use client";

import Link from "@/components/store-link";
import { FlaskConical, Rocket, Save, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatRelativeTime } from "@repo/ui/lib/format";
import { type AgentAction, AgentActionsMenu } from "./agent-actions";
import { AgentBreadcrumb } from "./agent-breadcrumb";
import { AgentAvatar, AgentStatusBadge, ChannelIcons, WarningsIndicator } from "./agent-meta";
import { type AgentWarning, depthOf, type TreeIndex } from "./tree";

export function EditorHeader({
  draft,
  baseline,
  path,
  warnings,
  index,
  saved,
  onAction,
}: {
  draft: Agent;
  baseline: Agent;
  path: Agent[];
  warnings: AgentWarning[];
  index: TreeIndex;
  saved: Agent;
  onAction: (action: AgentAction, agent: Agent) => void;
}) {
  const t = useTranslations("studio.detail");
  const ts = useTranslations("studio");
  const { locale } = useAppLocale();
  return (
    <div className="space-y-4">
      <AgentBreadcrumb path={path} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <AgentAvatar agent={draft} size="lg" />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-bold sm:text-2xl">
                {draft.name || t("untitled")}
              </h1>
              <AgentStatusBadge status={draft.status} />
              <WarningsIndicator warnings={warnings} />
            </div>
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>{ts(`role.${draft.parentId ? "specialist" : "orchestrator"}`)}</span>
              <span aria-hidden>·</span>
              <span className="num">{t("level", { n: depthOf(index, draft.id) + 1 })}</span>
              <span aria-hidden>·</span> <span className="num">v{draft.version}</span>
              <span aria-hidden>·</span>
              <span>{t("updated", { when: formatRelativeTime(baseline.updatedAt, locale) })}</span>
              <ChannelIcons channels={draft.channels} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/agents/test?agent=${draft.id}`}>
              <FlaskConical aria-hidden /> {t("test")}
            </Link>
          </Button>
          <AgentActionsMenu agent={saved} onAction={onAction} />
        </div>
      </div>
    </div>
  );
}

export function EditorFooter({
  draft,
  dirty,
  unpublished,
  valid,
  saving,
  onDiscard,
  onSave,
  onPublish,
}: {
  draft: Agent;
  dirty: boolean;
  unpublished: boolean;
  valid: boolean;
  saving: boolean;
  onDiscard: () => void;
  onSave: () => void;
  onPublish: () => void;
}) {
  const t = useTranslations("studio.detail");
  return (
    <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur lg:start-64">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              dirty ? "bg-warning animate-pulse" : unpublished ? "bg-info" : "bg-success",
            )}
            aria-hidden
          />
          <span className="truncate font-medium">
            {dirty
              ? t("footer.dirty")
              : unpublished
                ? t("footer.unpublished")
                : t("footer.clean", { v: draft.version })}
          </span>
        </div>
        {dirty ? (
          <Button variant="ghost" onClick={onDiscard}>
            <Undo2 aria-hidden />
            <span className="hidden sm:inline">{t("footer.discard")}</span>
          </Button>
        ) : null}
        <Button variant="outline" disabled={!dirty || !valid} loading={saving} onClick={onSave}>
          <Save aria-hidden /> {t("footer.save")}
        </Button>
        <Button variant="outline" asChild className="hidden sm:inline-flex">
          <Link href={`/agents/test?agent=${draft.id}`}>
            <FlaskConical aria-hidden /> {t("test")}
          </Link>
        </Button>
        <Button disabled={!valid || (!dirty && !unpublished)} onClick={onPublish}>
          <Rocket aria-hidden /> {t("footer.publish")}
        </Button>
      </div>
    </div>
  );
}
