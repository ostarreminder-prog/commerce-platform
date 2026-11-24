"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useAdjustInventory } from "@repo/api-client";
import type { InventoryLevel, MovementReason, Product, Variant } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { cn } from "@repo/ui/lib/cn";

const REASONS: MovementReason[] = ["adjustment", "damage", "import", "return", "cancellation", "sale"];

export interface InventoryRow {
  level: InventoryLevel;
  product: Product;
  variant: Variant;
  lastAt: string | null;
}

export function AdjustDialog({ row, open, onOpenChange }: { row: InventoryRow | null; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("catalog.inventory.adjust");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const adjust = useAdjustInventory();
  const [mode, setMode] = React.useState<"set" | "delta">("set");
  const [value, setValue] = React.useState("");
  const [reason, setReason] = React.useState<MovementReason>("adjustment");
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    if (open && row) { setMode("set"); setValue(String(row.level.onHand)); setReason("adjustment"); setNote(""); }
  }, [open, row]);
  if (!row) return null;
  const submit = () => {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    if (reason === "adjustment" && !note.trim()) { mt.error("inventory.reasonRequired"); return; }
    adjust.mutate([row.variant.id, mode === "set" ? { set: n, reason, note } : { delta: n, reason, note }], {
      onSuccess: () => { mt.success("inventory.adjusted", { name: row.product.name.ar, qty: n }); onOpenChange(false); },
      onError: (e) => mt.error(e.message === "negative" ? "inventory.negative" : e.message === "note" ? "inventory.reasonRequired" : "common.server.error", e.message === "negative" ? { reserved: row.level.reserved } : undefined),
    });
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{row.product.name.ar}{row.variant.optionValues.length ? ` — ${row.variant.optionValues.join(" / ")}` : ""} · {t("current", { count: row.level.onHand })}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "set" | "delta")} className="grid grid-cols-2 gap-2">
          {(["set", "delta"] as const).map((m) => (
            <Label key={m} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-3", mode === m && "border-primary bg-primary/5")}>
              <RadioGroupItem value={m} />{t(m)}
            </Label>
          ))}
        </RadioGroup>
        <div className="space-y-1.5">
          <Label htmlFor="adj-value">{mode === "set" ? t("newQty") : t("delta")}</Label>
          <Input id="adj-value" inputMode="numeric" dir="ltr" className="num" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("reason")}</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as MovementReason)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{REASONS.map((r) => <SelectItem key={r} value={r}>{t(`reasons.${r}`)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adj-note">{t("note")}{reason === "adjustment" ? " *" : ""}</Label>
          <Textarea id="adj-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button onClick={submit} disabled={adjust.isPending || !value.trim()}>{tc("save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
