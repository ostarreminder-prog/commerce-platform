"use client";

import * as React from "react";
import { BadgePercent, Pencil, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeletePromotion, usePromotionList, useSavePromotion, useSetPromotionStatus, type PromotionInput } from "@repo/api-client";
import type { Promotion, PromotionType } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@repo/ui/components/dropdown-menu";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { PageHeader } from "@repo/ui/components/page-header";
import { RadioGroup, RadioGroupItem } from "@repo/ui/components/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatDate, formatMoney, formatNumber } from "@repo/ui/lib/format";
import { MoreHorizontal } from "lucide-react";
import { Actor } from "@/components/entity/actor";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useCan } from "@/lib/permissions";
import { toHalalas } from "@repo/ui/lib/money";

const TYPES: PromotionType[] = ["percentage", "fixed_amount", "free_shipping", "buy_x_get_y"];

function benefitText(p: Promotion, locale: "ar" | "en", buyXGetY: (buy: number, get: number) => string, freeShip: string) {
  switch (p.benefit.kind) {
    case "percentage": return `${formatNumber(p.benefit.value ?? 0)}%`;
    case "amount": return formatMoney(p.benefit.value ?? 0, locale);
    case "free_shipping": return freeShip;
    case "buy_x_get_y": return p.config ? buyXGetY(p.config.buy, p.config.get) : "—";
  }
}

function PromotionForm({ initial, onSubmit, pending, submitLabel }: { initial: Partial<PromotionInput>; onSubmit: (v: PromotionInput) => void; pending: boolean; submitLabel: string }) {
  const t = useTranslations("marketing.promotions.form");
  const [v, setV] = React.useState<Partial<PromotionInput>>(initial);
  const set = (p: Partial<PromotionInput>) => setV((x) => ({ ...x, ...p }));
  const type = v.type ?? "percentage";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="pm-name-ar">{t("nameAr")}</Label><Input id="pm-name-ar" value={v.name?.ar ?? ""} onChange={(e) => set({ name: { ar: e.target.value, en: v.name?.en ?? "" } })} /></div>
        <div className="space-y-1.5"><Label htmlFor="pm-name-en">{t("nameEn")}</Label><Input id="pm-name-en" dir="ltr" value={v.name?.en ?? ""} onChange={(e) => set({ name: { ar: v.name?.ar ?? "", en: e.target.value } })} /></div>
      </div>
      <div className="space-y-1.5">
        <Label>{t("type")}</Label>
        <RadioGroup
          value={type}
          onValueChange={(x) => {
            const k = x as PromotionType;
            set({ type: k, benefit: { kind: k === "percentage" ? "percentage" : k === "fixed_amount" ? "amount" : k === "free_shipping" ? "free_shipping" : "buy_x_get_y", value: k === "percentage" ? 10 : k === "fixed_amount" ? 5000 : null } });
          }}
          className="grid grid-cols-2 gap-2"
        >
          {TYPES.map((k) => (
            <Label key={k} className={cn("flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm", type === k && "border-primary bg-primary/5")}>
              <RadioGroupItem value={k} />{t(`types.${k}`)}
            </Label>
          ))}
        </RadioGroup>
      </div>
      {type === "percentage" || type === "fixed_amount" ? (
        <div className="space-y-1.5">
          <Label htmlFor="pm-value">{type === "percentage" ? t("percent") : t("amount")}</Label>
          <Input
            id="pm-value"
            inputMode="decimal"
            dir="ltr"
            className="num"
            value={type === "fixed_amount" ? ((v.benefit?.value ?? 0) / 100) : (v.benefit?.value ?? "")}
            onChange={(e) => set({ benefit: { kind: v.benefit?.kind ?? "percentage", value: type === "fixed_amount" ? toHalalas(e.target.value) : Number(e.target.value) || 0 } })}
          />
        </div>
      ) : null}
      {type === "buy_x_get_y" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label htmlFor="pm-buy">{t("buyQty")}</Label><Input id="pm-buy" inputMode="numeric" dir="ltr" className="num" value={v.config?.buy ?? 2} onChange={(e) => set({ config: { buy: Number(e.target.value) || 1, get: v.config?.get ?? 1 } })} /></div>
          <div className="space-y-1.5"><Label htmlFor="pm-get">{t("getQty")}</Label><Input id="pm-get" inputMode="numeric" dir="ltr" className="num" value={v.config?.get ?? 1} onChange={(e) => set({ config: { buy: v.config?.buy ?? 2, get: Number(e.target.value) || 1 } })} /></div>
        </div>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label htmlFor="pm-start">{t("startsAt")}</Label><Input id="pm-start" type="date" dir="ltr" value={(v.startsAt ?? "").slice(0, 10)} onChange={(e) => set({ startsAt: e.target.value || new Date().toISOString() })} /></div>
        <div className="space-y-1.5"><Label htmlFor="pm-end">{t("endsAt")}</Label><Input id="pm-end" type="date" dir="ltr" value={(v.endsAt ?? "").slice(0, 10)} onChange={(e) => set({ endsAt: e.target.value || null })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(v as PromotionInput)} disabled={pending || !v.name?.ar?.trim() || !v.startsAt}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );
}

