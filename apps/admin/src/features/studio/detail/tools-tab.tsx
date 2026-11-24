"use client";

import * as React from "react";
import {
  ArrowLeftRight,
  BadgePercent,
  Ban,
  CreditCard,
  PackageSearch,
  ReceiptText,
  RotateCcw,
  ShieldAlert,
  Ticket,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { AgentToolConfig, AgentToolId } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Switch } from "@repo/ui/components/switch";
import { cn } from "@repo/ui/lib/cn";
import { ConfirmDialog, InheritBlock, NumberInput, Section, type TabProps } from "./shared";

const toolIcons: Record<AgentToolId, LucideIcon> = {
  productSearch: PackageSearch,
  availability: Warehouse,
  orderStatus: ReceiptText,
  paymentLink: CreditCard,
  shippingQuote: Truck,
  cancelOrder: Ban,
  refund: RotateCcw,
  discount: BadgePercent,
  createTicket: Ticket,
  transfer: ArrowLeftRight,
};
export const SENSITIVE_TOOLS: AgentToolId[] = ["cancelOrder", "refund", "discount"];
const LIMIT_TOOLS: Partial<
  Record<AgentToolId, { max: number; unit: "percent" | "sar" | "perDay" }>
> = {
  discount: { max: 50, unit: "percent" },
  refund: { max: 5000, unit: "sar" },
  cancelOrder: { max: 100, unit: "perDay" },
};

export function ToolsTab(props: TabProps) {
  const { patch } = props;
  const t = useTranslations("studio.detail.tools");
  const [pending, setPending] = React.useState<{
    toolId: AgentToolId;
    change: Partial<AgentToolConfig>;
    kind: "enable" | "approval";
  } | null>(null);
  const apply = (toolId: AgentToolId, change: Partial<AgentToolConfig>) =>
    patch((a) => ({
      ...a,
      tools: a.tools.map((x) => (x.toolId === toolId ? { ...x, ...change } : x)),
    }));
  return (
    <Section title={t("title")} description={t("hint")}>
      <InheritBlock {...props} section="tools" tab="tools">
        {(source) => (
          <ul className="divide-y rounded-xl border">
            {source.tools.map((tool) => {
              const Icon = toolIcons[tool.toolId];
              const sensitive = SENSITIVE_TOOLS.includes(tool.toolId);
              const limit = LIMIT_TOOLS[tool.toolId];
              return (
                <li
                  key={tool.toolId}
                  className={cn(
                    "flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4",
                    !tool.enabled && "bg-muted/30",
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-lg",
                        tool.enabled
                          ? sensitive
                            ? "bg-warning/10 text-warning"
                            : "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{t(`names.${tool.toolId}`)}</span>
                        {sensitive ? (
                          <Badge variant="warning" className="gap-1">
                            <ShieldAlert aria-hidden /> {t("sensitive")}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t(`descriptions.${tool.toolId}`)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 ps-12 sm:ps-0">
                    {limit && tool.enabled ? (
                      <label className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{t("limit")}</span>
                        <NumberInput
                          value={tool.limit ?? 0}
                          min={0}
                          max={limit.max}
                          onChange={(v) => apply(tool.toolId, { limit: v })}
                          suffix={t(`units.${limit.unit}`)}
                          className="h-8 w-28"
                        />
                      </label>
                    ) : null}
                    <label
                      className={cn(
                        "flex items-center gap-2 text-xs",
                        !tool.enabled && "opacity-50",
                      )}
                    >
                      <Switch
                        checked={tool.requiresApproval}
                        disabled={!tool.enabled}
                        onCheckedChange={(v) =>
                          sensitive && !v
                            ? setPending({
                                toolId: tool.toolId,
                                change: { requiresApproval: false },
                                kind: "approval",
                              })
                            : apply(tool.toolId, { requiresApproval: v })
                        }
                        aria-label={t("approval")}
                      />
                      {t("approval")}
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium">
                      <Switch
                        checked={tool.enabled}
                        onCheckedChange={(v) =>
                          sensitive && v
                            ? setPending({
                                toolId: tool.toolId,
                                change: { enabled: true, requiresApproval: true },
                                kind: "enable",
                              })
                            : apply(tool.toolId, { enabled: v })
                        }
                        aria-label={t("enabled", { name: t(`names.${tool.toolId}`) })}
                      />
                      {tool.enabled ? t("on") : t("off")}
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </InheritBlock>
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(o) => !o && setPending(null)}
        title={
          pending
            ? t(pending.kind === "enable" ? "confirmEnableTitle" : "confirmApprovalTitle", {
                name: t(`names.${pending.toolId}`),
              })
            : ""
        }
        description={
          pending ? t(pending.kind === "enable" ? "confirmEnableBody" : "confirmApprovalBody") : ""
        }
        confirmLabel={t("confirm")}
        destructive={pending?.kind === "approval"}
        onConfirm={() => pending && apply(pending.toolId, pending.change)}
      />
    </Section>
  );
}
