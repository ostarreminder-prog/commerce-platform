"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent, HandoffRule } from "@repo/contracts";
import { AgentAvatar } from "../agent-meta";
import { TargetChip } from "./handoff-target";
import { Section } from "./shared";

export function HandoffSide({
  draft,
  parent,
  childAgents,
  incoming,
}: {
  draft: Agent;
  parent?: Agent;
  childAgents: Agent[];
  incoming: HandoffRule[];
}) {
  const t = useTranslations("studio.detail.handoffs");
  return (
    <div className="space-y-6">
      <Section title={t("incoming")} description={t("incomingHint")}>
        {parent ? (
          <div className="space-y-3">
            <TargetChip agent={parent} />
            {incoming.length ? (
              <ul className="space-y-2">
                {incoming.map((r) => (
                  <li key={r.id} className="bg-muted/40 rounded-lg p-2.5 text-sm">
                    «{r.condition}»
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">{t("incomingByDescription")}</p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("incomingRoot")}</p>
        )}
      </Section>
      <Section title={t("map")}>
        <div className="flex flex-col items-center gap-2 text-sm">
          {parent ? <TargetChip agent={parent} /> : null}
          {parent ? <ArrowUp className="text-muted-foreground size-4" aria-hidden /> : null}
          <span className="border-primary bg-primary/5 inline-flex items-center gap-2 rounded-full border-2 py-1 pe-3 ps-1 font-semibold">
            <AgentAvatar agent={draft} size="sm" className="size-6 rounded-full [&_svg]:size-3" />
            {draft.name}
          </span>
          {childAgents.length ? (
            <ArrowDown className="text-muted-foreground size-4" aria-hidden />
          ) : null}
          <div className="flex flex-wrap justify-center gap-2">
            {childAgents.map((c) => (
              <TargetChip key={c.id} agent={c} />
            ))}
          </div>
          {draft.handoffRules.some((r) => r.targetType === "human") ? (
            <>
              <ArrowDown className="text-muted-foreground size-4" aria-hidden />
              <TargetChip human={t("humanTeam")} />
            </>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
