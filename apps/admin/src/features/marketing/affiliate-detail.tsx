"use client";

import * as React from "react";
import { Banknote } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useAffiliate, useAffiliateConversions, useAffiliatePayouts, useCreateAffiliatePayout, useMarkAffiliatePayoutPaid,
} from "@repo/api-client";
import type { AffiliateConversion, AffiliatePayout } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDateTime, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";

export function AffiliateDetail() {
  const t = useTranslations("marketing.affiliates");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const params = useParams<{ id: string }>();
  const affiliate = useAffiliate(params.id);
  const conversions = useAffiliateConversions(params.id);
  const payouts = useAffiliatePayouts(params.id);
  const createPayout = useCreateAffiliatePayout();
  const markPaid = useMarkAffiliatePayoutPaid();
  const [payOpen, setPayOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [note, setNote] = React.useState("");

  if (affiliate.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  const a = affiliate.data;
  if (!a) {
    return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push(recallListUrl("/marketing/affiliates"))}>{t("backToList")}</Button>} /></Card>;
  }
  const pending = a.stats.commission.amount - (payouts.data ?? []).reduce((s, p) => s + p.amount.amount, 0);

  const submitPayout = () => {
    const halalas = Math.round(Number(amount) * 100);
    if (!Number.isFinite(halalas) || halalas <= 0) { toast.error(t("payoutAmountRequired")); return; }
    createPayout.mutate([a.id, halalas, note.trim() || undefined], {
      onSuccess: () => { mt.success("affiliates.payoutCreated"); setPayOpen(false); },
      onError: (e) => mt.error(e.message === "amount" ? "affiliates.payoutExceeds" : "common.save.error"),
    });
  };

  const conversionCols: ColumnDef<AffiliateConversion, unknown>[] = [
    { id: "at", header: t("cols.date"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(row.original.at, locale)}</span> },
    { id: "order", header: t("cols.order"), cell: ({ row }) => <EntityLink type="order" id={row.original.orderId} label={`#${formatNumber(row.original.orderNumber)}`} /> },
    { id: "total", header: t("cols.total"), cell: ({ row }) => <span className="num">{formatMoney(row.original.total.amount, locale)}</span> },
    { id: "commission", header: t("cols.commission"), cell: ({ row }) => <span className="num font-medium">{formatMoney(row.original.commission.amount, locale)}</span> },
  ];
  const payoutCols: ColumnDef<AffiliatePayout, unknown>[] = [
    { id: "at", header: t("cols.date"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(row.original.createdAt, locale)}</span> },
    { id: "amount", header: t("cols.amount"), cell: ({ row }) => <span className="num font-medium">{formatMoney(row.original.amount.amount, locale)}</span> },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <Badge variant={row.original.status === "paid" ? "success" : "warning"}>{t(`payout.${row.original.status}`)}</Badge> },
    { id: "note", header: t("cols.note"), cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.note ?? "—"}</span> },
    {
      id: "actions", header: "", cell: ({ row }) => (row.original.status === "pending" ? (
        <Button variant="ghost" size="sm" onClick={() => markPaid.mutate([row.original.id], { onSuccess: () => mt.success("affiliates.payoutPaid") })}>{t("markPaid")}</Button>
      ) : null),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("title"), href: recallListUrl("/marketing/affiliates") }, { label: a.name }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-semibold">{a.name}</h1>
        <Badge variant={a.status === "active" ? "success" : "secondary"}>{t(`status.${a.status}`)}</Badge>
        <bdi dir="ltr" className="num text-muted-foreground font-mono text-sm">{a.code}</bdi>
        <Button variant="outline" className="ms-auto" onClick={() => { setAmount((Math.max(pending, 0) / 100).toString()); setNote(""); setPayOpen(true); }}>
          <Banknote className="size-4" aria-hidden /> {t("createPayout")}
        </Button>
      </div>
      <Banner variant="info">{t("payoutsNote")}</Banner>

      <div className="grid gap-3 sm:grid-cols-5">
        {([
          [t("stats.clicks"), formatNumber(a.stats.clicks)],
          [t("stats.orders"), formatNumber(a.stats.orders)],
          [t("stats.revenue"), formatMoney(a.stats.revenue.amount, locale)],
          [t("stats.commission"), formatMoney(a.stats.commission.amount, locale)],
          [t("stats.pendingPayout"), formatMoney(Math.max(pending, 0), locale)],
        ] as const).map(([label, val]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-muted-foreground text-xs">{label}</p><p className="num mt-1 text-lg font-semibold">{val}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("conversionsTitle")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataState state={conversions} loading={<TableSkeleton rows={4} columns={4} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t("conversionsEmpty")} />}>
            {(data) => <DataTable columns={conversionCols} data={data} getRowId={(x) => x.id} pageSize={10} />}
          </DataState>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("payoutsTitle")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataState state={payouts} loading={<TableSkeleton rows={3} columns={5} />} isEmpty={(d) => d.length === 0} empty={<EmptyState title={t("payoutsEmpty")} />}>
            {(data) => <DataTable columns={payoutCols} data={data} getRowId={(x) => x.id} pageSize={10} />}
          </DataState>
        </CardContent>
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("payoutTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="po-amount">{t("form.amount")}</Label>
              <Input id="po-amount" dir="ltr" className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <p className="text-muted-foreground text-xs">{t("payoutHint", { amount: formatMoney(Math.max(pending, 0), locale) })}</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="po-note">{t("form.note")}</Label>
              <Input id="po-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>{tc("cancel")}</Button>
            <Button onClick={submitPayout} disabled={createPayout.isPending}>{t("payoutSubmit")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
