"use client";

import * as React from "react";
import { Copy, FileText, Link2, MoreHorizontal, Pencil, Printer, RotateCcw, Undo2, Truck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  canEditOrder, useCouponList, useInvoiceList, useOrderById, useOrderPayments, useOrderRefunds,
  useProductList, useSendPaymentLink, useShipmentList,
} from "@repo/api-client";
import type { Order } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { EmptyState } from "@repo/ui/components/empty-state";
import { ErrorState } from "@repo/ui/components/error-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { recallListUrl } from "@/lib/url-state";
import { AddressDialog, CancelDialog, RefundDialog, ShipmentDialog } from "./order-dialogs";
import { OrderChannelIcon } from "@repo/ui/components/order-channel-icon";
import { OrderTimeline } from "./order-timeline";
import { OrderItemsCard } from "./order-items-card";
import { OrderPaymentsCard } from "./order-payments-card";
import { OrderDigitalCard } from "./order-digital-card";
import { OrderShipmentsCard } from "./order-shipments-card";
import { OrderMetaCards } from "./order-meta-cards";
import { OrderSidebar } from "./order-sidebar";
import { InvoicePrint } from "./invoice-print";
import { printShippingLabels } from "./print-labels";
import { EditOrderDialog } from "./order-edit-dialog";

type DialogName = "refund" | "cancel" | "shipment" | "address" | "edit" | null;

function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2"><Skeleton className="h-64" /><Skeleton className="h-48" /><Skeleton className="h-72" /></div>
        <div className="space-y-6"><Skeleton className="h-48" /><Skeleton className="h-40" /></div>
      </div>
    </div>
  );
}

