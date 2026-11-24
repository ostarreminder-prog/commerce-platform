"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, ShoppingBag, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { canCancelOrder, useCancelOrder, useReturnList, useReturnPolicy } from "@repo/api-client";
import type { Order, OrderItem, Return, ReturnPolicySettings } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toaster";
import { useCart } from "@/components/cart-context";
import { useStoreProducts } from "@/lib/store-product";
import { CancelDialog, ReturnDialog } from "./order-dialogs";

/** Remaining returnable quantity for an order line — ordered minus already
 * returned minus units pending in open (not rejected/closed) returns.
 * Mirrors `returns.create` server-side caps. */
export function returnableQty(item: OrderItem, returns: Return[]): number {
  const pending = returns
    .filter((r) => !["rejected", "closed"].includes(r.status))
    .reduce((s, r) => s + r.items.filter((x) => x.orderItemId === item.id).reduce((t, x) => t + x.quantity, 0), 0);
  return Math.max(0, item.quantity - item.returnedQty - pending);
}

/** Items the policy still lets the customer return (window + exclusions + caps). */
export function returnableItems(order: Order, returns: Return[], policy: ReturnPolicySettings | undefined): OrderItem[] {
  if (!policy || order.status === "cancelled" || order.fulfillmentStatus === "cancelled") return [];
  const within = Date.now() - new Date(order.createdAt).getTime() <= policy.windowDays * 86_400_000;
  if (!within) return [];
  const mine = returns.filter((r) => order.returnIds.includes(r.id));
  return order.items.filter((it) => !policy.nonReturnableProductIds.includes(it.productId) && returnableQty(it, mine) > 0);
}

/** Reorder / cancel / request-return actions on the order page — each gated
 * by the same rules the mock server enforces. */
export function OrderActions({ order: o }: { order: Order }) {
  const t = useTranslations("store");
  const router = useRouter();
  const { add } = useCart();
  const { data: policy } = useReturnPolicy();
  const { data: returns = [] } = useReturnList();
  const { data: products = [] } = useStoreProducts();
  const cancelOrder = useCancelOrder();
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [returnOpen, setReturnOpen] = React.useState(false);

  const cancellable = canCancelOrder(o);
  const eligible = returnableItems(o, returns, policy);

  const reorder = () => {
    let added = 0;
    for (const item of o.items) {
      const p = products.find((x) => x.variants.some((v) => v.id === item.variantId));
      const v = p?.variants.find((v) => v.id === item.variantId);
      if (p && v && p.status === "active" && (v.stock > 0 || !v.trackInventory)) {
        add(p.id, item.quantity, v.id);
        added += 1;
      }
    }
    if (added > 0) {
      toast.success(t("order.reorderDone"));
      router.push("/cart");
    } else {
      toast.error(t("order.reorderUnavailable"));
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={reorder}>
        <ShoppingBag aria-hidden />
        {t("order.reorder")}
      </Button>
      {cancellable ? (
        <Button variant="outline" size="sm" className="text-destructive" onClick={() => setCancelOpen(true)}>
          <XCircle aria-hidden />
          {t("order.cancel")}
        </Button>
      ) : null}
      {eligible.length ? (
        <Button variant="outline" size="sm" onClick={() => setReturnOpen(true)}>
          <RotateCcw aria-hidden />
          {t("order.returnRequest")}
        </Button>
      ) : null}
      {cancelOpen ? <CancelDialog order={o} open={cancelOpen} onOpenChange={setCancelOpen} pending={cancelOrder} /> : null}
      {returnOpen ? <ReturnDialog order={o} eligible={eligible} policy={policy} open={returnOpen} onOpenChange={setReturnOpen} /> : null}
    </div>
  );
}
