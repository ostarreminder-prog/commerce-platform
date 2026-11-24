"use client";

import * as React from "react";
import { Handshake, Pencil, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAffiliates, useSaveAffiliate, useSetAffiliateStatus } from "@repo/api-client";
import type { Affiliate } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Banner } from "@repo/ui/components/banner";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { formatMoney, formatNumber } from "@repo/ui/lib/format";
import { useStoreRouter } from "@/lib/store-route";

type Draft = { id?: string; name: string; email: string; code: string; commissionRate: string };

/** `/marketing/affiliates` — referral partners (spec §5.18). */
export function AffiliatesScreen() {
  const t = useTranslations("marketing.affiliates");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const affiliates = useAffiliates();
  const save = useSaveAffiliate();
  const setStatus = useSetAffiliateStatus();
  const [draft, setDraft] = React.useState<Draft | null>(null);

  const submit = () => {
    const d = draft;
    if (!d) return;
    if (!d.name.trim()) { toast.error(t("nameRequired")); return; }
    if (!d.code.trim()) { toast.error(t("codeRequired")); return; }
    const rate = Number(d.commissionRate);
    if (!Number.isFinite(rate) || rate <= 0 || rate > 100) { toast.error(t("rateRequired")); return; }
    save.mutate([{ id: d.id, name: d.name.trim(), email: d.email.trim() || null, code: d.code.trim(), commissionRate: rate }], {
      onSuccess: () => { mt.success("affiliates.saved"); setDraft(null); },
      onError: (e) => mt.error(e.message === "taken" ? "affiliates.codeTaken" : e.message === "code" ? "affiliates.codeInvalid" : "common.save.error"),
    });
  };

  const columns: ColumnDef<Affiliate, unknown>[] = [
    { id: "name", accessorKey: "name", header: t("cols.name"), cell: ({ row }) => <span className="font-medium">{row.original.name}</span> },
    { id: "code", accessorKey: "code", header: t("cols.code"), cell: ({ row }) => <bdi dir="ltr" className="num font-mono text-sm">{row.original.code}</bdi> },
    { id: "rate", header: t("cols.rate"), cell: ({ row }) => <span className="num">{formatNumber(row.original.commissionRate)}%</span> },
    { id: "clicks", header: t("cols.clicks"), cell: ({ row }) => <span className="num text-muted-foreground">{formatNumber(row.original.stats.clicks)}</span> },
    { id: "orders", header: t("cols.orders"), cell: ({ row }) => <span className="num">{formatNumber(row.original.stats.orders)}</span> },
    { id: "revenue", header: t("cols.revenue"), cell: ({ row }) => <span className="num text-muted-foreground">{formatMoney(row.original.stats.revenue.amount, locale)}</span> },
    { id: "commission", header: t("cols.commission"), cell: ({ row }) => <span className="num font-medium">{formatMoney(row.original.stats.commission.amount, locale)}</span> },
    { id: "status", accessorKey: "status", header: t("cols.status"), cell: ({ row }) => <Badge variant={row.original.status === "active" ? "success" : "secondary"}>{t(`status.${row.original.status}`)}</Badge> },
    {
      id: "actions", header: "", cell: ({ row }) => (
        /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stops row-click navigation from firing on action buttons */
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => setDraft({ id: row.original.id, name: row.original.name, email: row.original.email ?? "", code: row.original.code, commissionRate: String(row.original.commissionRate) })}>
            <Pencil className="size-3.5" aria-hidden /> {t("edit")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStatus.mutate([row.original.id, row.original.status === "active" ? "paused" : "active"], { onSuccess: () => mt.success("affiliates.saved") })}>
            {row.original.status === "active" ? t("pause") : t("resume")}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} actions={<Button onClick={() => setDraft({ name: "", email: "", code: "", commissionRate: "10" })}><Plus aria-hidden /> {t("new")}</Button>} />
      <Banner variant="info">{t("payoutsNote")}</Banner>
      <DataState
        state={affiliates}
        loading={<TableSkeleton rows={6} columns={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={Handshake} title={t("noneTitle")} description={t("noneDescription")} action={<Button onClick={() => setDraft({ name: "", email: "", code: "", commissionRate: "10" })}><Plus aria-hidden /> {t("new")}</Button>} /></Card>}
      >
        {(data) => <Card className="p-0"><DataTable columns={columns} data={data} getRowId={(a) => a.id} pageSize={15} onRowClick={(a) => router.push(`/marketing/affiliates/${a.id}`)} /></Card>}
      </DataState>

      <Dialog open={Boolean(draft)} onOpenChange={(o) => { if (!o) setDraft(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{draft?.id ? t("editTitle") : t("newTitle")}</DialogTitle></DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="af-name">{t("form.name")}</Label>
                  <Input id="af-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="af-email">{t("form.email")}</Label>
                  <Input id="af-email" dir="ltr" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="af-code">{t("form.code")}</Label>
                  <Input id="af-code" dir="ltr" className="font-mono uppercase" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="af-rate">{t("form.commissionRate")}</Label>
                  <Input id="af-rate" dir="ltr" className="num" inputMode="decimal" value={draft.commissionRate} onChange={(e) => setDraft({ ...draft, commissionRate: e.target.value })} />
                  <p className="text-muted-foreground text-xs">{t("form.rateHint")}</p>
                </div>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>{tc("cancel")}</Button>
            <Button onClick={submit} disabled={save.isPending}>{tc("save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
