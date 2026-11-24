"use client";

import * as React from "react";
import { Save, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useAdjustLoyalty, useCustomerList, useLoyaltyAccounts, useLoyaltySettings, useLoyaltyTransactions, useSaveLoyaltySettings,
} from "@repo/api-client";
import type { LoyaltyAccount, LoyaltyTierKey } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, type ColumnDef, TableSkeleton } from "@repo/ui/components/data-table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDateTime, formatNumber } from "@repo/ui/lib/format";
import { EntityLink } from "@/components/entity/entity-link";

const TIERS: LoyaltyTierKey[] = ["bronze", "silver", "gold"];

/** `/marketing/loyalty` — program settings + member accounts (spec §5.16). */
export function LoyaltyScreen() {
  const t = useTranslations("marketing.loyalty");
  const tc = useTranslations("common");
  const mt = useMsgToast();
  const { locale } = useAppLocale();
  const settings = useLoyaltySettings();
  const save = useSaveLoyaltySettings();
  const accounts = useLoyaltyAccounts();
  const customers = useCustomerList();
  const txns = useLoyaltyTransactions();
  const adjust = useAdjustLoyalty();
  const [form, setForm] = React.useState<{ earnRate: string; redeemRate: string; expiryDays: string; mins: Record<string, string>; perks: Record<string, string> } | null>(null);
  const [adjustFor, setAdjustFor] = React.useState<string | null>(null);
  const [delta, setDelta] = React.useState("");
  const [note, setNote] = React.useState("");

  React.useEffect(() => {
    if (!settings.data || form) return;
    const s = settings.data;
    setForm({
      earnRate: String(s.earnRate), redeemRate: String(s.redeemRate), expiryDays: String(s.expiryDays),
      mins: Object.fromEntries(s.tiers.map((x) => [x.key, String(x.minPoints)])),
      perks: Object.fromEntries(s.tiers.map((x) => [x.key, x.perks])),
    });
    /* Hydrate once — edits stay local until saved. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.data]);

  const customerName = (id: string) => customers.data?.find((c) => c.id === id)?.name ?? id;

  const columns: ColumnDef<LoyaltyAccount, unknown>[] = [
    { id: "customer", header: t("cols.customer"), cell: ({ row }) => <EntityLink type="customer" id={row.original.customerId}>{customerName(row.original.customerId)}</EntityLink> },
    { id: "points", accessorKey: "points", header: t("cols.points"), cell: ({ row }) => <span className="num font-medium">{formatNumber(row.original.points)}</span> },
    { id: "lifetime", accessorKey: "lifetimeEarned", header: t("cols.lifetime"), cell: ({ row }) => <span className="num text-muted-foreground">{formatNumber(row.original.lifetimeEarned)}</span> },
    { id: "tier", accessorKey: "tier", header: t("cols.tier"), cell: ({ row }) => <Badge variant="secondary">{t(`tiers.${row.original.tier}`)}</Badge> },
    {
      id: "actions", header: "", cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => { setAdjustFor(row.original.customerId); setDelta(""); setNote(""); }}>{t("adjust")}</Button>
      ),
    },
  ];

  const submitSettings = () => {
    if (!form || !settings.data) return;
    const patch = {
      earnRate: Number(form.earnRate), redeemRate: Number(form.redeemRate), expiryDays: Number(form.expiryDays),
      tiers: settings.data.tiers.map((x) => ({ ...x, minPoints: Number(form.mins[x.key]) || 0, perks: form.perks[x.key] ?? "" })),
    };
    if (patch.earnRate <= 0 || patch.redeemRate <= 0) { toast.error(t("rateRequired")); return; }
    save.mutate([patch], { onSuccess: () => mt.success("loyalty.saved"), onError: () => mt.error("common.save.error") });
  };

  const submitAdjust = () => {
    const pts = Number(delta);
    if (!adjustFor || !Number.isFinite(pts) || pts === 0) { toast.error(t("pointsRequired")); return; }
    if (!note.trim()) { toast.error(t("noteRequired")); return; }
    adjust.mutate([adjustFor, pts, note.trim()], {
      onSuccess: () => { mt.success("loyalty.adjusted"); setAdjustFor(null); },
      onError: () => mt.error("common.save.error"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />
      <DataState state={settings} loading={<><TableSkeleton rows={4} columns={2} /><TableSkeleton rows={6} columns={4} /></>}>
        {(s) => (
          <>
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base"><Star className="size-4" aria-hidden /> {t("settingsTitle")}</CardTitle>
                  <CardDescription>{t("settingsDescription")}</CardDescription>
                </div>
                <label htmlFor="loy-enabled" className="flex items-center gap-2 text-sm font-medium">
                  {s.enabled ? t("enabled") : t("disabled")}
                  <Switch id="loy-enabled" checked={s.enabled} onCheckedChange={(v) => save.mutate([{ enabled: v }], { onSuccess: () => mt.success("loyalty.saved") })} />
                </label>
              </CardHeader>
              {form ? (
                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="loy-earn">{t("earnRate")}</Label>
                      <Input id="loy-earn" className="num" dir="ltr" inputMode="decimal" value={form.earnRate} onChange={(e) => setForm({ ...form, earnRate: e.target.value })} />
                      <p className="text-muted-foreground text-xs">{t("earnRateHint")}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="loy-redeem">{t("redeemRate")}</Label>
                      <Input id="loy-redeem" className="num" dir="ltr" inputMode="decimal" value={form.redeemRate} onChange={(e) => setForm({ ...form, redeemRate: e.target.value })} />
                      <p className="text-muted-foreground text-xs">{t("redeemRateHint")}</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="loy-expiry">{t("expiryDays")}</Label>
                      <Input id="loy-expiry" className="num" dir="ltr" inputMode="numeric" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} />
                      <p className="text-muted-foreground text-xs">{t("expiryDaysHint")}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">{t("tiersTitle")}</h3>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {TIERS.map((k) => (
                        <div key={k} className="space-y-2 rounded-lg border p-3">
                          <p className="text-sm font-medium">{t(`tiers.${k}`)}</p>
                          <div className="space-y-1">
                            <Label htmlFor={`loy-min-${k}`} className="text-xs">{t("minPoints")}</Label>
                            <Input id={`loy-min-${k}`} className="num" dir="ltr" inputMode="numeric" value={form.mins[k] ?? "0"} onChange={(e) => setForm({ ...form, mins: { ...form.mins, [k]: e.target.value } })} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`loy-perk-${k}`} className="text-xs">{t("perks")}</Label>
                            <Input id={`loy-perk-${k}`} value={form.perks[k] ?? ""} onChange={(e) => setForm({ ...form, perks: { ...form.perks, [k]: e.target.value } })} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={submitSettings} disabled={save.isPending}><Save aria-hidden /> {tc("save")}</Button>
                </CardContent>
              ) : null}
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t("accountsTitle")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <DataState
                  state={accounts}
                  loading={<TableSkeleton rows={5} columns={5} />}
                  isEmpty={(d) => d.length === 0}
                  empty={<EmptyState title={t("noneTitle")} description={t("noneDescription")} />}
                >
                  {(data) => <DataTable columns={columns} data={data} getRowId={(a) => a.customerId} pageSize={10} />}
                </DataState>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">{t("ledgerTitle")}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <DataState
                  state={txns}
                  loading={<TableSkeleton rows={5} columns={5} />}
                  isEmpty={(d) => d.length === 0}
                  empty={<EmptyState title={t("ledgerEmptyTitle")} description={t("ledgerEmptyDescription")} />}
                >
                  {(data) => (
                    <DataTable
                      columns={[
                        { id: "at", header: t("cols.date"), cell: ({ row }) => <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(row.original.at, locale)}</span> },
                        { id: "customer", header: t("cols.customer"), cell: ({ row }) => <EntityLink type="customer" id={row.original.customerId}>{customerName(row.original.customerId)}</EntityLink> },
                        { id: "type", header: t("cols.type"), cell: ({ row }) => t(`txn.${row.original.type}`) },
                        { id: "points", header: t("cols.points"), cell: ({ row }) => <span className={cn("num font-medium", row.original.points > 0 ? "text-success" : "text-destructive")}>{row.original.points > 0 ? "+" : ""}{formatNumber(row.original.points)}</span> },
                        { id: "note", header: t("cols.note"), cell: ({ row }) => <span className="text-muted-foreground text-sm">{row.original.note ?? "—"}</span> },
                      ] as ColumnDef<(typeof data)[number], unknown>[]}
                      data={data}
                      getRowId={(x) => x.id}
                      pageSize={10}
                    />
                  )}
                </DataState>
              </CardContent>
            </Card>
          </>
        )}
      </DataState>

      <Dialog open={adjustFor !== null} onOpenChange={(o) => { if (!o) setAdjustFor(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("adjustTitle", { name: adjustFor ? customerName(adjustFor) : "" })}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="adj-pts">{t("points")}</Label>
              <Input id="adj-pts" className="num" dir="ltr" inputMode="numeric" value={delta} onChange={(e) => setDelta(e.target.value)} placeholder={t("pointsHint")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adj-note">{t("note")}</Label>
              <Textarea id="adj-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustFor(null)}>{tc("cancel")}</Button>
            <Button onClick={submitAdjust} disabled={adjust.isPending}>{t("adjustSubmit")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
