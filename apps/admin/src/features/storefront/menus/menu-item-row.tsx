"use client";

import { ArrowDown, ArrowUp, CornerDownLeft, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MenuItem } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";

export type RowAction = "edit" | "addSub" | "up" | "down" | "remove";

export function ItemRow({
  item,
  depth,
  first,
  last,
  broken,
  onAction,
}: {
  item: MenuItem;
  depth: number;
  first: boolean;
  last: boolean;
  broken: boolean;
  onAction: (action: RowAction, item: MenuItem) => void;
}) {
  const t = useTranslations("storefront.menus");
  const { locale } = useAppLocale();
  const label = item.label[locale] || item.label.ar || t("untitled");
  return (
    <li className={cn("flex items-center gap-2 px-3 py-2", depth === 1 && "border-border/60 border-s ps-8")}>
      {depth === 1 ? <CornerDownLeft className="text-muted-foreground size-4 shrink-0" aria-hidden /> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-muted-foreground truncate text-xs">{item.linkType === "url" ? item.url : t(`item.types.${item.linkType}`)}</p>
      </div>
      {broken ? (
        <Badge variant="warning" className="shrink-0 font-normal" title={t("brokenHint")}>
          <TriangleAlert className="size-3" aria-hidden />
          {t("broken")}
        </Badge>
      ) : null}
      <Badge variant="secondary" className="shrink-0 font-normal">
        {t(`item.types.${item.linkType}`)}
      </Badge>
      <div className="flex shrink-0 items-center">
        {depth === 0 ? (
          <Button variant="ghost" size="icon" className="size-8" aria-label={t("addSub")} onClick={() => onAction("addSub", item)}>
            <Plus className="size-4" aria-hidden />
          </Button>
        ) : null}
        <Button variant="ghost" size="icon" className="size-8" aria-label={t("moveUp")} disabled={first} onClick={() => onAction("up", item)}>
          <ArrowUp className="size-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label={t("moveDown")} disabled={last} onClick={() => onAction("down", item)}>
          <ArrowDown className="size-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="size-8" aria-label={t("edit")} onClick={() => onAction("edit", item)}>
          <Pencil className="size-4" aria-hidden />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive size-8" aria-label={t("remove")} onClick={() => onAction("remove", item)}>
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
