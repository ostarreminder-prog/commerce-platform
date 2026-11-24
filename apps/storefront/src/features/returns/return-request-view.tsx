"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CheckCircle2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateReturn, useReturnList, useReturnPolicy } from "@repo/api-client";
import type { Order, OrderItem, ReturnReason } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { returnableItems, returnableQty } from "@/features/order/order-actions";
import { OrderLookupCard } from "@/features/track/track-view";

/**
 * Public return request — the order-page ReturnDialog covers signed-in
 * customers; this page lets guests do the same after verifying the order
 * number + phone (same eligibility rules the mock server enforces).
 */
export function ReturnRequestView() {
  const t = useTranslations("store");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const { data: policy } = useReturnPolicy();
  const { data: returns = [] } = useReturnList();
  const createReturn = useCreateReturn();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [picked, setPicked] = React.useState<Record<string, number>>({});
  const [reason, setReason] = React.useState<ReturnReason>("changed_mind");
  const [note, setNote] = React.useState("");
  const [done, setDone] = React.useState<number | null>(null);

  const mine = React.useMemo(() => (order ? returns.filter((r) => order.returnIds.includes(r.id)) : []), [order, returns]);
  const eligible = order ? returnableItems(order, returns, policy) : [];
  const reasons = policy?.reasons ?? [];
  const chosen = Object.entries(picked).filter(([, q]) => q > 0);

  const toggle = (item: OrderItem, on: boolean) =>
    setPicked((s) => (on ? { ...s, [item.id]: Math.min(1, returnableQty(item, mine)) || 1 } : Object.fromEntries(Object.entries(s).filter(([k]) => k !== item.id))));
  const setQty = (item: OrderItem, qty: number) => setPicked((s) => ({ ...s, [item.id]: Math.max(1, Math.min(qty, returnableQty(item, mine))) }));

  const submit = () =>
    createReturn.mutate(
      [{ orderId: order?.id ?? "", items: chosen.map(([orderItemId, quantity]) => ({ orderItemId, quantity, reason })), reason, customerNote: note.trim() || undefined }],
      {
        onSuccess: (r) => setDone(r.number),
        onError: (err) => {
          const code = err instanceof Error ? err.message : "";
          mt.error(code === "window_expired" ? "returns.outOfPolicy" : "common.server.error", code === "window_expired" ? { days: formatNumber(policy?.windowDays ?? 0) } : undefined);
        },
      },
    );

  if (done !== null)
    return (
      <div className="container max-w-lg py-16 text-center">
        <CheckCircle2 className="text-success mx-auto size-16" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold">{t("returns.sentTitle")}</h1>
        <p className="text-muted-foreground mt-2">{t("returns.sentText")}</p>
        <p className="num mt-3 inline-block rounded-lg border px-4 py-2 font-semibold">{t("returns.reference", { number: formatNumber(done) })}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href={order ? `/order/${order.id}` : "/track"}>{t("track.title")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t("continue")}</Link>
          </Button>
        </div>
      </div>
    );

  return (
    <div className="container max-w-2xl space-y-6 py-10">
      <Breadcrumbs items={[{ label: t("returns.title") }]} />
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <RotateCcw className="text-primary size-6" aria-hidden />
          {t("returns.title")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("returns.subtitle", { days: formatNumber(policy?.windowDays ?? 0) })}</p>
      </div>
      {!order ? (
        <OrderLookupCard onFound={setOrder} />
      ) : eligible.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="font-medium">{t("returns.noneTitle")}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t("returns.noneText", { days: formatNumber(policy?.windowDays ?? 0) })}</p>
            <Button variant="outline" className="mt-4" onClick={() => setOrder(null)}>
              {t("track.submit")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="num text-base">{t("order.orderNumber", { number: formatNumber(order.number) })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                      <Input type="number" min={1} max={max} dir="ltr" className="num w-16 text-center" value={picked[item.id]} onChange={(e) => setQty(item, Number(e.target.value) || 1)} aria-label={t("quantity")} />
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
              <Label htmlFor="rr-reason">{t("order.returnReason")}</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as ReturnReason)}>
                <SelectTrigger id="rr-reason">
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
              <Label htmlFor="rr-note">{t("order.returnNote")}</Label>
              <Textarea id="rr-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setOrder(null)}>
                {t("back")}
              </Button>
              <Button loading={createReturn.isPending} disabled={chosen.length === 0} onClick={submit}>
                {t("order.returnSubmit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
