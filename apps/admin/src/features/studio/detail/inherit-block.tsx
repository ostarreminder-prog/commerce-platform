"use client";

import * as React from "react";
import Link from "@/components/store-link";
import { ArrowUpRight, Link2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent, InheritableSection } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar } from "../agent-meta";
import { ancestry, inheritanceSource } from "../tree";
import { ConfirmDialog } from "./confirm-dialog";
import type { TabProps } from "./types";

const copySection: Record<InheritableSection, (to: Agent, from: Agent) => Agent> = {
  persona: (to, from) => ({ ...to, persona: structuredClone(from.persona) }),
  knowledge: (to, from) => ({ ...to, knowledgeSourceIds: [...from.knowledgeSourceIds] }),
  tools: (to, from) => ({ ...to, tools: structuredClone(from.tools) }),
  workingHours: (to, from) => ({ ...to, workingHours: structuredClone(from.workingHours) }),
};

/** * Wraps an inheritable section. While inheriting, children render the ancestor's * values read-only and the banner names where they come from. */
export function InheritBlock({
  section,
  draft,
  patch,
  index,
  readOnly,
  tab,
  children,
}: Omit<TabProps, "agents"> & {
  section: InheritableSection;
  tab: string;
  children: (source: Agent, locked: boolean) => React.ReactNode;
}) {
  const t = useTranslations("studio.detail.inherit");
  const [confirmReset, setConfirmReset] = React.useState(false);
  const parent = draft.parentId ? index.byId.get(draft.parentId) : undefined;
  if (!parent) return <>{children(draft, readOnly)}</>;
  const inheriting = draft.inheritFromParent[section];
  const source = inheriting ? inheritanceSource(index, { ...draft }, section) : draft;
  const via = inheriting ? ancestry(index, parent.id).slice(ancestry(index, source.id).length) : [];
  const setInherit = (value: boolean) =>
    patch((a) => {
      const next = { ...a, inheritFromParent: { ...a.inheritFromParent, [section]: value } };
      return value ? next : copySection[section](next, source);
    });
  return (
    <div
      className={cn(
        "rounded-xl border-s-4 ps-3 sm:ps-4",
        inheriting ? "border-info/60" : "border-primary/50",
      )}
    >
      <div
        className={cn(
          "mb-3 flex flex-col gap-3 rounded-lg p-3 sm:flex-row sm:items-center",
          inheriting ? "bg-info/5" : "bg-primary/5",
        )}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {inheriting ? (
            <AgentAvatar agent={source} size="sm" />
          ) : (
            <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
              <Unlink className="size-4" aria-hidden />
            </span>
          )}
          <div className="min-w-0 text-sm">
            {inheriting ? (
              <>
                <p className="font-medium">
                  {t("inheritedFrom")}
                  <Link
                    href={`/agents/${source.id}?tab=${tab}`}
                    className="text-info inline-flex items-center gap-0.5 hover:underline"
                  >
                    {source.name}
                    <ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden />
                  </Link>
                </p>
                <p className="text-muted-foreground text-xs">
                  {via.length
                    ? t("via", { names: via.map((a) => a.name).join(" ← ") })
                    : t("direct")}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">{t("custom")}</p>
                <p className="text-muted-foreground text-xs">
                  {t("customHint", { name: parent.name })}
                </p>
              </>
            )}
          </div>
        </div>
        {!readOnly ? (
          inheriting ? (
            <Button size="sm" variant="outline" onClick={() => setInherit(false)}>
              <Unlink aria-hidden /> {t("customize")}
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setConfirmReset(true)}>
              <Link2 aria-hidden /> {t("reset")}
            </Button>
          )
        ) : null}
      </div>
      <fieldset
        disabled={inheriting || readOnly}
        className={cn("min-w-0", inheriting && "opacity-75")}
      >
        {children(source, inheriting || readOnly)}
      </fieldset>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("resetTitle")}
        description={t("resetBody", { name: parent.name })}
        confirmLabel={t("resetConfirm")}
        destructive
        onConfirm={() => setInherit(true)}
      />
    </div>
  );
}
