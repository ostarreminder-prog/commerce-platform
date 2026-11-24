"use client";

import * as React from "react";
import { ChevronDown, ChevronLeft, FolderTree, GripVertical, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useCategoryList, useDeleteCategory, useMoveCategory, useProductList, useSaveCategory, type CategoryInput } from "@repo/api-client";
import type { Category } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { EmptyState } from "@repo/ui/components/empty-state";
import { Card } from "@repo/ui/components/card";
import { PageHeader } from "@repo/ui/components/page-header";
import { Skeleton } from "@repo/ui/components/skeleton";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";
import Link from "@/components/store-link";
import { useCan } from "@/lib/permissions";
import { CategoryEditSheet, closedCategoryEdit, type CategoryEditState } from "@/features/catalog/category-edit-sheet";

function depthOf(c: Category, all: Category[]): number {
  let d = 1;
  let cur = c.parentId;
  while (cur) {
    d += 1;
    cur = all.find((x) => x.id === cur)?.parentId ?? null;
  }
  return d;
}

export function CategoriesView() {
  const t = useTranslations("catalog.categories");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();
  const canManage = useCan("products.manage");
  const categories = useCategoryList();
  const products = useProductList();
  const save = useSaveCategory();
  const move = useMoveCategory();
  const del = useDeleteCategory();
  const searchParams = useSearchParams();
  const [edit, setEdit] = React.useState<CategoryEditState>(closedCategoryEdit);
  const [deleteTarget, setDeleteTarget] = React.useState<Category | null>(null);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const [overRoot, setOverRoot] = React.useState(false);

  const all = categories.data ?? [];
  const countFor = React.useCallback(
    (id: string) => (products.data ?? []).filter((p) => p.categoryIds.includes(id)).length,
    [products.data],
  );
  const childrenOf = (parentId: string | null) => all.filter((c) => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  const openEdit = React.useCallback((c: Category | null, parentId: string | null = null) =>
    setEdit(
      c
        ? { open: true, id: c.id, parentId: c.parentId, nameAr: c.name.ar, nameEn: c.name.en ?? "", descriptionAr: c.description.ar, sortOrder: String(c.sortOrder), seoTitle: c.seo.title, seoDescription: c.seo.description, image: c.image }
        : { ...closedCategoryEdit, open: true, parentId },
    ), []);

  /* Deep link `/categories?id=<id>` (EntityLink) opens the node's edit sheet. */
  React.useEffect(() => {
    const want = searchParams.get("id");
    if (!want) return;
    const c = categories.data?.find((x) => x.id === want);
    if (c) openEdit(c);
  }, [searchParams, categories.data, openEdit]);

  const submit = () => {
    if (!edit.nameAr.trim()) { toast.error(t("nameRequired")); return; }
    const input: CategoryInput = {
      id: edit.id ?? undefined, parentId: edit.parentId, name: { ar: edit.nameAr.trim(), en: edit.nameEn.trim() || undefined },
      description: { ar: edit.descriptionAr }, sortOrder: Number(edit.sortOrder) || 0,
      seo: { title: edit.seoTitle || edit.nameAr, description: edit.seoDescription },
      image: edit.image,
    };
    save.mutate([input], {
      onSuccess: () => { toast.success(t("saved")); setEdit(closedCategoryEdit); },
      onError: (e) => toast.error(e.message === "cycle" || e.message === "depth" ? t("invalidParent") : t("saveFailed")),
    });
  };

  const dropOn = (targetId: string | null) => {
    setOverId(null);
    setOverRoot(false);
    if (!dragId || !canManage) return;
    const dragged = all.find((c) => c.id === dragId);
    if (!dragged || dragged.id === targetId) return;
    const parentSort = all.filter((c) => c.parentId === targetId).length;
    move.mutate([dragId, targetId, parentSort], {
      onSuccess: () => toast.success(t("moved")),
      onError: () => toast.error(t("moveFailed")),
    });
    setDragId(null);
  };

  const Node = ({ c, level }: { c: Category; level: number }) => {
    const kids = childrenOf(c.id);
    const isCollapsed = collapsed.has(c.id);
    return (
      <li>
        <div
          draggable={canManage}
          onDragStart={() => setDragId(c.id)}
          onDragEnd={() => { setDragId(null); setOverId(null); setOverRoot(false); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverId(c.id); }}
          onDragLeave={() => setOverId((x) => (x === c.id ? null : x))}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); dropOn(c.id); }}
          className={cn(
            "group flex items-center gap-2 rounded-md border bg-card px-3 py-2",
            dragId === c.id && "opacity-40",
            overId === c.id && "border-primary ring-primary/30 ring-2",
          )}
        >
          {canManage ? <GripVertical className="text-muted-foreground size-4 shrink-0 cursor-grab" aria-hidden /> : null}
          {kids.length ? (
            <button type="button" aria-label={isCollapsed ? t("expand") : t("collapse")} onClick={() => setCollapsed((s) => { const n = new Set(s); if (isCollapsed) { n.delete(c.id); } else { n.add(c.id); } return n; })} className="text-muted-foreground hover:text-foreground">
              {isCollapsed ? <ChevronLeft className="size-4 rtl:rotate-180" /> : <ChevronDown className="size-4" />}
            </button>
          ) : (
            <span className="size-4" />
          )}
          <button type="button" onClick={() => openEdit(c)} className="min-w-0 flex-1 truncate text-start text-sm font-medium hover:underline">
            {c.name[locale] ?? c.name.ar}
          </button>
          <Link href={`/products?category=${c.id}`} className="num text-muted-foreground hover:text-primary text-xs">
            {t("productsCount", { count: formatNumber(countFor(c.id)) })}
          </Link>
          {canManage && level < 4 ? (
            <Button variant="ghost" size="sm" className="h-7 opacity-0 group-hover:opacity-100" onClick={() => openEdit(null, c.id)}>
              <Plus aria-hidden />{t("addChild")}
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" className="h-7" onClick={() => openEdit(c)}>{tc("edit")}</Button>
          {canManage ? (
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive size-7" onClick={() => setDeleteTarget(c)} aria-label={tc("delete")}>
              <Trash2 className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
        {kids.length && !isCollapsed ? (
          <ul className="ms-6 mt-1.5 space-y-1.5 border-s ps-3">
            {kids.map((k) => <Node key={k.id} c={k} level={level + 1} />)}
          </ul>
        ) : null}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={canManage ? <Button onClick={() => openEdit(null)}><Plus aria-hidden />{t("newCategory")}</Button> : undefined}
      />
      <DataState
        state={categories}
        loading={<div className="space-y-2">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}</div>}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <EmptyState
              icon={FolderTree}
              title={t("noneTitle")}
              description={t("noneDescription")}
              action={canManage ? <Button onClick={() => openEdit(null)}><Plus aria-hidden />{t("newCategory")}</Button> : undefined}
            />
          </Card>
        }
      >
        {() => (
          <div
            onDragOver={(e) => { e.preventDefault(); setOverRoot(true); }}
            onDragLeave={() => setOverRoot(false)}
            onDrop={(e) => { e.preventDefault(); dropOn(null); }}
            className={cn("space-y-1.5 rounded-lg border-2 border-transparent p-1", overRoot && "border-primary/40 border-dashed")}
          >
            <ul className="space-y-1.5">
              {childrenOf(null).map((c) => <Node key={c.id} c={c} level={1} />)}
            </ul>
            {canManage ? <p className="text-muted-foreground px-2 py-2 text-xs">{t("dragHint")}</p> : null}
          </div>
        )}
      </DataState>

      <CategoryEditSheet edit={edit} setEdit={setEdit} all={all} depthOf={depthOf} canManage={canManage} saving={save.isPending} onSubmit={submit} />

      {deleteTarget ? (
        <ConfirmDialog
          open
          onOpenChange={(v) => !v && setDeleteTarget(null)}
          title={t("deleteTitle")}
          body={
            <>
              {t("deleteDescription")}
              {countFor(deleteTarget.id) > 0 ? (
                <span className="text-destructive mt-2 block">{t("deleteProductsWarning", { count: formatNumber(countFor(deleteTarget.id)) })}</span>
              ) : null}
            </>
          }
          confirmLabel={t("confirmDelete")}
          danger
          pending={del.isPending}
          onConfirm={() =>
            del.mutate([deleteTarget.id], {
              onSuccess: () => {
                toast.success(t("deleted"));
                setDeleteTarget(null);
                setEdit((e) => (e.id === deleteTarget.id ? closedCategoryEdit : e));
              },
              onError: () => toast.error(t("failed")),
            })
          }
        />
      ) : null}
    </div>
  );
}
