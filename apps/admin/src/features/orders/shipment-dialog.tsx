"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCreateShipment, useProductList, useShipmentList, useShippingSettings } from "@repo/api-client";
import type { Shipment } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { QtyLines, RATES, type DialogProps } from "./order-dialog-parts";

const CARRIER_NAMES: Record<string, string> = { aramex: "أرامكس", smsa: "سمسا", spl: "سبل", redbox: "ريدبوكس" };

interface CarrierOption {
  carrier: string;
  service: string;
  price: number;
  etaDays: number;
}

export function ShipmentDialog({ order, open, onOpenChange }: DialogProps) {
  const t = useTranslations("sales.dialogs.shipment");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const create = useCreateShipment();
  const products = useProductList();
  const settings = useShippingSettings();
  const shipments = useShipmentList();

  /* Carriers + services come from shipping settings (enabled carriers); price
   * & ETA ride the demo rate card where one exists, else the zone fallback. */
  const options = React.useMemo<CarrierOption[]>(() => {
    const enabled = settings.data?.carriers.filter((c) => c.enabled) ?? [];
    const fallbackPrice = settings.data?.fallbackRate.amount ?? 2_500;
    const fallbackEta = (settings.data?.handlingDays ?? 1) + 2;
    const list = enabled.map((c) => {
      const carrier = CARRIER_NAMES[c.carrierId] ?? c.carrierId;
      const rate = RATES.find((r) => r.carrier === carrier);
      return { carrier, service: rate?.service ?? "توصيل عادي", price: rate?.price ?? fallbackPrice, etaDays: rate?.etaDays ?? fallbackEta };
    });
    return list.length ? list : RATES.map((r) => ({ carrier: r.carrier, service: r.service, price: r.price, etaDays: r.etaDays }));
  }, [settings.data]);

  /* Existing shipments for this order — the dup guard: instead of silently
   * stacking labels, the operator sees (and can open) what's already booked. */
  const existing = React.useMemo(
    () => (shipments.data ?? []).filter((s) => s.orderId === order.id && s.status !== "cancelled"),
    [shipments.data, order.id],
  );

  /* Only physical goods ship — digital items (requiresShipping=false) are
   * auto-excluded here and rejected again server-side in createShipment. */
  const shippableItems = React.useMemo(
    () => order.items.filter((i) => products.data?.find((p) => p.id === i.productId)?.requiresShipping !== false),
    [order.items, products.data],
  );
  const shippableOrder = React.useMemo(() => ({ ...order, items: shippableItems }), [order, shippableItems]);
  const initialQty = React.useCallback(() => Object.fromEntries(shippableItems.map((i) => [i.id, i.quantity - i.fulfilledQty])), [shippableItems]);
  const [qty, setQty] = React.useState<Record<string, number>>(initialQty);
  const units = Object.values(qty).reduce((s, n) => s + n, 0);
  const remaining = shippableItems.reduce((s, i) => s + (i.quantity - i.fulfilledQty), 0);
  const [weight, setWeight] = React.useState("");
  const [dims, setDims] = React.useState({ l: "30", w: "20", h: 12 + "" });
  const [rate, setRate] = React.useState("0");
  const [pickup, setPickup] = React.useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));
  const autoWeight = (units * 0.45).toFixed(2);

  React.useEffect(() => { if (open) { setQty(initialQty()); setWeight(""); } }, [open, initialQty]);

  const chosen = options[Number(rate)] ?? options[0];
  const submit = () => {
    if (!units || !chosen) return;
    create.mutate(
      [order.id, {
        carrier: chosen.carrier, service: chosen.service, cost: chosen.price, pickupDate: pickup,
        weightGrams: Math.round(Number(weight || autoWeight) * 1000),
        items: Object.entries(qty).filter(([, n]) => n > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity })),
        packages: [{ weightGrams: Math.round(Number(weight || autoWeight) * 1000), dimensionsCm: { l: Number(dims.l), w: Number(dims.w), h: Number(dims.h) } }],
      }],
      {
        onSuccess: (s) => { toast.success(t("done", { tracking: s.trackingNumber ?? "" })); onOpenChange(false); },
        onError: () => toast.error(t("failed")),
      },
    );
  };

  const a = order.shippingAddress;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("title", { number: order.number })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {existing.length ? (
            <section className="space-y-2">
              <h3 className="text-sm font-medium">{t("existing")}</h3>
              <ul className="divide-y rounded-md border text-sm">
                {existing.map((s: Shipment) => (
                  <li key={s.id} className="flex items-center gap-3 p-2.5">
                    <EntityLink type="shipment" id={s.id} className="num" />
                    <span className="text-muted-foreground flex-1 truncate">{s.carrier} · {s.service}</span>
                    <StatusBadge entity="shipment" value={s.status} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {remaining === 0 ? <p className="text-muted-foreground text-sm">{t("fullyShipped")}</p> : null}
          <section className="space-y-2">
            <h3 className="text-sm font-medium">{t("items")}</h3>
            <QtyLines order={shippableOrder} qty={qty} setQty={(id, n) => setQty((q) => ({ ...q, [id]: n }))} max={(i) => i.quantity - i.fulfilledQty} />
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-medium">{t("deliverTo")}</h3>
            <div className="text-muted-foreground rounded-md border p-3 text-sm">
              <p className="text-foreground font-medium">{a.recipientName}</p>
              <p>{a.city} · {a.district}{a.street ? ` · ${a.street}` : ""}</p>
              <bdi dir="ltr" className="num text-xs">{a.phone}</bdi>
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-medium">{t("package")}</h3>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label htmlFor="pkg-w" className="text-xs">{t("weight")}</Label>
                <Input id="pkg-w" inputMode="decimal" dir="ltr" className="num" placeholder={autoWeight} value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              {(["l", "w", "h"] as const).map((k) => (
                <div key={k} className="space-y-1">
                  <Label htmlFor={`pkg-${k}`} className="text-xs">{t(`dims.${k}`)}</Label>
                  <Input id={`pkg-${k}`} inputMode="numeric" dir="ltr" className="num" value={dims[k]} onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))} />
                </div>
              ))}
            </div>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-medium">{t("carrier")}</h3>
            <RadioGroup value={rate} onValueChange={setRate} className="grid gap-2 sm:grid-cols-2">
              {options.map((r, i) => (
                <Label key={r.carrier} htmlFor={`rate-${i}`} className={cn("flex cursor-pointer items-center gap-3 rounded-md border p-3 font-normal", rate === String(i) && "border-primary bg-primary/5")}>
                  <RadioGroupItem id={`rate-${i}`} value={String(i)} />
                  <span className="flex-1">
                    <span className="block font-medium">{r.carrier}</span>
                    <span className="text-muted-foreground block text-xs">{r.service} · {t("eta", { days: r.etaDays })}</span>
                  </span>
                  <span className="num text-sm font-semibold">{formatMoney(r.price, locale)}</span>
                </Label>
              ))}
            </RadioGroup>
          </section>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("cod")}</Label>
              <p className="num bg-muted rounded-md px-3 py-2 text-sm">{order.paymentMethod === "cod" ? formatMoney(order.total.amount, locale) : t("noCod")}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pickup">{t("pickup")}</Label>
              <Input id="pickup" type="date" dir="ltr" value={pickup} onChange={(e) => setPickup(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={submit} disabled={!units || create.isPending}>{t("confirm", { count: units })}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
