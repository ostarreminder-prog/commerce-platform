"use client";

import { ImageField, type ImageFieldProps } from "@repo/ui/components/image-field";
import { useMediaLibrary } from "@/lib/media";

export interface MediaFieldProps {
  /** Current image url (placeholder:<hue> or real); empty = unset. */
  value?: string | null;
  /** Receives the picked/uploaded/cropped image url (null = removed). */
  onChange: (url: string | null) => void;
  aspect?: ImageFieldProps["aspect"];
  disabled?: boolean;
}

/** ImageField pre-wired to the mock media library — pick, upload or crop a url. */
export function MediaField({ value, onChange, aspect, disabled }: MediaFieldProps) {
  const lib = useMediaLibrary();
  return (
    <ImageField
      value={value}
      images={lib.images}
      uploading={lib.uploading}
      aspect={aspect}
      disabled={disabled}
      onSelect={(m) => onChange(m.url)}
      onUpload={(file) => {
        void lib.upload(file).then((m) => {
          if (m) onChange(m.url);
        });
      }}
      onCropResult={(dataUrl) => onChange(dataUrl)}
      onRemove={() => onChange(null)}
    />
  );
}
