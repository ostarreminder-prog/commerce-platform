"use client";

import * as React from "react";
import { ExternalLink, Pencil, Plus, Search, Tag, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useBrandList, useDeleteBrand, useProductList, useSaveBrand } from "@repo/api-client";
import type { Brand } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Input } from "@repo/ui/components/input";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/table";
import { formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { useCan } from "@/lib/permissions";
import { useUrlState } from "@/lib/url-state";
import { BrandEditSheet, closedBrandEdit, editFromBrand, type BrandEditState } from "./brand-edit-sheet";

const DEFAULTS = { q: "", status: "all", id: "" };

/** `/brands` — merchant-managed product brands (catalog group). */
export function BrandsView() {
  const t = useTranslations("catalog.brands");
  const mt = useMsgToast();
  const canManage = useCan("products.manage");
  const [f, set] = useUrlState(DEFAULTS);
  const brands = useBrandList();
  const products = useProductList();
  const save = useSaveBrand();
  const remove = useDeleteBrand();
  const [edit, setEdit] = React.useState<BrandEditState>(closedBrandEdit);
  const [deleting, setDeleting] = React.useState<Brand | null>(null);

  const countOf = React.useCallback(
    (b: Brand) => (products.data ?? []).filter((p) => p.brand === b.name.ar).length,
    [products.data],
  );

  /* `/brands?id=<id>` deep-link (audit log / EntityLink) opens the edit sheet. */
  React.useEffect(() => {
    if (!f.id || edit.open) return;
    const b = (brands.data ?? []).find((x) => x.id === f.id);
    if (b) setEdit(editFromBrand(b));
  }, [f.id, brands.data, edit.open]);

  const q = f.q.trim().toLowerCase();
  const visible = (brands.data ?? []).filter((b) => {
    if (f.status !== "all" && b.status !== f.status) return false;
    if (!q) return true;
    return b.name.ar.toLowerCase().includes(q) || (b.name.en ?? "").toLowerCase().includes(q) || (b.website ?? "").includes(q);
  });
  const hasFilters = f.q !== "" || f.status !== "all";

  const closeEdit = (next: BrandEditState) => {
    setEdit(next);
    if (!next.open && f.id) set({ id: "" });
  };

  const submit = () => {
    save.mutate(
      [{
        id: edit.id ?? undefined,
        name: { ar: edit.nameAr.trim(), en: edit.nameEn.trim() || undefined },
        description: { ar: edit.descriptionAr.trim(), en: edit.descriptionEn.trim() || undefined },
        logo: edit.logo,
        website: edit.website.trim() || null,
        status: edit.status,
      }],
      {
        onSuccess: () => { mt.success(edit.id ? "brands.saved" : "brands.created", { name: edit.nameAr.trim() }); closeEdit(closedBrandEdit); },
        onError: (e) => mt.error(e.message === "name_taken" ? "brands.nameTaken" : "common.save.error"),
      },
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={canManage ? <Button onClick={() => setEdit({ ...closedBrandEdit, open: true })}><Plus aria-hidden />{t("newBrand")}</Button> : undefined}
      />
      <DataState
        state={brands}
        loading={<div className="space-y-4"><Skeleton className="h-10 w-full max-w-2xl" /><Skeleton className="h-64 w-full rounded-lg" /></div>}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <EmptyState
              icon={Tag}
              title={t("empty.title")}
              description={t("empty.body")}
              action={canManage ? <Button onClick={() => setEdit({ ...closedBrandEdit, open: true })}><Plus aria-hidden />{t("newBrand")}</Button> : undefined}
            />
          </Card>
        }
      >
        {() => (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
                <Input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder={t("searchPlaceholder")} aria-label={t("searchPlaceholder")} className="ps-9" />
              </div>
              <Select value={f.status} onValueChange={(v) => set({ status: v })}>
                <SelectTrigger className="sm:w-36" aria-label={t("statusLabel")}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allStatuses")}</SelectItem>
                  <SelectItem value="active">{t("status.active")}</SelectItem>
                  <SelectItem value="archived">{t("status.archived")}</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={() => set({ ...DEFAULTS })} className="self-start lg:self-auto"><X aria-hidden />{t("resetFilters")}</Button>
              ) : null}
              <span className="text-muted-foreground text-sm lg:ms-auto">{t("results", { count: visible.length })}</span>
            </div>
            {visible.length === 0 ? (
              <Card><EmptyState icon={Search} title={t("emptyFiltered.title")} description={t("emptyFiltered.body")} /></Card>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("cols.name")}</TableHead>
                      <TableHead>{t("cols.products")}</TableHead>
                      <TableHead>{t("cols.website")}</TableHead>
                      <TableHead>{t("cols.status")}</TableHead>
                      <TableHead className="w-24">{t("cols.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visible.map((b) => {
                      const count = countOf(b);
                      return (
                        <TableRow key={b.id}>
                          <TableCell>
                            <button type="button" className="flex min-w-0 items-center gap-3 text-start" onClick={() => canManage && setEdit(editFromBrand(b))}>
                              <MediaThumb url={b.logo?.url} label={b.name.ar} className="size-10" />
                              <span className="min-w-0">
                                <span className="block truncate font-medium">{b.name.ar}</span>
                                {b.name.en ? <span className="text-muted-foreground block truncate text-xs" dir="ltr">{b.name.en}</span> : null}
                              </span>
                            </button>
                          </TableCell>
                          <TableCell>
                            <Link href={`/products?brand=${encodeURIComponent(b.name.ar)}`} className="num text-primary font-medium hover:underline">
                              {formatNumber(count)}
                            </Link>
                          </TableCell>
                          <TableCell>
                            {b.website ? (
                              <a href={b.website} target="_blank" rel="noreferrer" className="text-primary inline-flex items-center gap-1 text-sm hover:underline" dir="ltr">
                                {b.website.replace(/^https?:\/\//, "")} <ExternalLink className="size-3" aria-hidden />
                              </a>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={b.status === "active" ? "success" : "secondary"}>{t(`status.${b.status}`)}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {canManage ? (
                                <>
                                  <Button variant="ghost" size="icon" className="size-8" aria-label={t("actions.edit")} onClick={() => setEdit(editFromBrand(b))}>
                                    <Pencil className="size-4" aria-hidden />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive size-8" aria-label={t("actions.delete")} onClick={() => setDeleting(b)}>
                                    <Trash2 className="size-4" aria-hidden />
                                  </Button>
                                </>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DataState>
      <BrandEditSheet edit={edit} setEdit={closeEdit} canManage={canManage} saving={save.isPending} onSubmit={submit} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        titleKey="brands.delete.title"
        bodyKey={deleting && countOf(deleting) > 0 ? "brands.delete.bodyInUse" : "brands.delete.body"}
        params={deleting ? { name: deleting.name.ar, count: countOf(deleting) } : undefined}
        confirmKey="brands.delete.cta"
        danger
        pending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate([deleting.id], {
            onSuccess: () => { mt.success("brands.deleted", { name: deleting.name.ar }); setDeleting(null); },
            onError: () => mt.error("common.save.error"),
          })
        }
      />
    </div>
  );
}
