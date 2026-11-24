"use client";

import * as React from "react";
import { Crop, ImageIcon, ImagePlus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Media } from "@repo/contracts";
import { Button } from "./button";
import { ImageCropDialog, type CropAspect } from "./image-crop-dialog";
import { MediaPicker } from "./media-picker";
import { MediaThumb } from "./media-thumb";
import { isRealImageUrl } from "../lib/media";

export interface ImageFieldProps {
  /** Current image url — `placeholder:<hue>` or a real url; empty = unset. */
  value?: string | null;
  /** Media library entries shown in the picker. */
  images: Media[];
  /** Disable picker upload button while an upload is in flight. */
  uploading?: boolean;
  /** Initial aspect preset for the crop dialog. */
  aspect?: CropAspect;
  /** Library pick — parent stores the media (usually `media.url`). */
  onSelect?: (media: Media) => void;
  /** File picked for upload — parent wires the actual upload + selects the result. */
  onUpload?: (file: File) => void;
  /** Cropped result — parent stores the dataURL as the new value. */
  onCropResult?: (dataUrl: string) => void;
  onRemove?: () => void;
  disabled?: boolean;
}

/**
 * Settings-style image field: thumbnail (or placeholder) + library / upload / crop / remove
 * actions. Pure — orchestrates MediaPicker + ImageCropDialog via callbacks; the parent
 * supplies library items and handles uploads.
 */
export function ImageField({
  value,
  images,
  uploading = false,
  aspect,
  onSelect,
  onUpload,
  onCropResult,
  onRemove,
  disabled = false,
}: ImageFieldProps) {
  const t = useTranslations("msg.media");
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [cropOpen, setCropOpen] = React.useState(false);
  const real = isRealImageUrl(value);

  return (
    <div className="flex items-start gap-3">
      {value ? (
        <MediaThumb url={value} label={t("altText")} className="size-20 shrink-0 rounded-lg border" />
      ) : (
        <div className="bg-muted text-muted-foreground flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed">
          <ImageIcon className="size-6" aria-hidden />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 pt-1">
        {onSelect || onUpload ? (
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setPickerOpen(true)}>
            <ImageIcon aria-hidden />
            {t("selectImage")}
          </Button>
        ) : null}
        {onUpload ? (
          <>
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
            <Button type="button" size="sm" variant="outline" disabled={disabled || uploading} onClick={() => fileRef.current?.click()}>
              <ImagePlus aria-hidden />
              {uploading ? t("uploading") : t("upload")}
            </Button>
          </>
        ) : null}
        {onCropResult && real ? (
          <Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => setCropOpen(true)}>
            <Crop aria-hidden />
            {t("crop")}
          </Button>
        ) : null}
        {onRemove && value ? (
          <Button type="button" size="sm" variant="ghost" className="text-destructive" disabled={disabled} onClick={onRemove}>
            <Trash2 aria-hidden />
            {t("remove")}
          </Button>
        ) : null}
      </div>
      <MediaPicker
        open={pickerOpen}
        images={images}
        uploading={uploading}
        onUpload={onUpload}
        onSelect={(m) => {
          setPickerOpen(false);
          onSelect?.(m);
        }}
        onClose={() => setPickerOpen(false)}
      />
      <ImageCropDialog
        open={cropOpen && real}
        src={real ? (value as string) : ""}
        aspect={aspect}
        onDone={(dataUrl) => {
          setCropOpen(false);
          onCropResult?.(dataUrl);
        }}
        onClose={() => setCropOpen(false)}
      />
    </div>
  );
}