export function PromotionsList() {
  const t = useTranslations("marketing.promotions");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const canManage = useCan("marketing.manage");
  const promos = usePromotionList();
  const save = useSavePromotion();
  const setStatus = useSetPromotionStatus();
  const del = useDeletePromotion();
  const [dialog, setDialog] = React.useState<{ mode: "new" } | { mode: "edit"; p: Promotion } | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Promotion | null>(null);
  const [status, setStatusF] = React.useState("all");

  const visible = (promos.data ?? []).filter((p) => status === "all" || p.status === status);

  const columns = React.useMemo<ColumnDef<Promotion, unknown>[]>(() => [
    { id: "name", accessorFn: (p) => p.name.ar, header: t("cols.name"), cell: ({ row }) => <span className="font-medium">{row.original.name[locale] ?? row.original.name.ar}</span> },
    { id: "type", header: t("cols.type"), cell: ({ row }) => <span className="text-sm">{t(`types.${row.original.type}`)}</span> },
    { id: "benefit", header: t("cols.benefit"), cell: ({ row }) => <span className="num">{benefitText(row.original, locale, (b, g) => t("buyXGetY", { buy: b, get: g }), t("freeShipping"))}</span> },
    { id: "period", header: t("cols.period"), cell: ({ row }) => <span className="num text-muted-foreground whitespace-nowrap text-xs">{formatDate(row.original.startsAt, locale)} ← {row.original.endsAt ? formatDate(row.original.endsAt, locale) : "∞"}</span> },
    { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="coupon" value={row.original.status} /> },
    { id: "orders", header: t("cols.orders"), cell: ({ row }) => <span className="num">{formatNumber(row.original.stats.orders)}</span> },
    { id: "revenue", header: t("cols.revenue"), cell: ({ row }) => <span className="num whitespace-nowrap">{formatMoney(row.original.stats.revenue.amount, locale)}</span> },
    { id: "actor", header: t("cols.by"), cell: ({ row }) => <Actor actor={row.original.createdBy} /> },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => canManage ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={tc("actions")}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setDialog({ mode: "edit", p: row.original })}><Pencil aria-hidden />{tc("edit")}</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setStatus.mutate([row.original.id, row.original.status !== "disabled"], { onSuccess: () => toast.success(t("toggled")) })}>{row.original.status === "disabled" ? t("activate") : t("deactivate")}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteTarget(row.original)}><Trash2 aria-hidden />{t("delete")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null,
    },
  ], [t, tc, locale, canManage, setStatus]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Select value={status} onValueChange={setStatusF}>
              <SelectTrigger className="w-36" aria-label={t("filters.status")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.all")}</SelectItem>
                {(["active", "scheduled", "expired", "disabled"] as const).map((s) => <SelectItem key={s} value={s}>{t(`statuses.${s}`)}</SelectItem>)}
              </SelectContent>
            </Select>
            {canManage ? <Button onClick={() => setDialog({ mode: "new" })}><Plus aria-hidden />{t("new")}</Button> : null}
          </>
        }
      />
      <DataState
        state={promos}
        loading={<TableSkeleton rows={6} columns={8} />}
        isEmpty={(d) => d.length === 0}
        empty={<Card><EmptyState icon={BadgePercent} title={t("noneTitle")} description={t("noneDescription")} action={canManage ? <Button onClick={() => setDialog({ mode: "new" })}><Plus aria-hidden />{t("new")}</Button> : undefined} /></Card>}
      >
        {() => (
          <>
            <div className="hidden md:block">
              <DataTable columns={columns} data={visible} getRowId={(p) => p.id} pageSize={15} />
            </div>
            <div className="space-y-3 md:hidden">
              {visible.map((p) => (
                <div key={p.id} className="bg-card rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{p.name[locale] ?? p.name.ar}</p>
                    <StatusBadge entity="coupon" value={p.status} />
                  </div>
                  <p className="num text-muted-foreground mt-1 text-sm">{benefitText(p, locale, (b, g) => t("buyXGetY", { buy: b, get: g }), t("freeShipping"))}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </DataState>

      <Dialog open={dialog !== null} onOpenChange={(v) => !v && setDialog(null)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? t("editTitle") : t("newTitle")}</DialogTitle>
            <DialogDescription>{t("formDescription")}</DialogDescription>
          </DialogHeader>
          <PromotionForm
            initial={dialog?.mode === "edit"
              ? { id: dialog.p.id, name: { ar: dialog.p.name.ar, en: dialog.p.name.en ?? "" }, type: dialog.p.type, benefit: dialog.p.benefit, config: dialog.p.config, startsAt: dialog.p.startsAt.slice(0, 10), endsAt: dialog.p.endsAt?.slice(0, 10) ?? null }
              : { name: { ar: "", en: "" }, type: "percentage", benefit: { kind: "percentage", value: 10 }, config: null, startsAt: new Date().toISOString().slice(0, 10), endsAt: null }}
            pending={save.isPending}
            submitLabel={dialog?.mode === "edit" ? tc("save") : t("create")}
            onSubmit={(v) => save.mutate([v], { onSuccess: () => { toast.success(dialog?.mode === "edit" ? t("saved") : t("created")); setDialog(null); }, onError: () => toast.error(t("failed")) })}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={deleteTarget !== null} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("deleteTitle")}</DialogTitle><DialogDescription>{t("deleteDescription")}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{tc("cancel")}</Button>
            <Button variant="destructive" disabled={del.isPending} onClick={() => deleteTarget && del.mutate([deleteTarget.id], { onSuccess: () => { toast.success(t("deleted")); setDeleteTarget(null); } })}>{t("confirmDelete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
