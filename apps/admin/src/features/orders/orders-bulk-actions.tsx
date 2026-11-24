"use client";

import * as React from "react";
import { Download, PackageCheck, Printer, Sparkles, Tag, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAddOrderTag, useCreateShipment, useProductList, useSetOrderFulfillment, useShipmentList } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { Input } from "@repo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { toast } from "@repo/ui/components/toaster";
import { useStatusLabel } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { useCopilot } from "@/features/copilot/copilot-context";
import { exportCsv, type Row } from "./orders-utils";
import { printShippingLabels } from "./print-labels";

export function BulkActions({ rows, clear }: { rows: Row[]; clear: () => void }) {
  const t = useTranslations("sales.orders.bulk");
  const to = useTranslations("sales.order");
  const label = useStatusLabel();
  const { dir } = useAppLocale();
  const ship = useCreateShipment();
  const setF = useSetOrderFulfillment();
  const addTag = useAddOrderTag();
  const shipments = useShipmentList();
  const products = useProductList();
  const copilot = useCopilot();
  const [tag, setTag] = React.useState("");
  /* An order only qualifies when it still has unfulfilled physical items —
   * digital-only orders skip the shipment flow entirely. */
  const shippable = rows.filter((r) =>
    r.order.status !== "cancelled" &&
    (r.order.fulfillmentStatus === "unfulfilled" || r.order.fulfillmentStatus === "processing") &&
    r.order.items.some((i) => i.fulfilledQty < i.quantity && products.data?.find((p) => p.id === i.productId)?.requiresShipping !== false));
  const createShipments = async () => {
    const results = await Promise.allSettled(
      shippable.map((r) => ship.mutateAsync([r.order.id, { carrier: "أرامكس", service: "توصيل عادي", weightGrams: 1_000 }])),
    );
    const ok = results.filter((r) => r.status === "fulfilled").length;
    if (ok === results.length) toast.success(t("shipmentsCreated", { count: ok }));
    else if (ok) toast.error(t("shipmentsPartial", { ok, total: results.length }));
    else toast.error(t("shipmentsFailed"));
    if (ok === results.length) clear();
  };
  const printLabels = () => {
    const jobs = rows.flatMap((r) =>
      (shipments.data ?? []).filter((s) => s.orderId === r.order.id).map((s) => ({ order: r.order, shipment: s })));
    if (!jobs.length) { toast.error(t("noLabels")); return; }
    if (!printShippingLabels(jobs, {
      order: to("labelFields.order"), to: to("labelFields.to"), cod: to("labelFields.cod"),
      weight: to("labelFields.weight"), tracking: to("labelFields.tracking"), label: to("labelFields.label"), packages: to("labelFields.packages"),
    }, dir)) toast.error(to("popupBlocked"));
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={!shippable.length || ship.isPending} onClick={createShipments}>
        <Truck aria-hidden />
        {t("createShipments", { count: shippable.length })}
      </Button>
      <Button size="sm" variant="outline" onClick={printLabels}>
        <Printer aria-hidden />
        {t("printLabels")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={setF.isPending}><PackageCheck aria-hidden />{t("changeStatus")}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {(["processing", "shipped", "delivered"] as const).map((s) => (
            <DropdownMenuItem key={s} onSelect={() => setF.mutate([rows.map((r) => r.order.id), s], { onSuccess: () => { toast.success(t("updated", { count: rows.length })); clear(); } })}>
              {label("order", "fulfillmentStatus", s)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="sm" variant="outline" disabled={addTag.isPending}><Tag aria-hidden />{t("addTag")}</Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!tag.trim()) return;
              addTag.mutate([rows.map((r) => r.order.id), tag.trim()], { onSuccess: () => { toast.success(t("tagged", { count: rows.length })); setTag(""); clear(); } });
            }}
          >
            <Input value={tag} onChange={(e) => setTag(e.target.value)} aria-label={t("addTag")} placeholder={t("tagPlaceholder")} />
            <Button type="submit" size="sm" disabled={addTag.isPending}>{t("apply")}</Button>
          </form>
        </PopoverContent>
      </Popover>
      <Button size="sm" variant="ghost" onClick={() => exportCsv(rows)}>
        <Download aria-hidden />
        {t("export")}
      </Button>
      {/* «هذه الطلبات المحددة» — hands the selected rows to the copilot panel
       * as entity context so follow-ups like «ألغِها» resolve correctly. */}
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          copilot.setSelection(rows.map((r) => ({ type: "order", id: r.order.id, label: `#${r.order.number}`, token: `#${r.order.id}` })));
          copilot.setOpen(true);
        }}
      >
        <Sparkles aria-hidden />
        {t("askCopilot")}
      </Button>
    </div>
  );
}
