"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { canTransitionShipment, useUpdateShipmentStatus, useUpdateShipmentTracking } from "@repo/api-client";
import type { Shipment, ShipmentStatus } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";

const ALL: ShipmentStatus[] = ["label_created", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed_attempt", "returned", "cancelled"];

/** Legal next statuses for a shipment — mirrors the mock server's SHIPMENT_FLOW
 * so the UI can never offer an illogical jump. */
export function nextStatuses(from: ShipmentStatus): ShipmentStatus[] {
  return ALL.filter((to) => canTransitionShipment(from, to));
}

export function ShipmentStatusDialog({ shipment, open, onOpenChange }: { shipment: Shipment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("shipments.statusDialog");
  const update = useUpdateShipmentStatus();
  const options = React.useMemo(() => nextStatuses(shipment.status), [shipment.status]);
  const [status, setStatus] = React.useState<string>(options[0] ?? "");
  const [location, setLocation] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setStatus(options[0] ?? "");
      setLocation("");
      setNote("");
    }
  }, [open, options]);

  const submit = () => {
    if (!status) return;
    update.mutate(
      [shipment.id, { status: status as ShipmentStatus, location: location.trim() || undefined, note: note.trim() || undefined }],
      {
        onSuccess: () => {
          toast.success(t("saved"));
          onOpenChange(false);
        },
        onError: (e) => {
          const code = (e as Error).message;
          const key = `errors.${code.split(":")[0]}`;
          toast.error(t.has(key as never) ? t(key as never) : t("errors.failed"));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description", { tracking: shipment.trackingNumber ?? shipment.id })}</DialogDescription>
        </DialogHeader>
        {options.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("terminal")}</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("status")}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger aria-label={t("status")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {options.map((s) => <SelectItem key={s} value={s}>{t(`to.${s}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shp-loc">{t("location")}</Label>
              <Input id="shp-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shp-note">{t("note")}</Label>
              <Input id="shp-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={submit} disabled={!status || update.isPending} loading={update.isPending}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ShipmentTrackingDialog({ shipment, open, onOpenChange }: { shipment: Shipment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("shipments.trackingDialog");
  const update = useUpdateShipmentTracking();
  const [number, setNumber] = React.useState(shipment.trackingNumber ?? "");
  const [url, setUrl] = React.useState(shipment.trackingUrl && shipment.trackingUrl !== "#" ? shipment.trackingUrl : "");

  React.useEffect(() => {
    if (open) {
      setNumber(shipment.trackingNumber ?? "");
      setUrl(shipment.trackingUrl && shipment.trackingUrl !== "#" ? shipment.trackingUrl : "");
    }
  }, [open, shipment]);

  const submit = () => {
    if (!number.trim()) return;
    update.mutate([shipment.id, { trackingNumber: number.trim(), trackingUrl: url.trim() || null }], {
      onSuccess: () => {
        toast.success(t("saved"));
        onOpenChange(false);
      },
      onError: () => toast.error(t("failed")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="trk-num">{t("number")}</Label>
            <Input id="trk-num" dir="ltr" className="num" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trk-url">{t("url")}</Label>
            <Input id="trk-url" dir="ltr" className="num" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={submit} disabled={!number.trim() || update.isPending} loading={update.isPending}>
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
