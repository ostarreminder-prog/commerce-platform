"use client";

import * as React from "react";
import { ListTree, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCategoryList, useCollectionList, useCreateMenu, useDeleteMenu, useMenus, usePageList, useProductList, useSaveMenu } from "@repo/api-client";
import type { Menu, MenuItem } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { ConfirmDialog } from "@repo/ui/components/confirm-dialog";
import { DataState } from "@repo/ui/components/data-state";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { useMsgToast } from "@repo/ui/components/msg-toast";
import { PageHeader } from "@repo/ui/components/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui/components/tabs";
import { MenuItemDialog } from "./menu-item-dialog";
import { ItemRow, type RowAction } from "./menu-item-row";
import { emptyItem, insertItem, moveItem, removeItem, updateItem } from "./menu-utils";

interface Editing {
  menuId: string;
  item: MenuItem;
  parentId: string | null;
  isNew: boolean;
}

export function MenusView() {
  const t = useTranslations("storefront.menus");
  const mt = useMsgToast();
  const menus = useMenus();
  const save = useSaveMenu();
  const createMenu = useCreateMenu();
  const deleteMenu = useDeleteMenu();
  const [drafts, setDrafts] = React.useState<Record<string, MenuItem[]>>({});
  const [editing, setEditing] = React.useState<Editing | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [createLocation, setCreateLocation] = React.useState<Menu["location"]>("footer");
  const [deleteTarget, setDeleteTarget] = React.useState<Menu | null>(null);

  /* Entity lists for the broken-target check — a menu item whose targetId no
   * longer resolves gets a warning badge instead of silently linking to "#". */
  const { data: pages = [] } = usePageList();
  const { data: categories = [] } = useCategoryList();
  const { data: collections = [] } = useCollectionList();
  const { data: products = [] } = useProductList();
  const targetExists = React.useCallback(
    (item: MenuItem): boolean => {
      if (item.linkType === "url") return Boolean(item.url?.trim()) && item.url !== "#";
      const id = item.targetId;
      if (!id) return item.children.length > 0; // parent items without a target are column headers
      switch (item.linkType) {
        case "page": return pages.some((p) => p.id === id);
        case "category": return categories.some((c) => c.id === id);
        case "collection": return collections.some((c) => c.id === id);
        case "product": return products.some((p) => p.id === id);
        default: return true;
      }
    },
    [pages, categories, collections, products],
  );

  React.useEffect(() => {
    if (menus.data && !Object.keys(drafts).length) {
      setDrafts(Object.fromEntries(menus.data.map((m) => [m.id, m.items])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menus.data]);

  const patch = (menuId: string, fn: (items: MenuItem[]) => MenuItem[]) =>
    setDrafts((d) => ({ ...d, [menuId]: fn(d[menuId] ?? []) }));

  const handleAction = (menuId: string) => (action: RowAction, item: MenuItem) => {
    if (action === "edit") setEditing({ menuId, item, parentId: null, isNew: false });
    else if (action === "addSub") setEditing({ menuId, item: emptyItem(), parentId: item.id, isNew: true });
    else if (action === "up") patch(menuId, (items) => moveItem(items, item.id, -1));
    else if (action === "down") patch(menuId, (items) => moveItem(items, item.id, 1));
    else if (action === "remove") patch(menuId, (items) => removeItem(items, item.id));
  };

  const saveEditing = (item: MenuItem) => {
    if (!editing) return;
    patch(editing.menuId, (items) => (editing.isNew ? insertItem(items, editing.parentId, item) : updateItem(items, item.id, item)));
    setEditing(null);
  };

  const renderTree = (menu: Menu) => {
    const items = drafts[menu.id] ?? [];
    const onAction = handleAction(menu.id);
    const siblings = (menus.data ?? []).filter((m) => m.location === menu.location);
    return (
      <Card className="divide-y">
        {items.length === 0 ? (
          <div className="text-muted-foreground flex items-center gap-2 p-6 text-sm">
            <ListTree className="size-4" aria-hidden />
            {t("empty")}
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((item, i) => (
              <React.Fragment key={item.id}>
                <ItemRow item={item} depth={0} first={i === 0} last={i === items.length - 1} broken={item.children.length === 0 && !targetExists(item)} onAction={onAction} />
                {item.children.map((child, ci) => (
                  <ItemRow key={child.id} item={child} depth={1} first={false} last={ci === item.children.length - 1} broken={!targetExists(child)} onAction={onAction} />
                ))}
              </React.Fragment>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing({ menuId: menu.id, item: emptyItem(), parentId: null, isNew: true })}>
              <Plus aria-hidden />
              {t("addItem")}
            </Button>
            {siblings.length > 1 ? (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setDeleteTarget(menu)}>
                <Trash2 aria-hidden />
                {t("deleteMenu")}
              </Button>
            ) : null}
          </div>
          <Button size="sm" loading={save.isPending} onClick={() => save.mutate([menu.id, items], { onSuccess: () => mt.success("menus.saved") })}>
            {t("save")}
          </Button>
        </div>
      </Card>
    );
  };

  const locations = menus.data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus aria-hidden />
            {t("newMenu")}
          </Button>
        }
      />
      <DataState state={menus} loading={<Skeleton className="h-72 rounded-xl" />}>
        {() => (
          <Tabs defaultValue={locations[0]?.id ?? "header"}>
            <TabsList>
              {locations.map((m, i) => (
                <TabsTrigger key={m.id} value={m.id}>
                  {t(`locations.${m.location}`)}
                  {locations.filter((x) => x.location === m.location).length > 1 ? ` ${i + 1}` : ""}
                </TabsTrigger>
              ))}
            </TabsList>
            {locations.map((m) => (
              <TabsContent key={m.id} value={m.id} className="mt-4">
                {renderTree(m)}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DataState>
      <MenuItemDialog
        open={editing !== null}
        onOpenChange={(v) => !v && setEditing(null)}
        item={editing?.item ?? null}
        title={editing?.isNew ? (editing.parentId ? t("addSub") : t("addItem")) : t("edit")}
        onSave={saveEditing}
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newMenu")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Select value={createLocation} onValueChange={(v) => setCreateLocation(v as Menu["location"])}>
              <SelectTrigger aria-label={t("item.linkType")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="header">{t("locations.header")}</SelectItem>
                <SelectItem value="footer">{t("locations.footer")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">{t("newMenuHint")}</p>
          </div>
          <DialogFooter>
            <Button
              loading={createMenu.isPending}
              onClick={() =>
                createMenu.mutate([createLocation], {
                  onSuccess: () => {
                    mt.success("menus.created");
                    setCreateOpen(false);
                  },
                  onError: () => mt.error("common.save.error"),
                })
              }
            >
              {t("newMenu")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        titleKey="menus.delete.title"
        bodyKey="menus.delete.body"
        confirmKey="menus.delete.confirm"
        params={{ menu: deleteTarget ? t(`locations.${deleteTarget.location}`) : "" }}
        danger
        pending={deleteMenu.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteMenu.mutate([deleteTarget.id], {
            onSuccess: () => {
              mt.success("common.deleted");
              setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([id]) => id !== deleteTarget.id)));
              setDeleteTarget(null);
            },
            onError: () => mt.error("common.save.error"),
          })
        }
      />
    </div>
  );
}
