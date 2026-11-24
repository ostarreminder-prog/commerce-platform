"use client";

import * as React from "react";
import { ArrowLeftRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInventoryLevels, useLocations, useTransferStock } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { formatNumber } from "@repo/ui/lib/format";

/** Moves stock between two locations for one variant — writes a paired
 * negative/positive adjustment so the ledger stays auditable. */
export function TransferDialog({ variantId, variantLabel, open, onOpenChange }: {
  variantId: string;
  variantLabel: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("catalog.transfer");
  const mt = useMsgToast();
  const locations = useLocations();
  const levels = useInventoryLevels();
  const transfer = useTransferStock();
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [qty, setQty] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => { if (open) { setFrom(""); setTo(""); setQty(""); setNote(""); } }, [open]);

  const mine = (levels.data ?? []).filter((l) => l.variantId === variantId);
  const fromLevel = mine.find((l) => l.locationId === from);
  const q = Number(qty);

  const submit = () => {
    if (!from || !to || from === to) { toast.error(t("sameLocation")); return; }
    if (!Number.isFinite(q) || q <= 0) { toast.error(t("qtyRequired")); return; }
    if (fromLevel && q > fromLevel.onHand) { toast.error(t("exceeds", { available: formatNumber(fromLevel.onHand) })); return; }
    transfer.mutate([variantId, { fromLocationId: from, toLocationId: to, quantity: q, note: note.trim() || undefined }], {
      onSuccess: () => { mt.success("locations.transferred"); onOpenChange(false); },
      onError: (e) => mt.error(e.message === "insufficient" ? "locations.insufficient" : "common.save.error"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ArrowLeftRight className="size-4" aria-hidden /> {t("title")}</DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{variantLabel}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="tr-from">{t("from")}</Label>
            <Select value={from} onValueChange={setFrom}>
              <SelectTrigger id="tr-from"><SelectValue placeholder={t("pickLocation")} /></SelectTrigger>
              <SelectContent>
                {(locations.data ?? []).filter((l) => l.status === "active").map((l) => {
                  const lv = mine.find((x) => x.locationId === l.id);
                  return <SelectItem key={l.id} value={l.id}>{l.name} — {formatNumber(lv?.onHand ?? 0)}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tr-to">{t("to")}</Label>
            <Select value={to} onValueChange={setTo}>
              <SelectTrigger id="tr-to"><SelectValue placeholder={t("pickLocation")} /></SelectTrigger>
              <SelectContent>
                {(locations.data ?? []).filter((l) => l.status === "active" && l.id !== from).map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tr-qty">{t("quantity")}</Label>
          <Input id="tr-qty" className="num" dir="ltr" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} />
          {fromLevel ? <p className="text-muted-foreground text-xs">{t("onHandAtSource", { count: formatNumber(fromLevel.onHand) })}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tr-note">{t("note")}</Label>
          <Textarea id="tr-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("noteHint")} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={submit} disabled={transfer.isPending}>{t("submit")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
