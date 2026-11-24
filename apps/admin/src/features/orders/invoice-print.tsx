"use client";

import { useTranslations } from "next-intl";
import type { Invoice, Order } from "@repo/contracts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";

/**
 * Print-only invoice document — `hidden` on screen, `print:block` so the
 * order page's `window.print()` emits a clean invoice instead of the UI.
 * Rendered as a sibling of the `print:hidden` app content in order-view.
 */
export function InvoicePrint({ order, invoice }: { order: Order; invoice: Invoice | undefined }) {
  const t = useTranslations("sales.order");
  const { locale, dir } = useAppLocale();
  return (
    <div dir={dir} className="hidden print:block">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("printInvoice.title")}</h1>
          <p className="num mt-1">{invoice?.number ?? `#${order.number}`}</p>
        </div>
        <div className="text-end text-sm">
          <p className="num">{formatDate(invoice?.issuedAt ?? order.createdAt, locale)}</p>
          <p className="num text-muted-foreground">#{order.number}</p>
        </div>
      </header>

      <section className="mb-6 text-sm">
        <h2 className="text-muted-foreground mb-1 text-xs font-medium">{t("printInvoice.billTo")}</h2>
        <p className="font-medium">{invoice?.customer.name ?? order.shippingAddress.recipientName}</p>
        <p>{[order.shippingAddress.city, order.shippingAddress.district, order.shippingAddress.street].filter(Boolean).join("، ")}</p>
        <bdi className="num" dir="ltr">{order.shippingAddress.phone}</bdi>
        {invoice?.customer.vatNumber ? <p className="num text-muted-foreground" dir="ltr">{invoice.customer.vatNumber}</p> : null}
      </section>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("cols.product")}</TableHead>
            <TableHead className="text-end">{t("cols.qty")}</TableHead>
            <TableHead className="text-end">{t("cols.price")}</TableHead>
            <TableHead className="text-end">{t("cols.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {order.items.map((i) => {
            const name = i.productName[locale] ?? i.productName.ar;
            return (
              <TableRow key={i.id}>
                <TableCell>{name}{i.variantLabel ? <span className="text-muted-foreground text-xs"> · {i.variantLabel}</span> : null}</TableCell>
                <TableCell className="num text-end">{formatNumber(i.quantity)}</TableCell>
                <TableCell className="num text-end">{formatMoney(i.unitPrice.amount, locale)}</TableCell>
                <TableCell className="num text-end">{formatMoney(i.lineTotal.amount, locale)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <section className="ms-auto mt-6 w-64 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">{t("summary.subtotal")}</span><span className="num">{formatMoney(order.subtotal.amount, locale)}</span></div>
        {order.discountTotal.amount ? <div className="flex justify-between"><span className="text-muted-foreground">{t("summary.discount")}</span><span className="num">{formatMoney(-order.discountTotal.amount, locale)}</span></div> : null}
        <div className="flex justify-between"><span className="text-muted-foreground">{t("summary.shipping")}</span><span className="num">{formatMoney(order.shippingTotal.amount, locale)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">{t("summary.taxIncluded")}</span><span className="num">{formatMoney(order.taxTotal.amount, locale)}</span></div>
        <div className="flex justify-between border-t pt-1 text-base font-semibold"><span>{t("summary.total")}</span><span className="num">{formatMoney(order.total.amount, locale)}</span></div>
      </section>
    </div>
  );
}
