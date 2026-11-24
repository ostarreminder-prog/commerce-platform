"use client";

import * as React from "react";
import { Gift, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCustomerList, useGiftCards, useIssueGiftCard } from "@repo/api-client";
import type { GiftCard } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney } from "@repo/ui/lib/format";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl } from "@/lib/url-state";

/** `/marketing/gift-cards` — issue + track stored-value cards (spec §5.17). */
export function GiftCardsScreen() {
  const t = useTranslations("marketing.giftCards");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const cards = useGiftCards();
  const customers = useCustomerList();
  const issue = useIssueGiftCard();
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [customerId, setCustomerId] = React.useState("none");
  const [expires, setExpires] = React.useState("");

  React.useEffect(() => { rememberListUrl("/marketing/gift-cards", "/marketing/gift-cards"); }, []);

  const customerName = (id: string | null) => (id ? (customers.data?.find((c) => c.id === id)?.name ?? id) : "—");

  const submit = () => {
    const halalas = Math.round(Number(amount) * 100);
    if (!Number.isFinite(halalas) || halalas <= 0) { toast.error(t("amountRequired")); return; }
    issue.mutate([{ code: code.trim() || undefined, initialBalance: halalas, customerId: customerId === "none" ? null : customerId, expiresAt: expires || null }], {
      onSuccess: (c) => { mt.success("giftCards.issued"); setOpen(false); router.push(`/marketing/gift-cards/${c.id}`); },
      onError: (e) => mt.error(e.message === "taken" ? "giftCards.codeTaken" : "common.save.error"),
    });
  };

  const columns: ColumnDef<GiftCard, unknown>[] = [
    { id: "code", accessorKey: "code", header: t("cols.code"), cell: ({ row }) => <bdi dir="ltr" className="num font-mono text-sm font-medium">{row.original.code}</bdi> },
    { id: "balance", accessorFn: (c) => c.balance.amount, header: t("cols.balance"), cell: ({ row }) => <span className="num font-medium">{formatMoney(row.original.balance.amount, locale)}</span> },
    { id: "initial", header: t("cols.initial"), cell: ({ row }) => <span className="num text-muted-foreground">{formatMoney(row.original.initialBalance.amount, locale)}</span> },
    { id: "customer", header: t("cols.customer"), cell: ({ row }) => <span className="text-muted-foreground">{customerName(row.original.customerId)}</span> },
    { id: "status", accessorKey: "status", header: t("cols.status"), cell: ({ row }) => <Badge variant={row.original.status === "active" || row.original.status === "partially_used" ? "success" : row.original.status === "deactivated" ? "destructive" : "secondary"}>{t(`status.${row.original.status}`)}</Badge> },
    { id: "expires", header: t("cols.expires"), cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.expiresAt ? formatDate(row.original.expiresAt, locale) : "—"}</span> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<Button onClick={() => { setCode(""); setAmount(""); setCustomerId("none"); setExpires(""); setOpen(true); }}><Plus aria-hidden /> {t("issue")}</Button>} />
      <DataState
        state={cards}
        loading={<TableSkeleton rows={8} columns={6} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={Gift} title={t("noneTitle")} description={t("noneDescription")} action={<Button onClick={() => setOpen(true)}><Plus aria-hidden /> {t("issue")}</Button>} /></Card>}
      >
        {(data) => <Card className="p-0"><DataTable columns={columns} data={data} getRowId={(c) => c.id} pageSize={15} onRowClick={(c) => router.push(`/marketing/gift-cards/${c.id}`)} /></Card>}
      </DataState>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("issueTitle")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gc-code">{t("form.code")}</Label>
              <Input id="gc-code" dir="ltr" className="font-mono uppercase" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("form.codeHint")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gc-amount">{t("form.amount")}</Label>
              <Input id="gc-amount" dir="ltr" className="num" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gc-customer">{t("form.customer")}</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger id="gc-customer"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("form.noCustomer")}</SelectItem>
                  {(customers.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gc-exp">{t("form.expires")}</Label>
              <Input id="gc-exp" type="date" dir="ltr" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{tc("cancel")}</Button>
            <Button onClick={submit} disabled={issue.isPending}>{t("issueSubmit")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
