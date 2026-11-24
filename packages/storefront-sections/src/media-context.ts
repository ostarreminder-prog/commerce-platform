"use client";

import * as React from "react";
import type { Media } from "@repo/contracts";

/**
 * Bridge between the pure settings forms and the app's media system.
 * Admin supplies a real adapter (api-client hooks); a storefront/preview can
 * supply a read-only one ({ images }) or none — image fields then fall back
 * to a plain url input.
 */
export interface SectionMediaAdapter {
  /** Media library entries for the picker grid. */
  images: Media[];
  /** True while an upload is in flight (disables picker upload). */
  uploading?: boolean;
  /** Upload a file to the library; resolves to the created Media (null on failure). */
  upload?: (file: File) => Promise<Media | null | undefined> | Media | null | undefined;
}

const MediaAdapterContext = React.createContext<SectionMediaAdapter | null>(null);

export function MediaAdapterProvider({ adapter, children }: { adapter: SectionMediaAdapter; children: React.ReactNode }) {
  return React.createElement(MediaAdapterContext.Provider, { value: adapter }, children);
}

/** The injected media adapter, or null when the host app didn't provide one. */
export function useMediaAdapter(): SectionMediaAdapter | null {
  return React.useContext(MediaAdapterContext);
}
