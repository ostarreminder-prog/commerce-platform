"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import type { Coupon, Order } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Separator } from "@repo/ui/components/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";
import { MediaThumb } from "@repo/ui/components/media-thumb";

function Row({ label, children, strong }: { label: React.ReactNode; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between gap-4 text-base font-semibold" : "flex justify-between gap-4 text-sm"}>
      <span className={strong ? undefined : "text-muted-foreground"}>{label}</span>
      <span className="num">{children}</span>
    </div>
  );
}

export function OrderItemsCard({ order, paid, refunded, coupon }: { order: Order; paid: number; refunded: number; coupon: Coupon | undefined }) {
  const t = useTranslations("sales.order");
  const { locale } = useAppLocale();
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("items")}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("cols.product")}</TableHead>
                <TableHead>{t("cols.sku")}</TableHead>
                <TableHead className="text-end">{t("cols.qty")}</TableHead>
                <TableHead className="text-end">{t("cols.price")}</TableHead>
                <TableHead className="text-end">{t("cols.discount")}</TableHead>
                <TableHead className="text-end">{t("cols.total")}</TableHead>
                <TableHead>{t("cols.fulfillment")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((i) => {
                const name = i.productName[locale] ?? i.productName.ar;
                return (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="flex min-w-48 items-center gap-3">
                        <MediaThumb url={i.image?.url} label={name} />
                        <div className="min-w-0">
                          <EntityLink type="product" id={i.productId} label={name} className="line-clamp-2" />
                          {i.variantLabel ? <p className="text-muted-foreground text-xs">{i.variantLabel}</p> : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="num text-muted-foreground text-xs" dir="ltr">{i.sku}</TableCell>
                    <TableCell className="num text-end">{formatNumber(i.quantity)}</TableCell>
                    <TableCell className="num whitespace-nowrap text-end">{formatMoney(i.unitPrice.amount, locale)}</TableCell>
                    <TableCell className="num whitespace-nowrap text-end">{i.discount.amount ? formatMoney(-i.discount.amount, locale) : "—"}</TableCell>
                    <TableCell className="num whitespace-nowrap text-end font-medium">{formatMoney(i.lineTotal.amount, locale)}</TableCell>
                    <TableCell>
                      <Badge variant={i.returnedQty ? "secondary" : i.fulfilledQty >= i.quantity ? "success" : i.fulfilledQty ? "info" : "warning"} className="num whitespace-nowrap">
                        {i.returnedQty ? t("line.returned", { n: i.returnedQty }) : t("line.fulfilled", { n: i.fulfilledQty, of: i.quantity })}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-2 border-t p-4 sm:ms-auto sm:max-w-sm">
          <Row label={t("summary.subtotal")}>{formatMoney(order.subtotal.amount, locale)}</Row>
          {order.discountTotal.amount ? (
            <Row label={<>{t("summary.discount")} {order.couponCode ? <>(<EntityLink type="coupon" id={coupon?.id ?? order.couponCode} label={order.couponCode} className="num" />)</> : null}</>}>
              {formatMoney(-order.discountTotal.amount, locale)}
            </Row>
          ) : null}
          <Row label={t("summary.shipping")}>{order.shippingTotal.amount ? formatMoney(order.shippingTotal.amount, locale) : t("summary.free")}</Row>
          <Row label={order.pricesIncludeTax ? t("summary.taxIncluded") : t("summary.tax")}>{formatMoney(order.taxTotal.amount, locale)}</Row>
          <Separator />
          <Row label={t("summary.total")} strong>{formatMoney(order.total.amount, locale)}</Row>
          <Row label={t("summary.paid")}>{formatMoney(paid, locale)}</Row>
          {refunded ? <Row label={t("summary.refunded")}>{formatMoney(-refunded, locale)}</Row> : null}
          <Row label={t("summary.balance")}>{formatMoney(Math.max(0, order.total.amount - paid), locale)}</Row>
        </div>
      </CardContent>
    </Card>
  );
}
