"use client";

import { Check, PackageX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Order } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime } from "@repo/ui/lib/format";

const FLOW = ["placed", "processing", "shipped", "delivered"] as const;
type StepId = (typeof FLOW)[number];

/** Maps fulfillment status to how far along the customer-facing timeline is (-1 = cancelled). */
function reachedStep(o: Order): number {
  if (o.status === "cancelled" || o.fulfillmentStatus === "cancelled") return -1;
  if (o.fulfillmentStatus === "returned") return FLOW.length;
  return { unfulfilled: 0, processing: 1, shipped: 2, delivered: 3 }[o.fulfillmentStatus] ?? 0;
}

function stepAt(o: Order, step: StepId): string | null {
  const hit = (type: string, to?: string) =>
    o.events.find((e) => e.type === type && (to === undefined || String(e.data.to ?? "") === to))?.at ?? null;
  switch (step) {
    case "placed":
      return hit("created") ?? o.createdAt;
    case "processing":
      return hit("status_changed", "processing");
    case "shipped":
      return hit("shipment_created") ?? hit("shipment_updated");
    case "delivered":
      return hit("delivered") ?? hit("status_changed", "delivered");
  }
}

export function OrderTimeline({ order: o }: { order: Order }) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const done = reachedStep(o);
  const cancelled = done === -1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("order.trackTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        {cancelled ? (
          <div className="bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium">
            <PackageX className="size-4" aria-hidden />
            {t("order.steps.cancelled")}
          </div>
        ) : null}
        <ol className={cn(cancelled && "mt-4 opacity-60")}>
          {FLOW.map((step, i) => {
            const reached = i <= done;
            const at = reached ? stepAt(o, step) : null;
            return (
              <li key={step} className="relative flex gap-3 pb-6 last:pb-0">
                {i < FLOW.length - 1 ? (
                  <span className={cn("absolute start-3 top-6 h-full w-px -translate-x-1/2", reached && i < done ? "bg-primary" : "bg-border")} aria-hidden />
                ) : null}
                <span
                  className={cn(
                    "z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
                    reached ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {reached ? <Check className="size-3.5" aria-hidden /> : <span className="size-2 rounded-full bg-current" aria-hidden />}
                </span>
                <div className="space-y-0.5 pt-0.5">
                  <p className={cn("text-sm font-medium", !reached && "text-muted-foreground")}>{t(`order.steps.${step}`)}</p>
                  {at ? <p className="text-muted-foreground num text-xs">{formatDateTime(at, locale)}</p> : null}
                </div>
              </li>
            );
          })}
          {o.fulfillmentStatus === "returned" ? (
            <li className="relative flex gap-3">
              <span className="bg-secondary text-secondary-foreground z-10 flex size-6 shrink-0 items-center justify-center rounded-full">
                <Check className="size-3.5" aria-hidden />
              </span>
              <p className="pt-0.5 text-sm font-medium">{t("order.steps.returned")}</p>
            </li>
          ) : null}
        </ol>
      </CardContent>
    </Card>
  );
}
