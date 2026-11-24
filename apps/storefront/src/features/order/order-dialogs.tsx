"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateReturn, useReturnList } from "@repo/api-client";
import type { useCancelOrder } from "@repo/api-client";
import type { CancelReason, Order, OrderItem, ReturnPolicySettings, ReturnReason } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { returnableQty } from "./order-actions";

const CANCEL_REASONS: CancelReason[] = ["customer_request", "out_of_stock", "payment_failed", "other"];

export function CancelDialog({
  order: o,
  open,
  onOpenChange,
  pending,
}: {
  order: Order;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pending: ReturnType<typeof useCancelOrder>;
}) {
  const t = useTranslations("store");
  const mt = useMsgToast();
  const [code, setCode] = React.useState<CancelReason>("customer_request");
  const [text, setText] = React.useState("");

  const submit = () =>
    pending.mutate([o.id, { code, text: text.trim() || t(`cancelReasons.${code}`), refund: true, restock: true, notify: true }], {
      onSuccess: () => {
        mt.success("orders.cancel.success", { number: formatNumber(o.number) });
        onOpenChange(false);
      },
      onError: () => mt.error("common.server.error"),
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("order.cancelTitle")}</DialogTitle>
          <DialogDescription>{t("order.cancelText")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">{t("order.cancelReason")}</Label>
            <Select value={code} onValueChange={(v) => setCode(v as CancelReason)}>
              <SelectTrigger id="cancel-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`cancelReasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-note">{t("order.cancelNote")}</Label>
            <Input id="cancel-note" value={text} onChange={(e) => setText(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("back")}
          </Button>
          <Button variant="destructive" loading={pending.isPending} onClick={submit}>
            {t("order.cancelConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ReturnDialog({
  order: o,
  eligible,
  policy,
  open,
  onOpenChange,
}: {
  order: Order;
  eligible: OrderItem[];
  policy: ReturnPolicySettings | undefined;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useTranslations("store");
  const { locale } = useAppLocale();
  const mt = useMsgToast();
  const { data: returns = [] } = useReturnList();
  const createReturn = useCreateReturn();
  const [picked, setPicked] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState<ReturnReason>("other");
  const [note, setNote] = React.useState("");
  const mine = returns.filter((r) => o.returnIds.includes(r.id));
  const reasons = policy?.reasons ?? [];

  const toggle = (item: OrderItem, on: boolean) =>
    setPicked((s) => (on ? { ...s, [item.id]: Math.min(1, returnableQty(item, mine)) || 1 } : Object.fromEntries(Object.entries(s).filter(([k]) => k !== item.id))));
  const setQty = (item: OrderItem, qty: number) => setPicked((s) => ({ ...s, [item.id]: Math.max(1, Math.min(qty, returnableQty(item, mine))) }));
  const chosen = Object.entries(picked).filter(([, q]) => q > 0);

  const submit = () =>
    createReturn.mutate(
      [
        {
          orderId: o.id,
          items: chosen.map(([orderItemId, quantity]) => ({ orderItemId, quantity, reason })),
          reason,
          customerNote: note.trim() || undefined,
        },
      ],
      {
        onSuccess: () => {
          mt.success("store.return.submitted");
          setPicked({});
          onOpenChange(false);
        },
        onError: () => mt.error("common.server.error"),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("order.returnTitle")}</DialogTitle>
          <DialogDescription>{t("order.returnText", { days: formatNumber(policy?.windowDays ?? 0) })}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ul className="divide-y rounded-lg border">
            {eligible.map((item) => {
              const max = returnableQty(item, mine);
              const on = picked[item.id] !== undefined;
              return (
                <li key={item.id} className="flex items-center gap-3 p-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={item.productName[locale] ?? item.productName.ar}
                    onClick={() => toggle(item, !on)}
                    className={cn("flex size-5 shrink-0 items-center justify-center rounded border", on && "border-primary bg-primary text-primary-foreground")}
                  >
                    {on ? <Check className="size-3.5" aria-hidden /> : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.productName[locale]}</p>
                    {item.variantLabel ? <p className="text-muted-foreground text-xs">{item.variantLabel}</p> : null}
                  </div>
                  {on && max > 1 ? (
                    <Input
                      type="number"
                      min={1}
                      max={max}
                      dir="ltr"
                      className="num w-16 text-center"
                      value={picked[item.id]}
                      onChange={(e) => setQty(item, Number(e.target.value) || 1)}
                      aria-label={t("quantity")}
                    />
                  ) : on ? (
                    <span className="num text-muted-foreground text-xs">×{formatNumber(picked[item.id] ?? 1)}</span>
                  ) : (
                    <span className="num text-muted-foreground text-xs">{t("order.maxQty", { count: formatNumber(max) })}</span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="space-y-1.5">
            <Label htmlFor="ret-reason">{t("order.returnReason")}</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
              <SelectTrigger id="ret-reason">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`returnReasons.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ret-note">{t("order.returnNote")}</Label>
            <Input id="ret-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("back")}
          </Button>
          <Button loading={createReturn.isPending} disabled={chosen.length === 0} onClick={submit}>
            {t("order.returnSubmit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
