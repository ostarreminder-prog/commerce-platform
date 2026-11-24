"use client";

import * as React from "react";
import { Download, Plus, Tag, Trash2, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCustomerList, useCustomerSegments, useCustomersAddTag, useCustomersRemoveTag } from "@repo/api-client";
import type { Customer } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, DataTableColumnHeader, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { Input } from "@repo/ui/components/input";
import { PageHeader } from "@repo/ui/components/page-header";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { toast } from "@repo/ui/components/toaster";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatDate, formatMoney, formatNumber, formatRelativeTime } from "@repo/ui/lib/format";
import { NOW } from "@repo/api-client";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { useCan } from "@/lib/permissions";
import { useStoreRouter } from "@/lib/store-route";
import { rememberListUrl, useScrollRestore, useUrlState } from "@/lib/url-state";
import { DEFAULTS, matchesCustomer } from "./customer-filters";
import { CustomersToolbar } from "./customers-toolbar";
import { NewCustomerDialog } from "./new-customer-dialog";
import { exportCsv } from "./customer-utils";
export { CustomerProfile } from "./customer-profile";

export function CustomersList() {
  const t = useTranslations("customers");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const canManage = useCan("customers.manage");
  const canExport = useCan("customers.export");
  const [f, set] = useUrlState(DEFAULTS);
  const customers = useCustomerList();
  const savedSegments = useCustomerSegments();
  const addTag = useCustomersAddTag();
  const removeTag = useCustomersRemoveTag();
  const [newOpen, setNewOpen] = React.useState(false);
  const mt = useMsgToast();
  const [exportOpen, setExportOpen] = React.useState(false);
  const [tag, setTag] = React.useState("");
  useScrollRestore(customers.isSuccess);
  React.useEffect(() => { rememberListUrl("/customers", `/customers${window.location.search}`); }, [f]);

  const q = f.q.trim().toLowerCase();
  const saved = savedSegments.data ?? [];
  const visible = (customers.data ?? []).filter((c) => matchesCustomer(c, f, saved, q));

  const columns = React.useMemo<ColumnDef<Customer, unknown>[]>(() => [
    {
      id: "name",
      accessorFn: (c) => c.name ?? c.phone,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.name")} />,
      cell: ({ row }) => <EntityLink type="customer" id={row.original.id} />,
    },
    { id: "phone", header: t("cols.phone"), cell: ({ row }) => <bdi dir="ltr" className="num text-muted-foreground">{row.original.phone}</bdi> },
    { id: "email", accessorFn: (c) => c.email ?? "", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.email")} />, cell: ({ row }) => <bdi dir="ltr" className="text-muted-foreground text-sm">{row.original.email ?? "—"}</bdi> },
    { id: "city", header: t("cols.city"), cell: ({ row }) => <span className="text-muted-foreground">{row.original.addresses[0]?.city ?? "—"}</span> },
    { id: "registered", accessorFn: (c) => c.createdAt, header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.registered")} />, cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{formatDate(row.original.createdAt, locale)}</span> },
    { id: "orders", accessorFn: (c) => c.stats.ordersCount, header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.orders")} />, cell: ({ row }) => <span className="num">{formatNumber(row.original.stats.ordersCount)}</span> },
    { id: "spent", accessorFn: (c) => c.stats.totalSpent.amount, header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.totalSpent")} />, cell: ({ row }) => <span className="num whitespace-nowrap">{formatMoney(row.original.stats.totalSpent.amount, locale)}</span> },
    { id: "avg", accessorFn: (c) => c.stats.avgOrder.amount, header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.avgOrder")} />, cell: ({ row }) => <span className="num whitespace-nowrap">{formatMoney(row.original.stats.avgOrder.amount, locale)}</span> },
    { id: "last", accessorFn: (c) => c.stats.lastOrderAt ?? "", header: ({ column }) => <DataTableColumnHeader column={column} title={t("cols.lastOrder")} />, cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{row.original.stats.lastOrderAt ? formatRelativeTime(row.original.stats.lastOrderAt, locale, NOW) : "—"}</span> },
    { id: "segment", header: t("cols.segment"), cell: ({ row }) => <StatusBadge entity="customer" field="segment" value={row.original.segment} /> },
    { id: "source", header: t("cols.source"), cell: ({ row }) => <span className="text-muted-foreground text-sm">{t(`sources.${row.original.source}`)}</span> },
    {
      id: "tags",
      header: t("cols.tags"),
      cell: ({ row }) => (
        <span className="flex max-w-40 flex-wrap gap-1">
          {row.original.tags.length ? row.original.tags.map((tag) => <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>) : <span className="text-muted-foreground">—</span>}
        </span>
      ),
    },
    {
      id: "consent",
      header: t("cols.consent"),
      cell: ({ row }) => row.original.marketingConsent.whatsapp ? <Badge variant="success" className="font-normal">WhatsApp</Badge> : <span className="text-muted-foreground">—</span>,
    },
  ], [t, locale]);

  const bulkActions = (rows: Customer[], clear: () => void) => {
    const selectedTags = [...new Set(rows.flatMap((c) => c.tags))];
    return (
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild><Button size="sm" variant="outline"><Tag aria-hidden />{t("bulk.addTag")}</Button></PopoverTrigger>
          <PopoverContent className="w-64">
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!tag.trim()) return; addTag.mutate([rows.map((c) => c.id), tag.trim()], { onSuccess: () => { toast.success(t("bulk.tagged", { count: rows.length })); setTag(""); clear(); } }); }}>
              <Input value={tag} onChange={(e) => setTag(e.target.value)} aria-label={t("bulk.addTag")} />
              <Button type="submit" size="sm">{t("bulk.apply")}</Button>
            </form>
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild><Button size="sm" variant="outline" disabled={!selectedTags.length}><Trash2 aria-hidden />{t("bulk.removeTag")}</Button></PopoverTrigger>
          <PopoverContent className="w-56">
            <p className="text-muted-foreground mb-2 text-xs">{t("bulk.pickTag")}</p>
            <ul className="space-y-1">
              {selectedTags.map((tg) => (
                <li key={tg}>
                  <button type="button" className="hover:bg-accent/40 flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm" onClick={() => removeTag.mutate([rows.map((c) => c.id), tg], { onSuccess: () => { toast.success(t("bulk.untagged", { count: rows.length, tag: tg })); clear(); } })}>
                    <span>{tg}</span><Trash2 className="text-muted-foreground size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            {canExport ? <Button variant="outline" onClick={() => setExportOpen(true)} disabled={!visible.length}><Download aria-hidden />{t("export")}</Button> : null}
            {canManage ? <Button onClick={() => setNewOpen(true)}><Plus aria-hidden />{t("newCustomer")}</Button> : null}
          </>
        }
      />
      {customers.data?.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["total", "vip", "returning", "atRisk"] as const).map((key) => {
            const count = key === "total" ? customers.data.length : customers.data.filter((c) => c.segment === (key === "atRisk" ? "at_risk" : key)).length;
            return (
              <Card key={key}>
                <div className="p-3">
                  <p className="text-muted-foreground text-xs">{t(`summary.${key}`)}</p>
                  <p className="num mt-1 text-lg font-semibold">{formatNumber(count)}</p>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
      <DataState
        state={customers}
        loading={<TableSkeleton rows={10} columns={10} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><MsgEmptyState emptyKey="customers" icon={UserRound} action={canManage ? <Button onClick={() => setNewOpen(true)}><Plus aria-hidden />{t("newCustomer")}</Button> : undefined} /></Card>}
      >
        {() => (
          <div className="space-y-4">
            <CustomersToolbar f={f} set={set} saved={saved} visibleCount={visible.length} />
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={visible}
                getRowId={(c) => c.id}
                enableRowSelection={canManage}
                pageSize={15}
                onRowClick={(c) => router.push(`/customers/${c.id}`)}
                bulkActions={bulkActions}
              />
            </div>
            <div className="space-y-3 md:hidden">
              {visible.map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`} className="bg-card hover:bg-accent/40 block rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{c.name ?? c.phone}</p>
                      <bdi dir="ltr" className="num text-muted-foreground text-xs">{c.phone}</bdi>
                    </div>
                    <StatusBadge entity="customer" field="segment" value={c.segment} />
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("cols.orders")}: <span className="num">{formatNumber(c.stats.ordersCount)}</span></span>
                    <span className="num font-medium">{formatMoney(c.stats.totalSpent.amount, locale)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </DataState>
      <NewCustomerDialog open={newOpen} onOpenChange={setNewOpen} />
      <ConfirmDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        titleKey="customers.export.title"
        bodyKey="customers.export.body"
        confirmLabel={t("exportConfirm")}
        onConfirm={() => { exportCsv(visible); mt.success("common.export.started"); }}
      />
    </div>
  );
}
