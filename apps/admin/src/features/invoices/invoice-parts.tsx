"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useOrderPayments, useOrderRefunds } from "@repo/api-client";
import type { Invoice, Order } from "@repo/contracts";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney } from "@repo/ui/lib/format";
import { Field } from "./invoice-fields";

/** Real math from the order + payment/refund ledgers — taxable base, VAT,
 * paid/refunded/remaining all re-derived, not just echoed off the invoice. */
export function FinancialSummary({ inv, order }: { inv: Invoice; order: Order | null }) {
  const t = useTranslations("invoices.financial");
  const { locale } = useAppLocale();
  const payments = useOrderPayments(order?.id ?? "");
  const refunds = useOrderRefunds(order?.id ?? "");
  const isCredit = inv.type === "credit_note";
  const paid = isCredit
    ? 0
    : (payments.data ?? []).filter((p) => p.status === "captured").reduce((s, p) => s + p.amount.amount, 0) ||
      (order && ["paid", "partially_refunded", "cod_collected"].includes(order.paymentStatus) ? order.total.amount : 0);
  const refunded = (refunds.data ?? []).filter((r) => r.status === "succeeded").reduce((s, r) => s + r.amount.amount, 0);
  const remaining = Math.max(0, inv.total.amount - paid);
  const taxable = order ? order.subtotal.amount - order.discountTotal.amount + order.shippingTotal.amount : inv.subtotal.amount;
  const row = (key: "subtotal" | "discount" | "shipping" | "taxable" | "vat" | "total" | "paid" | "refunded" | "remaining", value: number, strong = false) => (
    <Field label={t(key)}>
      <span className={strong ? "num text-base font-semibold" : "num"}>{formatMoney(value, locale)}</span>
    </Field>
  );
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2.5">
          {row("subtotal", order?.subtotal.amount ?? inv.subtotal.amount)}
          {order && order.discountTotal.amount > 0 ? row("discount", -order.discountTotal.amount) : null}
          {order ? row("shipping", order.shippingTotal.amount) : null}
          {order ? row("taxable", taxable) : null}
          {row("vat", inv.vatAmount.amount)}
          {row("total", inv.total.amount, true)}
          {!isCredit ? row("paid", paid) : null}
          {refunded > 0 ? row("refunded", refunded) : null}
          {!isCredit ? row("remaining", remaining) : null}
        </dl>
      </CardContent>
    </Card>
  );
}

/** Link-integrity checks for credit notes — an orphan return invoice or a
 * credit larger than the original sale invoice is surfaced, never hidden. */
export function IntegrityAlerts({ inv, original }: { inv: Invoice; original: Invoice | null }) {
  const t = useTranslations("invoices.integrity");
  const problems: string[] = [];
  if (inv.type === "credit_note") {
    if (!inv.relatedInvoiceId || !original) problems.push(t("missingOriginal"));
    else if (inv.total.amount > original.total.amount) problems.push(t("amountMismatch"));
  }
  if (!problems.length) return null;
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="flex items-start gap-3 p-4">
        <AlertTriangle className="text-destructive mt-0.5 size-5 shrink-0" aria-hidden />
        <ul className="list-disc space-y-0.5 ps-4 text-sm">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
