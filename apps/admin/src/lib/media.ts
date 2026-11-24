"use client";

import * as React from "react";
import { useMediaList, useUploadMedia } from "@repo/api-client";
import type { Media } from "@repo/contracts";

/** Media-library adapter wired to the mock api-client — shared by MediaField and the theme editor. */
export function useMediaLibrary() {
  const { data: images = [] } = useMediaList();
  const upload = useUploadMedia();
  return React.useMemo(
    () => ({
      images,
      uploading: upload.isPending,
      upload: (file: File): Promise<Media | null> => upload.mutateAsync([file]).catch(() => null),
    }),
    [images, upload],
  );
}

/** Build a MediaRef-shaped record from a library entry (or a raw url) for entity image fields. */
export function mediaToRef(m: Media, altAr: string): { id: string; url: string; alt: { ar: string; en?: string }; width: number; height: number } {
  return { id: m.id, url: m.url, alt: { ar: m.altAr ?? altAr, en: m.altEn }, width: m.width ?? 800, height: m.height ?? 800 };
}
