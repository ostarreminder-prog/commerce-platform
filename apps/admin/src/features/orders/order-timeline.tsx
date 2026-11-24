"use client";

import { useTranslations } from "next-intl";
import type { Order, OrderEvent } from "@repo/contracts";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { useStatusLabel } from "@repo/ui/components/status-badge";
import { Timeline, type TimelineItem } from "@/components/entity/timeline";

const TONE: Partial<Record<OrderEvent["type"], TimelineItem["tone"]>> = {
  paid: "success", delivered: "success", payment_failed: "destructive", cancelled: "destructive", refunded: "warning", return_requested: "warning", shipment_created: "info", shipment_updated: "info",
};

export function OrderTimeline({ order }: { order: Order }) {
  const t = useTranslations("sales.events");
  const label = useStatusLabel();
  const { locale } = useAppLocale();
  const items: TimelineItem[] = order.events.map((e) => ({
    id: e.id,
    at: e.at,
    actor: e.actor,
    link: e.link,
    tone: TONE[e.type] ?? "default",
    title: t(e.type, {
      to: e.data.to ? label("order", "fulfillmentStatus", String(e.data.to)) : "",
      carrier: String(e.data.carrier ?? ""),
      amount: formatMoney(Number(e.data.amount ?? 0), locale),
      kind: String(e.data.kind ?? "other"),
    }),
    body: e.type === "note_added" ? String(e.data.text ?? "") : undefined,
  }));
  return <Timeline items={items} />;
}
