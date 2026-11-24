import type { Media } from "@repo/contracts";

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.8;

/** Canvas downscale to max 1600px edge → jpeg dataURL + dimensions + approx byte size. */
export const compressImage = (m: Media): Promise<{ url: string; width: number; height: number; sizeBytes: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("canvas"));
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      resolve({ url, width: canvas.width, height: canvas.height, sizeBytes: Math.round((url.length * 3) / 4) });
    };
    img.onerror = () => reject(new Error("load"));
    img.src = m.url;
  });
