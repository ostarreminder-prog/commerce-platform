"use client";

import * as React from "react";
import { AlertTriangle, QrCode, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useInvoiceAttempts, useResendInvoice } from "@repo/api-client";
import type { Invoice } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime } from "@repo/ui/lib/format";
import { useCan } from "@/lib/permissions";
import { Field } from "./invoice-fields";

export function InvoiceZatcaCard({ inv }: { inv: Invoice }) {
  const t = useTranslations("invoices.zatcaZone");
  const { locale } = useAppLocale();
  const attempts = useInvoiceAttempts(inv.id);
  const resend = useResendInvoice();
  const canResend = useCan("orders.manage");
  const [confirm, setConfirm] = React.useState(false);
  const eligible = inv.zatcaStatus === "rejected" || inv.zatcaStatus === "pending";
  const lastError = inv.zatcaErrors[0] ?? null;
  const list = attempts.data ?? [];

  const submit = () =>
    resend.mutate([inv.id], {
      onSuccess: (r) => {
        setConfirm(false);
        if (r.attempt.result === "rejected") toast.error(t("rejectedAgain", { number: inv.number, reason: r.attempt.detail ?? "" }));
        else toast.success(t("reported", { number: inv.number }));
      },
      onError: (e) => toast.error((e as Error).message === "not_resendable" ? t("notEligible") : t("failed")),
    });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{t("title")}</CardTitle>
        <Badge variant="outline">{t("simulated")}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-2.5">
          <Field label={t("status")}>
            <StatusBadge entity="invoice" field="zatcaStatus" value={inv.zatcaStatus} />
          </Field>
          <Field label={t("invoiceNumber")}>
            <bdi dir="ltr" className="num">{inv.number}</bdi>
          </Field>
          <Field label={t("lastSent")}>
            <span className="text-muted-foreground">{list[0] ? formatDateTime(list[0].at, locale) : formatDateTime(inv.issuedAt, locale)}</span>
          </Field>
        </dl>
        {inv.zatcaErrors.length ? (
          <div className="border-destructive/40 bg-destructive/5 flex items-start gap-2 rounded-md border p-3 text-sm">
            <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
            <ul className="list-disc space-y-0.5 ps-4">
              {inv.zatcaErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex items-center gap-3">
          <span className="bg-muted text-muted-foreground flex size-14 shrink-0 items-center justify-center rounded-lg border">
            <QrCode className="size-7" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("qrData")}</p>
            <bdi dir="ltr" className="num text-muted-foreground block truncate text-xs">{inv.qrCode || "—"}</bdi>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">{t("attempts")}</p>
          {attempts.isPending ? (
            <p className="text-muted-foreground text-sm">{t("loading")}</p>
          ) : list.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t("noAttempts")}</p>
          ) : (
            <ol className="space-y-2">
              {list.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
                  <span className="flex min-w-0 flex-col">
                    <StatusBadge entity="invoice" field="zatcaStatus" value={a.result} />
                    {a.detail ? <span className="text-muted-foreground mt-0.5 truncate text-xs">{a.detail}</span> : null}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-end text-xs">
                    {formatDateTime(a.at, locale)}
                    <span className="block">{a.actor.name}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
        {canResend && eligible ? (
          <Button variant="outline" className="w-full" onClick={() => setConfirm(true)}>
            <Send aria-hidden />
            {t("resend")}
          </Button>
        ) : null}
      </CardContent>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("resendTitle", { number: inv.number })}
        body={lastError ? t("resendBodyError", { number: inv.number, reason: lastError }) : t("resendBody", { number: inv.number })}
        confirmLabel={t("resend")}
        pending={resend.isPending}
        onConfirm={submit}
      />
    </Card>
  );
}
