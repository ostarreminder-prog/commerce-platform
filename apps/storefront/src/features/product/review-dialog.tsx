"use client";

import * as React from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCreateReview, useMediaList, useUploadMedia } from "@repo/api-client";
import type { StoreProduct } from "@/lib/store-product";
import { useSession } from "@/components/session-context";
import { Button } from "@repo/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@repo/ui/components/dialog";
import { Label } from "@repo/ui/components/label";
import { MediaPicker } from "@repo/ui/components/media-picker";
import { MediaThumb } from "@repo/ui/components/media-thumb";
import { Textarea } from "@repo/ui/components/textarea";
import { toast } from "@repo/ui/components/toaster";
import { useAppLocale } from "@repo/ui/hooks/use-app-locale";
import { cn } from "@repo/ui/lib/cn";
import { formatNumber } from "@repo/ui/lib/format";

const MAX_IMAGES = 5;

/**
 * Write-a-review dialog — stars picker + text + up to 5 photos picked from the
 * media library or uploaded (FileReader → dataURL via commerce.media.upload).
 * Submitted reviews land as `pending` until the merchant approves them.
 */
export function ReviewDialog({ product: p, open, onOpenChange }: { product: StoreProduct; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("store.review");
  const { locale } = useAppLocale();
  const { effective } = useSession();
  const { data: mediaItems = [] } = useMediaList();
  const upload = useUploadMedia();
  const create = useCreateReview();
  const [rating, setRating] = React.useState(0);
  const [text, setText] = React.useState("");
  const [images, setImages] = React.useState<string[]>([]);
  const [picker, setPicker] = React.useState(false);
  /* Reviews are attributed to the session customer (demo fallback for guests). */
  const customerId = effective?.id ?? "cus_001";

  const addImage = (url: string) => setImages((prev) => (prev.includes(url) || prev.length >= MAX_IMAGES ? prev : [...prev, url]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !text.trim()) {
      toast.error(t("required"));
      return;
    }
    create.mutate([{ productId: p.id, customerId, rating, text: text.trim(), images }], {
      onSuccess: () => {
        toast.success(t("submitted"));
        onOpenChange(false);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("form.title", { product: (p.name[locale] ?? p.name.ar) })}</DialogTitle>
            <DialogDescription className="sr-only">{t("write")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <Label>{t("form.rating")}</Label>
              <div className="flex gap-1" role="radiogroup" aria-label={t("form.rating")}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={rating === n}
                    aria-label={t("filters.stars", { count: formatNumber(n) })}
                    onClick={() => setRating(n)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star className={cn("size-7", n <= rating ? "fill-warning text-warning" : "text-muted")} aria-hidden />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="review-text">{t("form.text")}</Label>
              <Textarea id="review-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("form.textPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("form.photos", { max: formatNumber(MAX_IMAGES) })}</Label>
              <div className="flex flex-wrap items-center gap-2">
                {images.map((url, i) => (
                  <span key={i} className="relative">
                    <MediaThumb url={url} label={`${i + 1}`} className="size-16 rounded-lg" />
                    <button
                      type="button"
                      aria-label={t("form.photos", { max: formatNumber(MAX_IMAGES) })}
                      onClick={() => setImages((prev) => prev.filter((_, k) => k !== i))}
                      className="bg-background absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full border shadow-sm"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                ))}
                {images.length < MAX_IMAGES ? (
                  <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setPicker(true)}>
                    <ImagePlus className="size-4" aria-hidden />
                    {t("form.addPhoto")}
                  </Button>
                ) : null}
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={create.isPending || upload.isPending}>
                {t("form.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <MediaPicker
        open={picker}
        images={mediaItems}
        uploading={upload.isPending}
        onUpload={(file) => upload.mutate([file], { onSuccess: (m) => addImage(m.url) })}
        onSelect={(m) => {
          addImage(m.url);
          setPicker(false);
        }}
        onClose={() => setPicker(false)}
      />
    </>
  );
}
