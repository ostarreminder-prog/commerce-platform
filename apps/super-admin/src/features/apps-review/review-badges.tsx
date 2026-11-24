"use client";

import { useTranslations } from "next-intl";
import type { SubmissionStatus } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";

const REVIEW_VARIANT = { pending: "warning", approved: "success", rejected: "destructive" } as const;

export function ReviewStatusBadge({ status }: { status: SubmissionStatus }) {
  const t = useTranslations("reviewStatus");
  return <Badge variant={REVIEW_VARIANT[status]}>{t(status)}</Badge>;
}

export function SubmissionLogo({ name, hue }: { name: string; hue: number }) {
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
