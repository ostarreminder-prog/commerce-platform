"use client";

import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CornerLeftUp,
  GitBranch,
  Trash2,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { Agent, HandoffRule, HandoffTarget } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { cn } from "@repo/ui/lib/cn";
import { AgentAvatar, AgentStatusBadge } from "../agent-meta";
import { TargetChip } from "./handoff-target";

const targetIcons = { child: GitBranch, parent: CornerLeftUp, human: UserRound } as const;

export function HandoffRuleRow({
  rule,
  position,
  isLast,
  childAgents,
  parent,
  byId,
  readOnly,
  onUpdate,
  onMove,
  onRemove,
}: {
  rule: HandoffRule;
  position: number;
  isLast: boolean;
  childAgents: Agent[];
  parent?: Agent;
  byId: Map<string, Agent>;
  readOnly: boolean;
  onUpdate: (change: Partial<HandoffRule>) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  const t = useTranslations("studio.detail.handoffs");
  const Icon = targetIcons[rule.targetType];
  const target =
    rule.targetType === "child"
      ? rule.targetId
        ? byId.get(rule.targetId)
        : undefined
      : rule.targetType === "parent"
        ? parent
        : undefined;
  const inactive = target && target.status !== "live";
  const invalid = (rule.targetType === "child" && !target) || (rule.targetType === "parent" && !parent);
  return (
    <li
      className={cn(
        "bg-card rounded-xl border p-3 sm:p-4",
        (inactive || invalid) && "border-warning/60",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1">
          <span
            className="num bg-primary/10 text-primary flex size-7 items-center justify-center rounded-full text-xs font-bold"
            aria-label={t("priority", { n: position + 1 })}
          >
            {position + 1}
          </span>
          {!readOnly ? (
            <>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6"
                disabled={position === 0}
                onClick={() => onMove(-1)}
                aria-label={t("up")}
              >
                <ArrowUp className="size-3.5" aria-hidden />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-6"
                disabled={isLast}
                onClick={() => onMove(1)}
                aria-label={t("down")}
              >
                <ArrowDown className="size-3.5" aria-hidden />
              </Button>
            </>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <span className="text-muted-foreground text-xs font-medium">{t("when")}</span>
            <Input
              value={rule.condition}
              onChange={(e) => onUpdate({ condition: e.target.value })}
              placeholder={t("conditionPlaceholder")}
              aria-label={t("when")}
              aria-invalid={!rule.condition.trim()}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground text-xs font-medium">{t("then")}</span>
            <Select
              value={rule.targetType}
              onValueChange={(v) => {
                const targetType = v as HandoffTarget;
                onUpdate({
                  targetType,
                  targetId: targetType === "child" ? childAgents[0]?.id : undefined,
                });
              }}
            >
              <SelectTrigger className="h-9 w-auto min-w-36 gap-2" aria-label={t("targetType")}>
                <Icon className="size-4" aria-hidden /> <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="child" disabled={!childAgents.length}>
                  {t("targets.child")}
                </SelectItem>
                <SelectItem value="parent" disabled={!parent}>
                  {t("targets.parent")}
                </SelectItem>
                <SelectItem value="human">{t("targets.human")}</SelectItem>
              </SelectContent>
            </Select>
            {rule.targetType === "child" ? (
              <Select
                value={rule.targetId ?? ""}
                onValueChange={(targetId) => onUpdate({ targetId })}
              >
                <SelectTrigger
                  className="h-9 w-auto min-w-44"
                  aria-label={t("targets.child")}
                >
                  <SelectValue placeholder={t("pickChild")} />
                </SelectTrigger>
                <SelectContent>
                  {childAgents.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <AgentAvatar
                          agent={c}
                          size="sm"
                          className="size-5 rounded-md [&_svg]:size-3"
                        />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : rule.targetType === "parent" ? (
              <TargetChip agent={parent} />
            ) : (
              <TargetChip human={t("humanTeam")} />
            )}
            {target ? <AgentStatusBadge status={target.status} /> : null}
          </div>
          {inactive ? (
            <p className="text-warning flex items-center gap-1.5 text-xs">
              <AlertTriangle className="size-3.5" aria-hidden />
              {t("inactive", { name: target.name })}
            </p>
          ) : null}
        </div>
        {!readOnly ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label={t("remove")}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </li>
  );
}
