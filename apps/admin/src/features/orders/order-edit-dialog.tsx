"use client";

import * as React from "react";
import { Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEditOrder } from "@repo/api-client";
import type { Order, Product } from "@repo/contracts";
import { Alert, AlertDescription } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { sar, toHalalas } from "@repo/ui/lib/money";
import { ProductPicker } from "@/components/product-picker";

interface EditLine {
  variantId: string;
  productId: string;
  name: string;
  sku: string;
  image: string | undefined;
  quantity: number;
  min: number; // locked floor — fulfilled units can't go below this
  unitPrice: number;
  locked: boolean; // returned/refunded units exist — qty can't change
}

function linesOf(order: Order): EditLine[] {
  return order.items.map((i) => ({
    variantId: i.variantId, productId: i.productId, name: i.productName.ar, sku: i.sku,
    image: i.image?.url, quantity: i.quantity, min: Math.max(i.fulfilledQty, i.returnedQty, i.refundedQty),
    unitPrice: i.unitPrice.amount, locked: i.returnedQty > 0 || i.refundedQty > 0,
  }));
}

export function EditOrderDialog({ order, open, onOpenChange }: { order: Order; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("sales.order.editDialog");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const edit = useEditOrder();
  const [lines, setLines] = React.useState<EditLine[]>([]);
  const [discount, setDiscount] = React.useState("0");
  const [shipping, setShipping] = React.useState("0");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setLines(linesOf(order));
      setDiscount(String(sar(order.discountTotal.amount)));
      setShipping(String(sar(order.shippingTotal.amount)));
      setError(null);
    }
  }, [open, order]);

  const patch = (variantId: string, quantity: number) =>
    setLines((ls) => ls.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(l.min, Math.min(99, quantity)) } : l)));
  const addLine = (p: Product, variantId: string) => {
    if (lines.some((l) => l.variantId === variantId)) {
      patch(variantId, (lines.find((l) => l.variantId === variantId)?.quantity ?? 0) + 1);
      return;
    }
    const v = p.variants.find((x) => x.id === variantId);
    if (!v) return;
    setLines((ls) => [...ls, {
      variantId, productId: p.id, name: p.name.ar, sku: v.sku, image: p.media[0]?.url,
      quantity: 1, min: 0, unitPrice: v.price.amount, locked: false,
    }]);
  };

  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const discountH = Math.min(toHalalas(discount || 0), subtotal);
  const shippingH = toHalalas(shipping || 0);
  const total = Math.max(0, subtotal - discountH + shippingH);

  const submit = () => {
    edit.mutate(
      [order.id, {
        items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity, unitPrice: l.unitPrice })),
        discount: discountH,
        shippingFee: shippingH,
      }],
      {
        onSuccess: () => { toast.success(t("saved")); onOpenChange(false); },
        onError: (err) => {
          const code = (err as Error).message;
          setError(
            code.startsWith("insufficient_stock") ? t("errors.insufficient_stock", { sku: code.split(":")[1] ?? "" })
              : t.has(`errors.${code}` as never) ? t(`errors.${code}` as never)
              : t("errors.failed"),
          );
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title", { number: order.number })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <ProductPicker onAdd={addLine} />
          <ul className="divide-y rounded-md border">
            {lines.map((l) => (
              <li key={l.variantId} className="flex flex-wrap items-center gap-3 p-3">
                <MediaThumb url={l.image} label={l.name} />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm">{l.name}</p>
                  <p className="num text-muted-foreground text-xs" dir="ltr">{l.sku}</p>
                  {l.locked ? <p className="text-warning text-xs">{t("lockedLine")}</p> : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="size-8" disabled={l.locked || l.quantity <= l.min} aria-label={t("decrease")} onClick={() => patch(l.variantId, l.quantity - 1)}><Minus aria-hidden /></Button>
                  <Input className="num h-8 w-14 text-center" inputMode="numeric" value={l.quantity} disabled={l.locked} aria-label={t("quantity")}
                    onChange={(e) => patch(l.variantId, Number(e.target.value) || l.min)} />
                  <Button size="icon" variant="outline" className="size-8" disabled={l.locked} aria-label={t("increase")} onClick={() => patch(l.variantId, l.quantity + 1)}><Plus aria-hidden /></Button>
                </div>
                <span className="num w-24 text-end text-sm">{formatMoney(l.unitPrice * l.quantity, locale)}</span>
                <Button size="icon" variant="ghost" className="size-8" disabled={l.min > 0 || l.locked} aria-label={t("remove")}
                  onClick={() => setLines((ls) => ls.filter((x) => x.variantId !== l.variantId))}><Trash2 aria-hidden /></Button>
              </li>
            ))}
          </ul>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-discount">{t("discount")}</Label>
              <Input id="edit-discount" dir="ltr" inputMode="decimal" className="num" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-shipping">{t("shipping")}</Label>
              <Input id="edit-shipping" dir="ltr" inputMode="decimal" className="num" value={shipping} onChange={(e) => setShipping(e.target.value)} />
            </div>
          </div>
          <div className="bg-muted/50 flex justify-between rounded-md p-3 text-sm">
            <span className="text-muted-foreground">{t("newTotal")}</span>
            <span className="num font-semibold">{formatMoney(total, locale)}</span>
          </div>
          {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tc("cancel")}</Button>
          <Button disabled={edit.isPending || !lines.length} onClick={submit}>
            <Pencil aria-hidden />{t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
