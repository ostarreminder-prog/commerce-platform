"use client";

import * as React from "react";
import { Download, FileText, Printer } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEntityRecord, useInvoiceById, useShipmentList, useStoreBySlug } from "@repo/api-client";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { PageError } from "@repo/ui/components/page-error";
import { Skeleton } from "@repo/ui/components/skeleton";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { useStoreSlug } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";
import { downloadInvoiceDoc, printInvoiceDoc, type InvoiceDocStrings } from "./invoice-doc";
import { InvoiceZatcaCard } from "./invoice-zatca";
import { FinancialSummary, IntegrityAlerts } from "./invoice-parts";
import { Field } from "./invoice-fields";

function useDocStrings(): InvoiceDocStrings {
  const t = useTranslations("invoices.doc");
  return React.useMemo(
    () => ({
      docTitle: t("docTitle"), taxInvoice: t("taxInvoice"), seller: t("seller"), billTo: t("billTo"),
      vatNo: t("vatNo"), orderNo: t("orderNo"), issueDate: t("issueDate"), number: t("number"),
      description: t("description"), qty: t("qty"), unitPrice: t("unitPrice"), vat: t("vat"), lineTotal: t("lineTotal"),
      subtotal: t("subtotal"), vatAmount: t("vatAmount"), total: t("total"), qrHint: t("qrHint"), relatedInvoice: t("relatedInvoice"),
    }),
    [t],
  );
}

export function InvoiceDetail({ id }: { id: string }) {
  const t = useTranslations("invoices");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const query = useInvoiceById(id);
  const orderQuery = useEntityRecord("order", query.data?.orderId ?? "", Boolean(query.data?.orderId));
  const originalQuery = useEntityRecord("invoice", query.data?.relatedInvoiceId ?? "", Boolean(query.data?.relatedInvoiceId));
  const retQuery = useEntityRecord("return", query.data?.returnId ?? "", Boolean(query.data?.returnId));
  const shipments = useShipmentList();
  const slug = useStoreSlug();
  const store = useStoreBySlug(slug);
  const strings = useDocStrings();

  if (query.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20" />
        <Skeleton className="h-80" />
      </div>
    );
  }
  const inv = query.data;
  if (!inv) return <PageError errorKey="404" onRetry={() => query.refetch()} />;

  const order = orderQuery.data ?? null;
  const original = originalQuery.data ?? null;
  const isCredit = inv.type === "credit_note";
  const orderShipments = (shipments.data ?? []).filter((s) => s.orderId === inv.orderId);
  /* Sale-invoice lines mirror order.items 1:1 (same order, seeded + issued the
   * same way) — index join recovers SKU/image/discount for the table. */
  const lines = inv.lines.map((l, i) => ({ line: l, item: !isCredit ? (order?.items[i] ?? null) : null }));

  const print = () => {
    if (!printInvoiceDoc(inv, store.data ?? null, strings, locale)) toast.error(t("popupBlocked"));
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("title"), href: recallListUrl("/invoices") }, { label: inv.number }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="num flex items-center gap-3 text-2xl font-semibold tracking-tight" dir="ltr">
            {inv.number}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isCredit ? "warning" : "secondary"}>{t(`type.${inv.type}`)}</Badge>
            <StatusBadge entity="invoice" field="zatcaStatus" value={inv.zatcaStatus} />
            <span className="text-muted-foreground text-sm">{formatDateTime(inv.issuedAt, locale)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={print}>
            <Printer aria-hidden />
            {t("print")}
          </Button>
          <Button variant="outline" onClick={() => { downloadInvoiceDoc(inv, store.data ?? null, strings, locale); toast.success(t("downloaded", { number: inv.number })); }}>
            <Download aria-hidden />
            {t("download")}
          </Button>
        </div>
      </div>
      <IntegrityAlerts inv={inv} original={original} />
      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("lines")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("col.description")}</TableHead>
                    <TableHead>{t("col.sku")}</TableHead>
                    <TableHead>{t("col.quantity")}</TableHead>
                    <TableHead>{t("col.unitPrice")}</TableHead>
                    <TableHead>{t("col.vat")}</TableHead>
                    <TableHead className="text-end">{t("col.total")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lines.map(({ line, item }, i) => (
                    <TableRow key={i}>
                      <TableCell className="min-w-44">
                        <span className="flex items-center gap-2">
                          {item ? <MediaThumb url={item.image?.url} label={line.description} className="size-8" /> : <FileText className="text-muted-foreground size-4" aria-hidden />}
                          <span className="min-w-0">
                            {item ? <EntityLink type="product" id={item.productId} label={item.productName[locale] ?? line.description} className="line-clamp-1" /> : line.description}
                            {item?.variantLabel ? <span className="text-muted-foreground block text-xs">{item.variantLabel}</span> : null}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="num text-muted-foreground">{item?.sku ?? "—"}</TableCell>
                      <TableCell className="num">{line.quantity}</TableCell>
                      <TableCell className="num whitespace-nowrap">{formatMoney(line.unitPrice.amount, locale)}</TableCell>
                      <TableCell className="num whitespace-nowrap">{formatMoney(line.vat.amount, locale)}</TableCell>
                      <TableCell className="num whitespace-nowrap text-end font-medium">{formatMoney(line.total.amount, locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <FinancialSummary inv={inv} order={order} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("details")}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5">
                <Field label={t("col.customer")}>
                  <EntityLink type="customer" id={inv.customerId} label={inv.customer.name} />
                </Field>
                {inv.customer.vatNumber ? (
                  <Field label={t("customerVat")}>
                    <bdi dir="ltr" className="num">{inv.customer.vatNumber}</bdi>
                  </Field>
                ) : null}
                <Field label={t("col.order")}>
                  <EntityLink type="order" id={inv.orderId} />
                </Field>
                {inv.returnId ? (
                  <Field label={t("return")}>
                    <EntityLink type="return" id={inv.returnId} />
                  </Field>
                ) : null}
                {retQuery.data ? (
                  <Field label={t("returnReason")}>{ts(`returnReasons.${retQuery.data.reason}`)}</Field>
                ) : null}
                {inv.relatedInvoiceId ? (
                  <Field label={t("relatedInvoice")}>
                    <EntityLink type="invoice" id={inv.relatedInvoiceId} className="num" />
                  </Field>
                ) : null}
                {orderShipments.map((s) => (
                  <Field key={s.id} label={t("shipment")}>
                    <EntityLink type="shipment" id={s.id} className="num" />
                  </Field>
                ))}
                <Field label={t("issuedAt")}>{formatDateTime(inv.issuedAt, locale)}</Field>
              </dl>
            </CardContent>
          </Card>
          <InvoiceZatcaCard inv={inv} />
        </div>
      </div>
    </div>
  );
}
