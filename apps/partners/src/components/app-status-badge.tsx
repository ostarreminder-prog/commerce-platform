"use client";

import { useTranslations } from "next-intl";
import type { PartnerAppStatus } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";

const VARIANT = { live: "success", inReview: "warning", draft: "secondary" } as const;

export function AppStatusBadge({ status }: { status: PartnerAppStatus }) {
  const t = useTranslations("appStatus");
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
