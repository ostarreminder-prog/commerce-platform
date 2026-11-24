"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useCategoryList, useCollectionList, usePageList, useProductList } from "@repo/api-client";
import type { MenuItem } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";

interface TargetOption {
  id: string;
  label: string;
}

export function MenuItemDialog({
  open,
  onOpenChange,
  item,
  title,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: MenuItem | null;
  title: string;
  onSave: (item: MenuItem) => void;
}) {
  const t = useTranslations("storefront.menus.item");
  const { locale } = useAppLocale();
  const [draft, setDraft] = React.useState<MenuItem | null>(null);

  React.useEffect(() => {
    if (open && item) setDraft(structuredClone(item));
  }, [open, item]);

  const pages = usePageList();
  const categories = useCategoryList();
  const collections = useCollectionList();
  const products = useProductList();

  const loc = (v: { ar: string; en?: string }) => v[locale] ?? v.ar;
  const options: TargetOption[] = React.useMemo(() => {
    if (!draft) return [];
    switch (draft.linkType) {
      case "page":
        return (pages.data ?? []).map((p) => ({ id: p.id, label: loc(p.title) }));
      case "category":
        return (categories.data ?? []).map((c) => ({ id: c.id, label: loc(c.name) }));
      case "collection":
        return (collections.data ?? []).map((c) => ({ id: c.id, label: loc(c.name) }));
      case "product":
        return (products.data ?? []).map((p) => ({ id: p.id, label: loc(p.name) }));
      default:
        return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.linkType, pages.data, categories.data, collections.data, products.data, locale]);

  if (!draft) return null;
  const isUrl = draft.linkType === "url";
  const canSave = Boolean(draft.label.ar.trim()) && (isUrl ? Boolean(draft.url?.trim()) : Boolean(draft.targetId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="mi-label-ar">{t("labelAr")}</Label>
              <Input id="mi-label-ar" value={draft.label.ar} onChange={(e) => setDraft({ ...draft, label: { ...draft.label, ar: e.target.value } })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mi-label-en">{t("labelEn")}</Label>
              <Input id="mi-label-en" dir="ltr" value={draft.label.en ?? ""} onChange={(e) => setDraft({ ...draft, label: { ...draft.label, en: e.target.value } })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("linkType")}</Label>
            <Select
              value={draft.linkType}
              onValueChange={(v) => setDraft({ ...draft, linkType: v as MenuItem["linkType"], targetId: null, url: isUrl ? draft.url : "" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(["page", "category", "collection", "product", "url"] as const).map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(`types.${k}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isUrl ? (
            <div className="space-y-1.5">
              <Label htmlFor="mi-url">{t("url")}</Label>
              <Input id="mi-url" dir="ltr" placeholder="https://…" value={draft.url ?? ""} onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>{t("target")}</Label>
              <Select value={draft.targetId ?? ""} onValueChange={(v) => setDraft({ ...draft, targetId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={t("choose")} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("done")}
          </Button>
          <Button disabled={!canSave} onClick={() => onSave(draft)}>
            {t("add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
