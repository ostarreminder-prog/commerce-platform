/** Media url helpers — `placeholder:<hue>` fixtures vs real image urls. */

/** True when the url is an actual image (http(s)/data/blob) rather than a placeholder fixture. */
export const isRealImageUrl = (url: string | null | undefined): url is string =>
  Boolean(url) && /^(https?:|data:|blob:)/i.test((url as string).trim());

/** Extract the hue from a `placeholder:<hue>` fixture url (null when not a placeholder). */
export function placeholderHue(url: string | null | undefined): number | null {
  const match = /^placeholder:(\d+)/.exec(url ?? "");
  return match ? Number(match[1]) : null;
}
