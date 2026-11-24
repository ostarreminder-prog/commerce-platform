"use client";

import * as React from "react";
import { ImagePlus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Media } from "@repo/contracts";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { MediaThumb } from "./media-thumb";
import { useAppLocale } from "../hooks/use-app-locale";
import { cn } from "../lib/cn";

export interface MediaPickerProps {
  open: boolean;
  /** Library items shown in the grid. */
  images: Media[];
  /** Disables the upload button while an upload is in flight. */
  uploading?: boolean;
  /** Called with the picked file — the parent wires the upload itself. */
  onUpload?: (file: File) => void;
  onSelect: (media: Media) => void;
  onClose: () => void;
}

/**
 * Media library dialog — grid of library items + an upload button.
 * Pure: the parent supplies images and handles the actual upload.
 */
export function MediaPicker({ open, images, uploading = false, onUpload, onSelect, onClose }: MediaPickerProps) {
  const t = useTranslations("msg.media");
  const { locale } = useAppLocale();
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("library")}</DialogTitle>
        </DialogHeader>
        {onUpload ? (
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden />
              {uploading ? t("uploading") : t("upload")}
            </Button>
          </div>
        ) : null}
        {images.length ? (
          <div className="grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
            {images.map((m) => {
              const alt = (locale === "ar" ? m.altAr : m.altEn) ?? m.altAr ?? m.altEn ?? "";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelect(m)}
                  className={cn(
                    "group flex flex-col gap-1.5 rounded-lg border border-transparent p-1 text-start",
                    "hover:border-primary hover:bg-accent focus-visible:border-primary focus-visible:outline-none",
                  )}
                >
                  <MediaThumb url={m.url} label={alt} className="aspect-square size-full w-full rounded-md" />
                  <span className="text-muted-foreground line-clamp-1 px-0.5 text-xs">{alt || m.id}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">{t("empty")}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
