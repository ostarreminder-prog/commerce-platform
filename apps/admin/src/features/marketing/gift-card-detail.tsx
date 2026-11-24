"use client";

import * as React from "react";
import { Ban } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCustomerList, useDeactivateGiftCard, useGiftCard, useGiftCardTransactions } from "@repo/api-client";
import type { GiftCardTransaction } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime, formatMoney } from "@repo/ui/lib/format";
import { Actor } from "@/components/entity/actor";
import { Breadcrumbs } from "@/components/entity/breadcrumbs";
import { EntityLink } from "@/components/entity/entity-link";
import { useStoreRouter } from "@/lib/store-route";
import { recallListUrl } from "@/lib/url-state";

export function GiftCardDetail() {
  const t = useTranslations("marketing.giftCards");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const params = useParams<{ id: string }>();
  const card = useGiftCard(params.id);
  const txns = useGiftCardTransactions(params.id);
  const customers = useCustomerList();
  const deactivate = useDeactivateGiftCard();
  const [deactivateOpen, setDeactivateOpen] = React.useState(false);

  if (card.isPending) return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64" /></div>;
  const c = card.data;
  if (!c) {
    return <Card><EmptyState title={t("notFoundTitle")} description={t("notFoundDescription")} action={<Button variant="outline" onClick={() => router.push(recallListUrl("/marketing/gift-cards"))}>{t("backToList")}</Button>} /></Card>;
  }
  const customer = c.customerId ? customers.data?.find((x) => x.id === c.customerId) : null;
  const spent = c.initialBalance.amount - c.balance.amount;

  const columns: ColumnDef<GiftCardTransaction, unknown>[] = [
    { id: "at", accessorKey: "at", header: t("cols.date"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(row.original.at, locale)}</span> },
    { id: "type", header: t("cols.type"), cell: ({ row }) => t(`txn.${row.original.type}`) },
    { id: "amount", header: t("cols.amount"), cell: ({ row }) => <span className={cn("num font-medium", row.original.amount < 0 ? "text-destructive" : "text-success")}>{row.original.amount > 0 ? "+" : ""}{formatMoney(row.original.amount, locale)}</span> },
    { id: "balance", header: t("cols.balance"), cell: ({ row }) => <span className="num">{formatMoney(row.original.balanceAfter.amount, locale)}</span> },
    { id: "order", header: t("cols.order"), cell: ({ row }) => (row.original.orderId ? <EntityLink type="order" id={row.original.orderId} /> : <span className="text-muted-foreground">—</span>) },
    { id: "actor", header: t("cols.actor"), cell: ({ row }) => <Actor actor={row.original.actor} /> },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: t("title"), href: recallListUrl("/marketing/gift-cards") }, { label: c.code }]} />
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-xl font-semibold" dir="ltr">{c.code}</h1>
        <Badge variant={c.status === "active" || c.status === "partially_used" ? "success" : c.status === "deactivated" ? "destructive" : "secondary"}>{t(`status.${c.status}`)}</Badge>
        {c.status === "active" || c.status === "partially_used" ? (
          <Button variant="outline" className="ms-auto" onClick={() => setDeactivateOpen(true)}><Ban className="size-4" aria-hidden /> {t("deactivate")}</Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {([
          [t("stats.balance"), formatMoney(c.balance.amount, locale)],
          [t("stats.initial"), formatMoney(c.initialBalance.amount, locale)],
          [t("stats.spent"), formatMoney(spent, locale)],
          [t("stats.expires"), c.expiresAt ? formatDateTime(c.expiresAt, locale) : t("stats.noExpiry")],
        ] as const).map(([label, val]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-muted-foreground text-xs">{label}</p><p className="num mt-1 text-lg font-semibold">{val}</p></CardContent></Card>
        ))}
      </div>
      <p className="text-muted-foreground text-sm">
        {customer ? t("holder", { name: customer.name ?? "" }) : t("holderUnassigned")} · {t("issuedBy", { name: c.issuedBy.name ?? "" })} · <span className="num">{formatDateTime(c.createdAt, locale)}</span>
      </p>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("ledgerTitle")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataState
            state={txns}
            loading={<TableSkeleton rows={4} columns={6} />}
            isEmpty={(d) => d.length === 0}
            empty={<EmptyState title={t("ledgerEmptyTitle")} description={t("ledgerEmptyDescription")} />}
          >
            {(data) => <DataTable columns={columns} data={data} getRowId={(x) => x.id} pageSize={10} />}
          </DataState>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        titleKey="giftCards.deactivateTitle"
        bodyKey="giftCards.deactivateBody"
        confirmLabel={t("deactivate")}
        danger
        pending={deactivate.isPending}
        onConfirm={() => deactivate.mutate([c.id], { onSuccess: () => { mt.success("giftCards.deactivated"); setDeactivateOpen(false); } })}
      />
    </div>
  );
}
