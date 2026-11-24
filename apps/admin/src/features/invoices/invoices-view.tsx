"use client";

import * as React from "react";
import { BadgeCheck, FileMinus, FileText, Percent, QrCode, Receipt, Search, TriangleAlert, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { PERIODS, useInvoiceList, useOrderList, useTaxSettings } from "@repo/api-client";
import type { Invoice } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Checkbox } from "@repo/ui/components/checkbox";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, TableSkeleton } from "@repo/ui/components/data-table";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { StatCard } from "@repo/ui/components/stat-card";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { useStoreRouter } from "@/lib/store-route";
import { DEFAULTS, buildRows, filterRows, hasFilters, type IssueStatus } from "./invoices-utils";
import { useInvoiceColumns } from "./invoices-columns";

const TYPES: Invoice["type"][] = ["simplified", "standard", "credit_note"];
const ZATCA: Invoice["zatcaStatus"][] = ["pending", "reported", "cleared", "rejected"];
const ISSUE_STATUSES: IssueStatus[] = ["issued", "paid", "unpaid", "partially_refunded", "refunded", "cancelled"];

function ZatcaBanner() {
  const t = useTranslations("invoices");
  const settings = useTaxSettings();
  const status = settings.data?.zatcaStatus ?? "not_connected";
  const connected = status === "connected";
  return (
    <Card className={connected ? "border-success/30 bg-success/5" : "border-warning/40 bg-warning/5"}>
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${connected ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
          {connected ? <QrCode className="size-5" aria-hidden /> : <TriangleAlert className="size-5" aria-hidden />}
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">{connected ? t("zatcaTitle") : t("zatcaOffTitle")}</p>
          <p className="text-muted-foreground text-sm">{connected ? t("zatcaText") : t("zatcaOffText")}</p>
        </div>
        <Badge variant={connected ? "success" : "warning"} className="gap-1 self-start sm:self-center">
          <BadgeCheck className="size-3.5" aria-hidden />
          {t(`zatcaConn.${status}`)}
        </Badge>
      </div>
    </Card>
  );
}

export function InvoicesView() {
  const t = useTranslations("invoices");
  const ts = useTranslations("sales");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const query = useInvoiceList();
  const orders = useOrderList();
  const columns = useInvoiceColumns();
  const [f, set] = useUrlState(DEFAULTS);
  const rows = React.useMemo(() => buildRows(query.data ?? [], orders.data ?? []), [query.data, orders.data]);
  const filtered = React.useMemo(() => filterRows(rows, f), [rows, f]);
  const invoices = query.data ?? [];

  useScrollRestore(query.isSuccess);
  React.useEffect(() => {
    rememberListUrl("/invoices", `/invoices${window.location.search}`);
  }, [f]);

  const total = invoices.filter((i) => i.type !== "credit_note").reduce((s, i) => s + i.total.amount, 0);
  const vat = invoices.reduce((s, i) => s + (i.type === "credit_note" ? -i.vatAmount.amount : i.vatAmount.amount), 0);
  const reset = () => set(Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, DEFAULTS[k as keyof typeof DEFAULTS]])));

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <ZatcaBanner />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("summary.total")} value={formatMoney(total, locale)} icon={Receipt} />
        <StatCard label={t("summary.vat")} value={formatMoney(vat, locale)} icon={Percent} />
        <StatCard label={t("summary.count")} value={formatNumber(invoices.filter((i) => i.type !== "credit_note").length)} icon={FileText} />
        <StatCard label={t("summary.credit")} value={formatNumber(invoices.filter((i) => i.type === "credit_note").length)} icon={FileMinus} />
      </div>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative lg:w-72">
          <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
          <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("search")} aria-label={t("search")} className="ps-9" />
        </div>
        <Select value={f.type} onValueChange={(v) => set({ type: v })}>
          <SelectTrigger className="lg:w-40" aria-label={t("col.type")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            {TYPES.map((x) => <SelectItem key={x} value={x}>{t(`type.${x}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.status} onValueChange={(v) => set({ status: v })}>
          <SelectTrigger className="lg:w-44" aria-label={t("filters.status")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            {ISSUE_STATUSES.map((x) => <SelectItem key={x} value={x}>{t(`issueStatus.${x}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.zatca} onValueChange={(v) => set({ zatca: v })}>
          <SelectTrigger className="lg:w-40" aria-label={t("col.zatca")}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            {ZATCA.map((x) => <SelectItem key={x} value={x}>{t(`zatca.${x}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={f.date} onValueChange={(v) => set({ date: v })}>
          <SelectTrigger className="lg:w-36" aria-label={t("filters.date")}><SelectValue /></SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => <SelectItem key={p} value={p}>{ts(`periods.${p}`)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Label className="flex items-center gap-2 text-sm font-normal">
          <Checkbox checked={f.returns === "1"} onCheckedChange={(v) => set({ returns: v === true ? "1" : "" })} />
          {t("filters.returns")}
        </Label>
        {hasFilters(f) ? (
          <Button variant="ghost" size="sm" onClick={reset}>
            <X aria-hidden />
            {t("filters.reset")}
          </Button>
        ) : null}
        <span className="text-muted-foreground text-sm lg:ms-auto">{t("results", { count: filtered.length })}</span>
      </div>
      <DataState state={query} loading={<TableSkeleton rows={8} columns={10} />}>
        {() =>
          filtered.length === 0 ? (
            <Card>
              <MsgEmptyState emptyKey="invoices" icon={FileText} />
            </Card>
          ) : (
            <div className="hidden md:block">
              <DataTable columns={columns} data={filtered} getRowId={(r) => r.invoice.id} pageSize={12} onRowClick={(r) => router.push(`/invoices/${r.invoice.id}`)} />
            </div>
          )
        }
      </DataState>
    </div>
  );
}
