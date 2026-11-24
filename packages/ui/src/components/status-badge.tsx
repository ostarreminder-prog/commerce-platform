"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "@repo/ui/components/badge";

type Tone = NonNullable<BadgeProps["variant"]>;

const TONES: Record<string, Tone> = {};
const tone = (t: Tone, values: string[]) => values.forEach((v) => (TONES[v] = t));
tone("success", ["paid", "delivered", "active", "resolved", "verified", "cleared", "ready", "approved", "live", "published", "reported", "succeeded", "captured", "cod_collected", "completed", "recovered", "received", "refunded_done", "connected"]);
tone("info", ["in_progress", "processing", "shipped", "in_transit", "open_ai", "out_for_delivery", "picked_up", "open_human", "message_sent", "authorized", "label_created", "in_review", "onboarding"]);
tone("warning", ["pending", "needs_action", "waiting_human", "partially_refunded", "scheduled", "draft", "cod_pending", "unfulfilled", "requested", "info_requested", "not_contacted", "invited", "failed_attempt", "trialing", "past_due", "pending_kyc", "high"]);
tone("destructive", ["failed", "cancelled", "rejected", "out_of_stock", "suspended", "urgent", "lost", "error", "disabled_failing", "negative"]);
tone("secondary", ["archived", "closed", "expired", "disabled", "uninstalled", "returned", "refunded", "voided", "not_connected", "not_started", "low", "normal", "hidden"]);

export type StatusEntity =
  | "order" | "shipment" | "invoice" | "return" | "payment" | "refund" | "product" | "customer" | "conversation" | "approval"
  | "abandonedCart" | "coupon" | "collection" | "staff" | "app" | "installation" | "knowledge" | "page" | "domain" | "theme" | "import" | "agent" | "store" | "common";

export function useStatusLabel() {
  const t = useTranslations("statuses");
  return (entity: StatusEntity, field: string, value: string) => {
    const specific = `${entity}.${field}.${value}`;
    if (t.has(specific as never)) return t(specific as never);
    const common = `common.${value}`;
    return t.has(common as never) ? t(common as never) : value;
  };
}

/** Single source for every status label + color (SCREENS_SPEC §6). */
export function StatusBadge({ entity, field = "status", value, className }: { entity: StatusEntity; field?: string; value: string; className?: string }) {
  const label = useStatusLabel();
  return (
    <Badge variant={TONES[value] ?? "outline"} className={className} data-status={value}>
      {label(entity, field, value)}
    </Badge>
  );
}
