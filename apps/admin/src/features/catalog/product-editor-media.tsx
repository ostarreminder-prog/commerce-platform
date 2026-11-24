"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Crop, ImagePlus, Trash2, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Media, MediaRef } from "@repo/contracts";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { ImageCropDialog } from "@repo/ui/components/image-crop-dialog";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { MediaPicker } from "@repo/ui/components/media-picker";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { toast } from "@repo/ui/components/toaster";
import { cn } from "@repo/ui/lib/cn";
import { isRealImageUrl } from "@repo/ui/lib/media";
import { mediaToRef, useMediaLibrary } from "@/lib/media";
import { uid, type Draft } from "@/features/catalog/product-editor-draft";

export function MediaCard({ draft, set, drag, setDrag, moveMedia }: {
  draft: Draft;
  set: <K extends keyof Draft>(key: K, value: Draft[K]) => void;
  drag: number | null;
  setDrag: (i: number | null) => void;
  moveMedia: (i: number, dir: -1 | 1) => void;
}) {
  const t = useTranslations("catalog.editor");
  const lib = useMediaLibrary();
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [cropIndex, setCropIndex] = React.useState<number | null>(null);

  const append = (m: Media) => {
    if (draft.media.length >= 15) return;
    set("media", [...draft.media, { ...mediaToRef(m, draft.nameAr), id: uid() }]);
  };
  const applyCrop = (dataUrl: string) =>
    set("media", draft.media.map((m, i) => (i === cropIndex ? { ...m, url: dataUrl } : m)));
  /* Removing an image also clears any variant pointing at it (imageId → MediaRef). */
  const removeMedia = (ref: MediaRef) => {
    set("media", draft.media.filter((x) => x.id !== ref.id));
    if (draft.variants.some((v) => v.imageId === ref.id))
      set("variants", draft.variants.map((v) => (v.imageId === ref.id ? { ...v, imageId: null } : v)));
  };
  const setAlt = (id: string, patch: Partial<MediaRef["alt"]>) =>
    set("media", draft.media.map((m) => (m.id === id ? { ...m, alt: { ...m.alt, ...patch } } : m)));

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{t("media")}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {draft.media.map((m, i) => (
            <div
              key={m.id}
              draggable
              onDragStart={() => setDrag(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (drag === null || drag === i) return;
                const next = [...draft.media];
                const [moved] = next.splice(drag, 1);
                next.splice(i, 0, moved as MediaRef);
                set("media", next);
                setDrag(null);
              }}
              className={cn("group relative cursor-grab", drag === i && "opacity-40")}
            >
              <MediaThumb url={m.url} label={m.alt.ar} className="aspect-square size-full rounded-md" />
              {i === 0 ? <Badge className="absolute start-1 top-1 text-[10px]">{t("mainImage")}</Badge> : null}
              <div className="absolute end-1 top-1 hidden gap-1 group-hover:flex">
                {isRealImageUrl(m.url) ? (
                  <Button type="button" size="icon" variant="secondary" className="size-6" onClick={() => setCropIndex(i)} aria-label={t("cropImage")}><Crop className="size-3" /></Button>
                ) : null}
                <Button type="button" size="icon" variant="secondary" className="size-6" onClick={() => moveMedia(i, -1)} disabled={i === 0} aria-label={t("moveUp")}><ArrowUp className="size-3 rtl:rotate-90" /></Button>
                <Button type="button" size="icon" variant="secondary" className="size-6" onClick={() => moveMedia(i, 1)} disabled={i === draft.media.length - 1} aria-label={t("moveDown")}><ArrowDown className="size-3 rtl:rotate-90" /></Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" size="icon" variant="secondary" className="size-6" aria-label={t("altText")}><Type className="size-3" /></Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 space-y-3">
                    <p className="text-sm font-medium">{t("altText")}</p>
                    <div className="space-y-1.5">
                      <Label htmlFor={`alt-ar-${m.id}`} className="text-xs">{t("altAr")}</Label>
                      <Input id={`alt-ar-${m.id}`} value={m.alt.ar} onChange={(e) => setAlt(m.id, { ar: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`alt-en-${m.id}`} className="text-xs">{t("altEn")}</Label>
                      <Input id={`alt-en-${m.id}`} dir="ltr" value={m.alt.en ?? ""} onChange={(e) => setAlt(m.id, { en: e.target.value || undefined })} />
                    </div>
                  </PopoverContent>
                </Popover>
                <Button type="button" size="icon" variant="destructive" className="size-6" onClick={() => removeMedia(m)} aria-label={t("removeImage")}><Trash2 className="size-3" /></Button>
              </div>
            </div>
          ))}
          {draft.media.length < 15 ? (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs"
            >
              <ImagePlus className="size-5" aria-hidden />{t("addImage")}
            </button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">{t("mediaHint")}</p>
      </CardContent>
      <MediaPicker
        open={pickerOpen}
        images={lib.images}
        uploading={lib.uploading}
        onUpload={(file) => {
          void lib.upload(file).then((m) => {
            /* Honest failure: upload() resolves null on error — tell the user
             * instead of pretending the image arrived. */
            if (m) append(m); else toast.error(t("uploadFailed"));
          });
        }}
        onSelect={(m) => {
          setPickerOpen(false);
          append(m);
        }}
        onClose={() => setPickerOpen(false)}
      />
      <ImageCropDialog
        open={cropIndex !== null && isRealImageUrl(draft.media[cropIndex]?.url)}
        src={cropIndex !== null ? (draft.media[cropIndex]?.url ?? "") : ""}
        onDone={(dataUrl) => {
          applyCrop(dataUrl);
          setCropIndex(null);
        }}
        onClose={() => setCropIndex(null)}
      />
    </Card>
  );
}