function Detail({ order }: { order: Order }) {
  const t = useTranslations("sales.order");
  const ts = useTranslations("sales");
  const tch = useTranslations("channels");
  const { locale, dir } = useAppLocale();
  const canManage = useCan("orders.manage");
  const canRefund = useCan("orders.refund");
  const [dialog, setDialog] = React.useState<DialogName>(null);
  const payments = useOrderPayments(order.id);
  const refunds = useOrderRefunds(order.id);
  const shipments = useShipmentList();
  const invoices = useInvoiceList();
  const coupons = useCouponList();
  const products = useProductList();
  const sendLink = useSendPaymentLink();

  const paid = (payments.data ?? []).filter((p) => p.status === "captured").reduce((s, p) => s + p.amount.amount, 0)
    || (["paid", "partially_refunded", "refunded", "cod_collected"].includes(order.paymentStatus) ? order.total.amount : 0);
  const refunded = (refunds.data ?? []).filter((r) => r.status === "succeeded").reduce((s, r) => s + r.amount.amount, 0);
  const orderShipments = (shipments.data ?? []).filter((s) => s.orderId === order.id);
  const invoice = invoices.data?.find((i) => i.id === order.invoiceId) ?? invoices.data?.find((i) => i.orderId === order.id && i.type !== "credit_note");
  const coupon = coupons.data?.find((c) => c.code === order.couponCode);
  const closed = order.status === "cancelled";
  const shipped = order.fulfillmentStatus === "shipped" || order.fulfillmentStatus === "delivered";
  const editable = canEditOrder(order);
  /* Returns are created against delivered orders (the mock eligibility check
   * also enforces the merchant's window policy). */
  const returnable = !closed && (order.fulfillmentStatus === "delivered" || order.fulfillmentStatus === "shipped");
  const copyOrderData = () => {
    const summary = [
      `#${order.number}`, order.createdAt,
      order.items.map((i) => `${i.sku} ×${i.quantity}`).join(" | "),
      `total ${(order.total.amount / 100).toFixed(2)} SAR`,
      `${order.shippingAddress.recipientName} — ${order.shippingAddress.city} — ${order.shippingAddress.phone}`,
    ].join("\n");
    void navigator.clipboard?.writeText(summary).then(() => toast.success(t("copied"))).catch(() => toast.error(t("copyFailed")));
  };
  /* Digital/service items (requiresShipping=false) never enter the shipment
   * flow — the same gate the mock server enforces in createShipment. */
  const requiresShipping = (i: Order["items"][number]) => products.data?.find((p) => p.id === i.productId)?.requiresShipping !== false;
  const canShip = !closed && order.items.some((i) => requiresShipping(i) && i.fulfilledQty < i.quantity);
  const labelStrings = {
    order: t("labelFields.order"), to: t("labelFields.to"), cod: t("labelFields.cod"),
    weight: t("labelFields.weight"), tracking: t("labelFields.tracking"), label: t("labelFields.label"), packages: t("labelFields.packages"),
  };

  return (
    <>
    <div className="space-y-6 pb-8 print:hidden">
      <div>
        <Breadcrumbs items={[{ label: ts("orders.title"), href: recallListUrl("/orders") }, { label: `#${order.number}` }]} />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="num text-2xl font-semibold tracking-tight">#{order.number}</h1>
              <StatusBadge entity="order" field="paymentStatus" value={order.paymentStatus} />
              <StatusBadge entity="order" field="fulfillmentStatus" value={order.fulfillmentStatus} />
            </div>
            <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm">
              <OrderChannelIcon channel={order.channel} />
              {tch(order.channel)}
              {order.agentId ? <>· <EntityLink type="agent" id={order.agentId} /></> : null}
              · <span title={formatDateTime(order.createdAt, locale)}>{formatDateTime(order.createdAt, locale)}</span>
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {canShip ? <Button onClick={() => setDialog("shipment")}><Truck aria-hidden />{t("actions.createShipment")}</Button> : null}
              {editable ? <Button variant="outline" onClick={() => setDialog("edit")}><Pencil aria-hidden />{t("actions.edit")}</Button> : null}
              {returnable ? (
                <Button variant="outline" asChild><Link href={`/returns/new?order=${order.id}`}><Undo2 aria-hidden />{t("actions.createReturn")}</Link></Button>
              ) : null}
              {canRefund && paid - refunded > 0 ? (
                <Button variant="outline" onClick={() => setDialog("refund")}><RotateCcw aria-hidden />{t("actions.refund")}</Button>
              ) : null}
              {!closed && !shipped ? (
                <Button variant="outline" className="text-destructive" onClick={() => setDialog("cancel")}><XCircle aria-hidden />{t("actions.cancel")}</Button>
              ) : null}
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline"><Printer aria-hidden />{t("actions.print")}</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled={!invoice} onSelect={() => window.print()}><FileText aria-hidden />{t("actions.printInvoice")}</DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={!orderShipments.length}
                    onSelect={() => { if (!printShippingLabels(orderShipments.map((shipment) => ({ order, shipment })), labelStrings, dir)) toast.error(t("popupBlocked")); }}
                  >
                    <Truck aria-hidden />{t("actions.printLabel")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" size="icon" aria-label={t("actions.more")}><MoreHorizontal aria-hidden /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/orders/new?duplicate=${order.id}`}><Copy aria-hidden />{t("actions.duplicate")}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={copyOrderData}><Copy aria-hidden />{t("actions.copyData")}</DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={paid >= order.total.amount || closed || sendLink.isPending}
                    onSelect={() => sendLink.mutate([order.id], { onSuccess: () => toast.success(t("paymentLinkSent")), onError: () => toast.error(t("paymentLinkFailed")) })}
                  >
                    <Link2 aria-hidden />{t("actions.sendPaymentLink")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      </div>

      {closed && order.cancelReason ? (
        <div className="border-destructive/30 bg-destructive/5 flex items-start gap-3 rounded-lg border p-4 text-sm">
          <XCircle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t("cancelledBanner", { reason: ts(`cancelReasons.${order.cancelReason.code}`) })}</p>
            {order.cancelReason.text ? <p className="text-muted-foreground mt-1">{order.cancelReason.text}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <OrderItemsCard order={order} paid={paid} refunded={refunded} coupon={coupon} />
          <OrderPaymentsCard order={order} />
          <OrderShipmentsCard order={order} canManage={canManage} canShip={canShip} onCreateShipment={() => setDialog("shipment")} />
          <OrderDigitalCard order={order} />
          <OrderMetaCards order={order} />
          <Card>
            <CardHeader><CardTitle className="text-base">{t("timeline")}</CardTitle></CardHeader>
            <CardContent><OrderTimeline order={order} /></CardContent>
          </Card>
        </div>

        <OrderSidebar order={order} canManage={canManage} onEditAddress={() => setDialog("address")} />
      </div>

      <RefundDialog order={order} open={dialog === "refund"} onOpenChange={(o) => setDialog(o ? "refund" : null)} paid={paid} refunded={refunded} />
      <CancelDialog order={order} open={dialog === "cancel"} onOpenChange={(o) => setDialog(o ? "cancel" : null)} />
      <ShipmentDialog order={order} open={dialog === "shipment"} onOpenChange={(o) => setDialog(o ? "shipment" : null)} />
      <AddressDialog order={order} open={dialog === "address"} onOpenChange={(o) => setDialog(o ? "address" : null)} />
      <EditOrderDialog order={order} open={dialog === "edit"} onOpenChange={(o) => setDialog(o ? "edit" : null)} />
    </div>
    <InvoicePrint order={order} invoice={invoice} />
    </>
  );
}

export function OrderView({ id }: { id: string }) {
  const t = useTranslations("sales.order");
  const query = useOrderById(id);
  return (
    <DataState
      state={query}
      loading={<Loading />}
      error={(retry) => {
        const notFound = String((query.error as Error | null)?.message ?? "").includes("not found");
        return notFound ? (
          <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button asChild variant="outline"><Link href="/orders">{t("backToOrders")}</Link></Button>} /></Card>
        ) : (
          <ErrorState onRetry={retry ?? undefined} />
        );
      }}
    >
      {(order) => <Detail order={order} />}
    </DataState>
  );
}
