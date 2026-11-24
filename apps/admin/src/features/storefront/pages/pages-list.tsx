"use client";

import * as React from "react";
import { ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeletePage, useMenus, usePageList } from "@repo/api-client";
import type { MenuItem, Page } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { DataTable, TableSkeleton, type ColumnDef } from "@repo/ui/components/data-table";
import { MsgEmptyState } from "@repo/ui/components/msg-empty-state";
import { PageHeader } from "@repo/ui/components/page-header";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import Link from "@/components/store-link";
import { EntityLink } from "@/components/entity/entity-link";
import { useStoreRouter } from "@/lib/store-route";

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3001";

/** Flatten menu items (one level of children) — used for the used-in-menu delete warning. */
const flatItems = (items: MenuItem[]): MenuItem[] => items.flatMap((i) => [i, ...i.children]);

export function PagesList() {
  const t = useTranslations("storefront.pages");
  const { locale } = useAppLocale();
  const router = useStoreRouter();
  const mt = useMsgToast();
  const list = usePageList();
  const { data: menus = [] } = useMenus();
  const remove = useDeletePage();
  const [deleteTarget, setDeleteTarget] = React.useState<Page | null>(null);

  /* Menus referencing a page — shown in the delete confirm as a usage warning. */
  const menusUsing = React.useCallback(
    (pageId: string) =>
      menus
        .filter((m) => flatItems(m.items).some((i) => i.linkType === "page" && i.targetId === pageId))
        .map((m) => t(`menuLocations.${m.location}`)),
    [menus, t],
  );

  const columns = React.useMemo<ColumnDef<Page, unknown>[]>(
    () => [
      {
        id: "title",
        accessorKey: "title",
        header: t("cols.title"),
        cell: ({ row }) => <EntityLink type="page" id={row.original.id} label={row.original.title[locale] ?? row.original.title.ar} />,
      },
      {
        id: "slug",
        header: t("cols.slug"),
        cell: ({ row }) => (
          <code dir="ltr" className="text-muted-foreground text-xs">
            /pages/{row.original.slug}
          </code>
        ),
      },
      { id: "status", header: t("cols.status"), cell: ({ row }) => <StatusBadge entity="page" value={row.original.status} /> },
      {
        id: "inMenu",
        header: t("cols.inMenu"),
        cell: ({ row }) =>
          row.original.showInMenu ? (
            <Badge variant="secondary" className="font-normal">
              {t("inMenu")}
            </Badge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" asChild aria-label={t("preview")}>
              <a href={`${STOREFRONT_URL}/pages/${row.original.slug}`} target="_blank" rel="noopener noreferrer" title={t("preview")} onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive size-8"
              aria-label={t("delete")}
              title={t("delete")}
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(row.original);
              }}
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [t, locale],
  );

  const usedBy = deleteTarget ? menusUsing(deleteTarget.id) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button asChild>
            <Link href="/storefront/pages/new">
              <Plus aria-hidden />
              {t("new")}
            </Link>
          </Button>
        }
      />
      <DataState
        state={list}
        loading={<TableSkeleton rows={5} columns={5} />}
        isEmpty={(d) => d.length === 0}
        empty={
          <Card>
            <MsgEmptyState
              emptyKey="pages"
              icon={FileText}
              action={
                <Button asChild>
                  <Link href="/storefront/pages/new">
                    <Plus aria-hidden />
                    {t("new")}
                  </Link>
                </Button>
              }
            />
          </Card>
        }
      >
        {(pages) => (
          <div className="hidden sm:block">
            <DataTable columns={columns} data={pages} getRowId={(p) => p.id} pageSize={15} onRowClick={(p) => router.push(`/storefront/pages/${p.id}`)} />
          </div>
        )}
      </DataState>
      <div className="space-y-3 sm:hidden">
        {(list.data ?? []).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => router.push(`/storefront/pages/${p.id}`)}
            className="bg-card hover:bg-accent/40 flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-start"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{p.title[locale] ?? p.title.ar}</p>
              <p className="text-muted-foreground truncate text-xs" dir="ltr">
                /pages/{p.slug}
              </p>
            </div>
            <StatusBadge entity="page" value={p.status} />
          </button>
        ))}
      </div>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        titleKey="pages.delete.title"
        bodyKey="pages.delete.body"
        confirmKey="pages.delete.confirm"
        params={{ page: deleteTarget?.title[locale] ?? deleteTarget?.title.ar ?? "" }}
        danger
        pending={remove.isPending}
        onConfirm={() =>
          deleteTarget &&
          remove.mutate([deleteTarget.id], {
            onSuccess: () => {
              mt.success("common.deleted");
              setDeleteTarget(null);
            },
            onError: () => mt.error("common.save.error"),
          })
        }
      >
        {usedBy.length > 0 ? (
          <p className="text-warning text-sm">{t("deleteUsedWarning", { menus: usedBy.join("، ") })}</p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
