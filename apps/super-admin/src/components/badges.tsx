"use client";

import { useTranslations } from "next-intl";
import type { PlanId, TenantStatus } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";

const STATUS_VARIANT = { active: "success", trial: "info", suspended: "destructive" } as const;

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const t = useTranslations("status");
  return <Badge variant={STATUS_VARIANT[status]}>{t(status)}</Badge>;
}

export function PlanBadge({ plan }: { plan: PlanId }) {
  const t = useTranslations("plan");
  return <Badge variant={plan === "pro" ? "default" : "outline"}>{t(plan)}</Badge>;
}

export function TenantLogo({ name, hue }: { name: string; hue: number }) {
  return (
    <span
      className="flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold"
      style={{ background: `hsl(${hue} 55% 92%)`, color: `hsl(${hue} 50% 30%)` }}
      aria-hidden
    >
      {name.charAt(0)}
    </span>
  );
}
