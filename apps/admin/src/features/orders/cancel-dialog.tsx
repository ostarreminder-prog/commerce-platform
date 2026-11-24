"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCancelOrder } from "@repo/api-client";
import type { CancelReason } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { Check, type DialogProps } from "./order-dialog-parts";

const CANCEL_REASONS: CancelReason[] = ["customer_request", "out_of_stock", "fraud", "payment_failed", "other"];

export function CancelDialog({ order, open, onOpenChange }: DialogProps) {
  const t = useTranslations("sales.dialogs.cancel");
  const tr = useTranslations("sales.cancelReasons");
  const tc = useTranslations("common");
  const cancel = useCancelOrder();
  const [code, setCode] = React.useState<CancelReason | "">("");
  const [text, setText] = React.useState("");
  const [refund, setRefund] = React.useState(true);
  const [restock, setRestock] = React.useState(true);
  const [notify, setNotify] = React.useState(true);
  const [submitted, setSubmitted] = React.useState(false);
  const paid = order.paymentStatus === "paid" || order.paymentStatus === "partially_refunded";

  const submit = () => {
    setSubmitted(true);
    if (!code || (code === "other" && !text.trim())) return;
    cancel.mutate([order.id, { code, text: text.trim(), refund: paid && refund, restock, notify }], {
      onSuccess: () => { toast.success(t("done", { number: order.number })); onOpenChange(false); },
      onError: () => toast.error(t("failed")),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { number: order.number })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">{t("reason")} *</Label>
            <Select value={code} onValueChange={(v) => setCode(v as CancelReason)}>
              <SelectTrigger id="cancel-reason" aria-invalid={submitted && !code}><SelectValue placeholder={t("choose")} /></SelectTrigger>
              <SelectContent>{CANCEL_REASONS.map((r) => <SelectItem key={r} value={r}>{tr(r)}</SelectItem>)}</SelectContent>
            </Select>
            {submitted && !code ? <p className="text-destructive text-xs">{t("reasonRequired")}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-text">{t("details")}{code === "other" ? " *" : ""}</Label>
            <Textarea id="cancel-text" rows={2} value={text} onChange={(e) => setText(e.target.value)} aria-invalid={submitted && code === "other" && !text.trim()} />
          </div>
          {paid ? <Check id="cancel-refund" checked={refund} onChange={setRefund}>{t("refund")}</Check> : null}
          <Check id="cancel-restock" checked={restock} onChange={setRestock}>{t("restock")}</Check>
          <Check id="cancel-notify" checked={notify} onChange={setNotify}>{t("notify")}</Check>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("back")}</Button>
          <Button variant="destructive" onClick={submit} disabled={cancel.isPending}>{t("confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
