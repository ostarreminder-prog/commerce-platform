"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRefundOrder } from "@repo/api-client";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import { sar, toHalalas } from "@repo/ui/lib/money";
import { Check, QtyLines, type DialogProps } from "./order-dialog-parts";

export function RefundDialog({ order, open, onOpenChange, paid, refunded }: DialogProps & { paid: number; refunded: number }) {
  const t = useTranslations("sales.dialogs.refund");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const refund = useRefundOrder();
  const remaining = Math.max(0, paid - refunded);
  const [qty, setQtyState] = React.useState<Record<string, number>>({});
  const [amount, setAmount] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [restock, setRestock] = React.useState(true);
  const [notify, setNotify] = React.useState(true);
  const [submitted, setSubmitted] = React.useState(false);
  /* Idempotency key per dialog session — a retried submit replays the same key
   * and the server dedupes instead of double-refunding. */
  const idemKey = React.useRef("");
  const computed = Math.min(remaining, Math.round(order.items.reduce((s, i) => s + (qty[i.id] ?? 0) * (i.lineTotal.amount / i.quantity), 0)));
  const value = touched ? toHalalas(amount || 0) : computed;
  const amountError = value <= 0 || value > remaining;

  React.useEffect(() => {
    if (!open) return;
    setQtyState({}); setAmount(""); setTouched(false); setReason(""); setSubmitted(false);
    idemKey.current = `${order.id}:${Date.now().toString(36)}`;
  }, [open, order.id]);

  const submit = () => {
    setSubmitted(true);
    if (amountError || !reason.trim()) return;
    refund.mutate(
      [order.id, { amount: value, reason: reason.trim(), restock, idempotencyKey: idemKey.current, items: Object.entries(qty).filter(([, n]) => n > 0).map(([orderItemId, quantity]) => ({ orderItemId, quantity })) }],
      { onSuccess: () => { toast.success(t("done", { amount: formatMoney(value, locale) })); onOpenChange(false); }, onError: () => toast.error(t("failed")) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { number: order.number })}</DialogTitle>
          <DialogDescription>{t("description", { remaining: formatMoney(remaining, locale) })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <QtyLines order={order} qty={qty} setQty={(id, n) => setQtyState((q) => ({ ...q, [id]: n }))} max={(i) => i.quantity - i.returnedQty} />
          <div className="space-y-1.5">
            <Label htmlFor="refund-amount">{t("amount")}</Label>
            <Input
              id="refund-amount"
              inputMode="decimal"
              dir="ltr"
              className="num"
              value={touched ? amount : String(sar(computed))}
              onChange={(e) => { setTouched(true); setAmount(e.target.value); }}
              aria-invalid={submitted && amountError}
            />
            <p className={cn("text-xs", submitted && amountError ? "text-destructive" : "text-muted-foreground")}>{t("amountHint", { max: formatMoney(remaining, locale) })}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refund-reason">{t("reason")} *</Label>
            <Textarea id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={submitted && !reason.trim()} rows={2} />
            {submitted && !reason.trim() ? <p className="text-destructive text-xs">{t("reasonRequired")}</p> : null}
          </div>
          <Check id="refund-restock" checked={restock} onChange={setRestock}>{t("restock")}</Check>
          <Check id="refund-notify" checked={notify} onChange={setNotify}>{t("notify")}</Check>
          <Alert variant="destructive">
            <AlertTriangle aria-hidden />
            <AlertDescription>{t("warning")}</AlertDescription>
          </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button variant="destructive" onClick={submit} disabled={refund.isPending || remaining === 0}>
            {t("confirm", { amount: formatMoney(Math.max(0, value), locale) })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
