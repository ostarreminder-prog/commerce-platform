"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HandoffRule, HandoffTarget } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { HandoffRuleRow } from "./handoff-rule-row";
import { HandoffSide } from "./handoff-side";
import { Section, type TabProps } from "./shared";

export function HandoffsTab({ draft, patch, index, readOnly }: TabProps) {
  const t = useTranslations("studio.detail.handoffs");
  const children = index.children.get(draft.id) ?? [];
  const parent = draft.parentId ? index.byId.get(draft.parentId) : undefined;
  const rules = [...draft.handoffRules].sort((a, b) => a.priority - b.priority);
  const incoming =
    parent?.handoffRules.filter((r) => r.targetType === "child" && r.targetId === draft.id) ?? [];
  const setRules = (next: HandoffRule[]) =>
    patch((a) => ({ ...a, handoffRules: next.map((r, i) => ({ ...r, priority: i + 1 })) }));
  const update = (id: string, change: Partial<HandoffRule>) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, ...change } : r)));
  const moveRule = (i: number, dir: -1 | 1) => {
    const next = [...rules];
    const [item] = next.splice(i, 1);
    if (item) next.splice(i + dir, 0, item);
    setRules(next);
  };
  const add = () => {
    const targetType: HandoffTarget = children.length ? "child" : parent ? "parent" : "human";
    setRules([
      ...rules,
      {
        id: `hr_${Date.now().toString(36)}`,
        targetType,
        ...(targetType === "child" ? { targetId: children[0]?.id } : {}),
        condition: "",
        priority: rules.length + 1,
      },
    ]);
  };
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <Section
        title={t("title")}
        description={t("hint")}
        action={
          !readOnly ? (
            <Button size="sm" onClick={add}>
              <Plus aria-hidden /> {t("add")}
            </Button>
          ) : null
        }
      >
        <fieldset disabled={readOnly} className="min-w-0 space-y-3">
          {rules.length ? (
            <ol className="space-y-3">
              {rules.map((rule, i) => (
                <HandoffRuleRow
                  key={rule.id}
                  rule={rule}
                  position={i}
                  isLast={i === rules.length - 1}
                  childAgents={children}
                  parent={parent}
                  byId={index.byId}
                  readOnly={readOnly}
                  onUpdate={(change) => update(rule.id, change)}
                  onMove={(dir) => moveRule(i, dir)}
                  onRemove={() => setRules(rules.filter((r) => r.id !== rule.id))}
                />
              ))}
            </ol>
          ) : (
            <div className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
              {t("empty")}
            </div>
          )}
          <p className="text-muted-foreground bg-muted/40 rounded-lg p-3 text-xs">
            {t("fallback")}
          </p>
        </fieldset>
      </Section>
      <HandoffSide draft={draft} parent={parent} childAgents={children} incoming={incoming} />
    </div>
  );
}
