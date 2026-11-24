"use client";

import * as React from "react";
import { AlertTriangle, Check, MessageCircleQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import { useApproveReturn, useRefundReturn, useRequestReturnInfo, useSetReturnStatus } from "@repo/api-client";
import type { Order, Return } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatMoney } from "@repo/ui/lib/format";
import { sar, toHalalas } from "@repo/ui/lib/money";
import { itemsOf } from "./return-utils";

const RESOLUTIONS = ["refund", "exchange", "store_credit"] as const;

export function ApproveDialog({ ret, order, open, onOpenChange }: { ret: Return; order: Order | undefined; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sales.returns.approve");
  const tc = useTranslations("common");
  const approve = useApproveReturn();
  /* Partial acceptance: reviewer trims each line's qty down from the request;
   * the suggested refund scales with the accepted quantities. */
  const [qty, setQty] = React.useState<Record<string, number>>({});
  const accepted = React.useMemo(
    () => itemsOf(ret, order).map(({ line, item }) => ({ line, item, qty: Math.min(qty[line.orderItemId] ?? line.quantity, line.quantity) })),
    [ret, order, qty],
  );
  const suggested = Math.round(accepted.reduce((s, { item, qty: q }) => s + (item ? (item.lineTotal.amount / item.quantity) * q : 0), 0));
  const [resolution, setResolution] = React.useState<(typeof RESOLUTIONS)[number]>("refund");
  const [amount, setAmount] = React.useState("");
  const [amountTouched, setAmountTouched] = React.useState(false);
  const [restock, setRestock] = React.useState(ret.reason !== "damaged");
  const [ship, setShip] = React.useState(true);
  React.useEffect(() => { if (open) { setQty({}); setAmountTouched(false); } }, [open]);
  const value = toHalalas((amountTouched ? amount : String(sar(suggested))) || 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { number: ret.number })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("acceptedQty")}</Label>
            <ul className="divide-y rounded-md border">
              {accepted.map(({ line, item, qty: q }) => (
                <li key={line.orderItemId} className="flex items-center gap-2 p-2.5 text-sm">
                  <span className="line-clamp-1 flex-1">{item?.productName.ar ?? line.orderItemId}</span>
                  <span className="num text-muted-foreground text-xs">{t("requestedQty", { n: line.quantity })}</span>
                  <Input
                    className="num h-8 w-16 text-center" dir="ltr" inputMode="numeric" min={0} max={line.quantity}
                    value={q} aria-label={t("acceptedQty")}
                    onChange={(e) => setQty((m) => ({ ...m, [line.orderItemId]: Math.max(0, Math.min(line.quantity, Number(e.target.value) || 0)) }))}
                  />
                </li>
              ))}
            </ul>
            {!accepted.some((a) => a.qty > 0) ? <p className="text-destructive text-xs">{t("noAcceptedItems")}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>{t("resolution")}</Label>
            <RadioGroup value={resolution} onValueChange={(v) => setResolution(v as typeof resolution)} className="grid grid-cols-3 gap-2">
              {RESOLUTIONS.map((r) => (
                <Label key={r} htmlFor={`res-${r}`} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm font-normal", resolution === r && "border-primary bg-primary/5")}>
                  <RadioGroupItem id={`res-${r}`} value={r} />{t(`resolutions.${r}`)}
                </Label>
              ))}
            </RadioGroup>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ret-amount">{resolution === "store_credit" ? t("creditAmount") : t("amount")}</Label>
            <Input id="ret-amount" dir="ltr" inputMode="decimal" className="num" value={amountTouched ? amount : String(sar(suggested))} onChange={(e) => { setAmountTouched(true); setAmount(e.target.value); }} aria-invalid={value <= 0} />
          </div>
          <div className="flex items-center gap-2"><Checkbox id="ret-restock" checked={restock} onCheckedChange={(v) => setRestock(v === true)} /><Label htmlFor="ret-restock" className="font-normal">{t("restock")}</Label></div>
          <div className="flex items-center gap-2"><Checkbox id="ret-ship" checked={ship} onCheckedChange={(v) => setShip(v === true)} /><Label htmlFor="ret-ship" className="font-normal">{t("createShipment")}</Label></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button
            disabled={approve.isPending || value <= 0 || !accepted.some((a) => a.qty > 0)}
            onClick={() => approve.mutate([ret.id, { resolution, refundAmount: value, restock, createShipment: ship, acceptedItems: accepted.map((a) => ({ orderItemId: a.line.orderItemId, quantity: a.qty })) }], { onSuccess: () => { toast.success(t("done")); onOpenChange(false); } })}
          >
            <Check aria-hidden />{t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* "Request more info" (SCREENS_SPEC §5.2): puts the return on hold and logs the
 * question on the activity timeline so the customer/agent can respond. */
export function RequestInfoDialog({ ret, open, onOpenChange }: { ret: Return; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sales.returns.requestInfo");
  const tc = useTranslations("common");
  const requestInfo = useRequestReturnInfo();
  const [note, setNote] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("title", { number: ret.number })}</DialogTitle><DialogDescription>{t("description")}</DialogDescription></DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="ri-note">{t("note")} *</Label>
          <Textarea id="ri-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={submitted && !note.trim()} />
          {submitted && !note.trim() ? <p className="text-destructive text-xs">{t("required")}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button
            disabled={requestInfo.isPending}
            onClick={() => {
              setSubmitted(true);
              if (!note.trim()) return;
              requestInfo.mutate([ret.id, note.trim()], { onSuccess: () => { toast.success(t("done")); onOpenChange(false); }, onError: () => toast.error(t("failed")) });
            }}
          >
            <MessageCircleQuestion aria-hidden />{t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RejectDialog({ ret, open, onOpenChange }: { ret: Return; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sales.returns.reject");
  const tc = useTranslations("common");
  const setStatus = useSetReturnStatus();
  const [reason, setReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("title", { number: ret.number })}</DialogTitle><DialogDescription>{t("description")}</DialogDescription></DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="rej-reason">{t("reason")} *</Label>
          <Textarea id="rej-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} aria-invalid={submitted && !reason.trim()} />
          {submitted && !reason.trim() ? <p className="text-destructive text-xs">{t("required")}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button
            variant="destructive"
            disabled={setStatus.isPending}
            onClick={() => {
              setSubmitted(true);
              if (!reason.trim()) return;
              setStatus.mutate([ret.id, "rejected", { rejectionReason: reason.trim() }], { onSuccess: () => { toast.success(t("done")); onOpenChange(false); } });
            }}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RefundConfirm({ ret, open, onOpenChange }: { ret: Return; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sales.returns.refund");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const refund = useRefundReturn();
  const amount = formatMoney(ret.refundAmount?.amount ?? 0, locale);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("title", { amount })}</DialogTitle><DialogDescription>{t("description")}</DialogDescription></DialogHeader>
        <Alert variant="destructive"><AlertTriangle aria-hidden /><AlertDescription>{t("warning")}</AlertDescription></Alert>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button variant="destructive" disabled={refund.isPending} onClick={() => refund.mutate([ret.id], { onSuccess: () => { toast.success(t("done", { amount })); onOpenChange(false); }, onError: () => toast.error(t("failed")) })}>
            {t("confirm", { amount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
