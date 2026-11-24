"use client";

import * as React from "react";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { printShippingLabels } from "@/features/orders/print-labels";
import { labelEligible, type Row } from "./shipments-utils";

/** Bulk action bar — prints a real label sheet (one 10×15 page per shipment)
 * for every selected row whose carrier issued label+tracking; the rest are
 * reported as skipped, never silently dropped. */
export function ShipmentsBulkActions({ rows, clear }: { rows: Row[]; clear: () => void }) {
  const t = useTranslations("shipments.bulk");
  const to = useTranslations("sales.order");
  const { dir } = useAppLocale();
  const eligible = rows.filter(labelEligible);
  const skipped = rows.length - eligible.length;

  const print = () => {
    if (!eligible.length) {
      toast.error(t("none"));
      return;
    }
    const jobs = eligible.map((r) => ({ order: r.order as NonNullable<Row["order"]>, shipment: r.shipment }));
    const ok = printShippingLabels(
      jobs,
      {
        order: to("labelFields.order"), to: to("labelFields.to"), cod: to("labelFields.cod"),
        weight: to("labelFields.weight"), tracking: to("labelFields.tracking"), label: to("labelFields.label"), packages: to("labelFields.packages"),
      },
      dir,
    );
    if (!ok) {
      toast.error(to("popupBlocked"));
      return;
    }
    toast.success(t("done", { printed: eligible.length }));
    if (skipped > 0) toast.info(t("skipped", { skipped }));
    clear();
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outline" onClick={print}>
        <Printer aria-hidden />
        {t("print", { count: eligible.length })}
      </Button>
      {skipped > 0 ? <span className="text-muted-foreground text-xs">{t("skippedShort", { skipped })}</span> : null}
    </div>
  );
}
