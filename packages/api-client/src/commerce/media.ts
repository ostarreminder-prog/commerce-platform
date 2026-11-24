import type {
  Media,
} from "@repo/contracts";
import { db, find, guard, measureImage, persistStorefront, readImageFile, syncRead, uid } from "./db";

/** Client-side upload validation — matches what the library UI advertises. */
export const MEDIA_MAX_BYTES = 8 * 1024 * 1024;
export const MEDIA_ACCEPT = "image/*";

export const mediaApi = {
  media: {
    list: () => syncRead<Media[]>(() => db.media),
    get: (id: string) => guard<Media>(() => find(db.media, id, "media")),
    /** Reads the file to a dataURL and captures the natural size (FileReader + <img>). */
    upload: (file: File) => {
      if (!file.type.startsWith("image/")) return Promise.reject(new Error("type"));
      if (file.size > MEDIA_MAX_BYTES) return Promise.reject(new Error("size"));
      return readImageFile(file).then(({ url, width, height }) =>
        guard<Media>(() => {
          const alt = file.name.replace(/\.[^.]+$/, "") || undefined;
          const m: Media = {
            id: uid("med"), url,
            altAr: alt && /[\u0600-\u06FF]/.test(alt) ? alt : undefined, altEn: alt && !/[\u0600-\u06FF]/.test(alt) ? alt : undefined,
            width: width || undefined, height: height || undefined,
            mime: file.type || "image/jpeg", sizeBytes: file.size, createdAt: new Date().toISOString(),
          };
          db.media.unshift(m);
          persistStorefront();
          return m;
        }),
      );
    },
    /** Adds an already-resolved image url (e.g. a cropped dataURL) to the library. */
    create: (input: { url: string; altAr?: string; altEn?: string; width?: number; height?: number; mime?: string }) =>
      (input.width && input.height ? Promise.resolve({ width: input.width, height: input.height }) : measureImage(input.url)).then(
        ({ width, height }) =>
          guard<Media>(() => {
            const m: Media = {
              id: uid("med"), url: input.url, altAr: input.altAr, altEn: input.altEn,
              width: input.width ?? (width || undefined), height: input.height ?? (height || undefined),
              mime: input.mime ?? (input.url.startsWith("data:") ? input.url.slice(5, input.url.indexOf(";")) : "image/png"),
              sizeBytes: input.url.length, createdAt: new Date().toISOString(),
            };
            db.media.unshift(m);
            persistStorefront();
            return m;
          }),
      ),
    update: (id: string, patch: Partial<Pick<Media, "altAr" | "altEn" | "url" | "sizeBytes" | "width" | "height" | "mime">>) =>
      guard(() => {
        const m = Object.assign(find(db.media, id, "media"), patch);
        persistStorefront();
        return m;
      }),
    remove: (id: string) => guard(() => {
      find(db.media, id, "media");
      db.media = db.media.filter((m) => m.id !== id);
      persistStorefront();
      return { ok: true as const };
    }),
  },
};
