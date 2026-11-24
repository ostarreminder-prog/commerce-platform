"use client";

import { Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Brand, MediaRef } from "@repo/contracts";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@repo/ui/components/sheet";
import { Textarea } from "@repo/ui/components/textarea";
import { MediaField } from "@/components/media-field";

export interface BrandEditState {
  open: boolean;
  id: string | null;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  website: string;
  status: Brand["status"];
  logo: MediaRef | null;
}

export const closedBrandEdit: BrandEditState = {
  open: false, id: null, nameAr: "", nameEn: "", descriptionAr: "", descriptionEn: "", website: "", status: "active", logo: null,
};

export const editFromBrand = (b: Brand): BrandEditState => ({
  open: true, id: b.id, nameAr: b.name.ar, nameEn: b.name.en ?? "", descriptionAr: b.description.ar,
  descriptionEn: b.description.en ?? "", website: b.website ?? "", status: b.status, logo: b.logo,
});

/** Brand create/edit sheet — names, logo (media library), website, status. */
export function BrandEditSheet({
  edit,
  setEdit,
  canManage,
  saving,
  onSubmit,
}: {
  edit: BrandEditState;
  setEdit: (next: BrandEditState) => void;
  canManage: boolean;
  saving: boolean;
  onSubmit: () => void;
}) {
  const t = useTranslations("catalog.brands");
  const tc = useTranslations("common");

  return (
    <Sheet open={edit.open} onOpenChange={(v) => !v && setEdit(closedBrandEdit)}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{edit.id ? t("editBrand") : t("newBrand")}</SheetTitle>
          <SheetDescription>{t("sheetDescription")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">{t("nameAr")}</Label>
            <Input id="brand-name" value={edit.nameAr} onChange={(e) => setEdit({ ...edit, nameAr: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-name-en">{t("nameEn")}</Label>
            <Input id="brand-name-en" dir="ltr" value={edit.nameEn} onChange={(e) => setEdit({ ...edit, nameEn: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-desc">{t("descriptionField")}</Label>
            <Textarea id="brand-desc" rows={3} value={edit.descriptionAr} onChange={(e) => setEdit({ ...edit, descriptionAr: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-desc-en">{t("descriptionEn")}</Label>
            <Textarea id="brand-desc-en" dir="ltr" rows={2} value={edit.descriptionEn} onChange={(e) => setEdit({ ...edit, descriptionEn: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("logo")}</Label>
            <MediaField
              value={edit.logo?.url ?? ""}
              disabled={!canManage}
              onChange={(url) =>
                setEdit({
                  ...edit,
                  logo:
                    url === null
                      ? null
                      : { id: edit.logo?.id ?? `brand_logo_${edit.id ?? "new"}`, url, alt: { ar: edit.nameAr || "·" }, width: 800, height: 800 },
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-site">{t("website")}</Label>
            <Input id="brand-site" dir="ltr" placeholder="https://…" value={edit.website} onChange={(e) => setEdit({ ...edit, website: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("statusLabel")}</Label>
            <Select value={edit.status} onValueChange={(v) => setEdit({ ...edit, status: v as Brand["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("status.active")}</SelectItem>
                <SelectItem value="archived">{t("status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => setEdit(closedBrandEdit)}>{tc("cancel")}</Button>
          {canManage ? <Button onClick={onSubmit} disabled={saving || !edit.nameAr.trim()}><Save aria-hidden />{tc("save")}</Button> : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
