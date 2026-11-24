"use client";

import { ExternalLink, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Category, MediaRef } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { Textarea } from "@repo/ui/components/textarea";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { MediaField } from "@/components/media-field";

export interface CategoryEditState {
  open: boolean;
  id: string | null;
  parentId: string | null;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  sortOrder: string;
  seoTitle: string;
  seoDescription: string;
  image: MediaRef | null;
}

export const closedCategoryEdit: CategoryEditState = {
  open: false, id: null, parentId: null, nameAr: "", nameEn: "", descriptionAr: "", sortOrder: "0", seoTitle: "", seoDescription: "", image: null,
};

/** Category create/edit sheet — name, description, image (media library), parent, order and SEO. */
export function CategoryEditSheet({
  edit,
  setEdit,
  all,
  depthOf,
  canManage,
  saving,
  onSubmit,
}: {
  edit: CategoryEditState;
  setEdit: (next: CategoryEditState) => void;
  all: Category[];
  depthOf: (c: Category, all: Category[]) => number;
  canManage: boolean;
  saving: boolean;
  onSubmit: () => void;
}) {
  const t = useTranslations("catalog.categories");
  const tc = useTranslations("common");
  const { locale } = useAppLocale();

  return (
    <Sheet open={edit.open} onOpenChange={(v) => !v && setEdit(closedCategoryEdit)}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{edit.id ? t("editCategory") : t("newCategory")}</SheetTitle>
          <SheetDescription>{t("sheetDescription")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="cat-name">{t("nameAr")}</Label>
            <Input id="cat-name" value={edit.nameAr} onChange={(e) => setEdit({ ...edit, nameAr: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-name-en">{t("nameEn")}</Label>
            <Input id="cat-name-en" dir="ltr" value={edit.nameEn} onChange={(e) => setEdit({ ...edit, nameEn: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-desc">{t("descriptionField")}</Label>
            <Textarea id="cat-desc" rows={3} value={edit.descriptionAr} onChange={(e) => setEdit({ ...edit, descriptionAr: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("image")}</Label>
            <MediaField
              value={edit.image?.url ?? ""}
              disabled={!canManage}
              onChange={(url) =>
                setEdit({
                  ...edit,
                  image:
                    url === null
                      ? null
                      : { id: edit.image?.id ?? `cat_img_${edit.id ?? "new"}`, url, alt: { ar: edit.nameAr || "·" }, width: 800, height: 800 },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("parent")}</Label>
            <Select value={edit.parentId ?? "none"} onValueChange={(v) => setEdit({ ...edit, parentId: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noParent")}</SelectItem>
                {all.filter((c) => c.id !== edit.id && depthOf(c, all) < 4).map((c) => <SelectItem key={c.id} value={c.id}>{c.name[locale] ?? c.name.ar}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-order">{t("sortOrder")}</Label>
            <Input id="cat-order" inputMode="numeric" dir="ltr" className="num w-28" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-seo-title">{t("seoTitle")}</Label>
            <Input id="cat-seo-title" value={edit.seoTitle} onChange={(e) => setEdit({ ...edit, seoTitle: e.target.value })} maxLength={60} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat-seo-desc">{t("seoDescription")}</Label>
            <Textarea id="cat-seo-desc" rows={2} value={edit.seoDescription} onChange={(e) => setEdit({ ...edit, seoDescription: e.target.value })} maxLength={160} />
          </div>
          {edit.id ? (
            <Button variant="outline" size="sm" asChild>
              <a href={`http://localhost:3001/c/${all.find((c) => c.id === edit.id)?.slug ?? ""}`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />{t("viewInStore")}
              </a>
            </Button>
          ) : null}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setEdit(closedCategoryEdit)}>{tc("cancel")}</Button>
          {canManage ? <Button onClick={onSubmit} disabled={saving}><Save aria-hidden />{tc("save")}</Button> : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
