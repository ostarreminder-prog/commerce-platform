/**
 * Cross-app state sync (demo, no backend).
 *
 * Admin (:3000) and storefront (:3001) each keep an in-memory `db`. Cookies are
 * the only storage shared across ports on the same host — they ignore the port,
 * which is what `cp_theme_shares` already relies on. Storefront-facing slices
 * are serialized here into chunked cookies so a change made in the admin
 * reaches the storefront app — and so merchant edits survive a page reload.
 *
 * Budget: browsers cap ~4KB per cookie and ~180 cookies per domain — and every
 * request to the dev server re-sends the whole jar, so the total payload also
 * has to stay under the HTTP header limit (~16KB). Raw JSON can't do that: a
 * single theme is already ~100KB once Arabic text is URL-encoded. So slices are
 * gzipped via CompressionStream and stored as ~3.4KB base64 chunks — the full
 * storefront payload lands around ~10KB encoded.
 */

const PREFIX = "cp_db_";
const INDEX = `${PREFIX}index`;
/* Chunk the ENCODED payload: cookie size limits count bytes on the wire and
 * Arabic JSON inflates ~3-6× under percent-encoding — and compresses right
 * back down under gzip+base64. */
const CHUNK_CHARS = 3400;
const MAX_CHUNKS_PER_SLICE = 40;

export type SyncSlice =
  | "themes"
  | "pages"
  | "menus"
  | "domains"
  | "storefrontSeo"
  | "seoRedirects"
  | "stores"
  | "media"
  | "paymentSettings"
  | "shippingSettings"
  | "taxSettings"
  | "maintenance";

const SLICES: SyncSlice[] = [
  "themes",
  "pages",
  "menus",
  "domains",
  "storefrontSeo",
  "seoRedirects",
  "stores",
  "media",
  "paymentSettings",
  "shippingSettings",
  "taxSettings",
  "maintenance",
];

const canUseCookies = () => typeof document !== "undefined";

const gzipToBase64 = async (text: string): Promise<string> => {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("gzip"));
  const u8 = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = "";
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(bin);
};

const base64ToGzip = async (b64: string): Promise<string> => {
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const stream = new Blob([u8]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
};

/** `value` must already be cookie-safe (pre-encoded or ASCII). */
const setCookie = (name: string, value: string, maxAge = 30 * 24 * 3600) => {
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};samesite=lax`;
};
const clearCookie = (name: string) => {
  document.cookie = `${name}=;path=/;max-age=0;samesite=lax`;
};

/** Raw cookie value — decoding happens once after the chunks are reassembled,
 * since a chunk boundary can split a multi-byte %XX escape. */
const readCookie = (name: string): string | null => {
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  if (!raw) return null;
  return raw.slice(raw.indexOf("=") + 1);
};

type Index = Partial<Record<SyncSlice, number>>;

const readIndex = (): Index => {
  const raw = readCookie(INDEX);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Index;
  } catch {
    return {};
  }
};

const writeIndex = (index: Index) => setCookie(INDEX, JSON.stringify(index));

/** Drop `cp_db_*` cookies the index doesn't reference. Chunks written by older
 * builds (uncompressed, or written after the index cookie was lost) ride every
 * request and can push request headers past the server limit → HTTP 431. Runs
 * once per page on hydration. */
let pruned = false;
export const pruneStaleCookies = () => {
  if (!canUseCookies() || pruned) return;
  pruned = true;
  const index = readIndex();
  const live = new Set<string>([INDEX]);
  for (const [slice, count] of Object.entries(index)) {
    for (let i = 0; i < (count ?? 0); i++) live.add(`${PREFIX}${slice}_${i}`);
  }
  for (const entry of document.cookie.split("; ")) {
    const name = entry.slice(0, entry.indexOf("="));
    if (name.startsWith(PREFIX) && !live.has(name)) clearCookie(name);
  }
};

/** Persist one slice into `cp_db_<slice>_<i>` chunk cookies. Returns true when it fit. */
export const persistSlice = async (slice: SyncSlice, value: unknown): Promise<boolean> => {
  if (!canUseCookies()) return false;
  let encoded: string;
  try {
    encoded = await gzipToBase64(JSON.stringify(value ?? null));
  } catch {
    return false;
  }
  const index = readIndex();
  const prev = index[slice] ?? 0;
  if (encoded.length > CHUNK_CHARS * MAX_CHUNKS_PER_SLICE) {
    // Keep previously persisted (smaller) version — drop nothing silently.
    console.warn(`[api-client] slice "${slice}" exceeds cookie budget (${encoded.length} chars) — not synced cross-app`);
    return false;
  }
  const chunks = Math.max(1, Math.ceil(encoded.length / CHUNK_CHARS));
  for (let i = 0; i < chunks; i++) {
    setCookie(`${PREFIX}${slice}_${i}`, encoded.slice(i * CHUNK_CHARS, (i + 1) * CHUNK_CHARS));
  }
  for (let i = chunks; i < prev; i++) clearCookie(`${PREFIX}${slice}_${i}`);
  if (index[slice] !== chunks) {
    index[slice] = chunks;
    writeIndex(index);
  }
  return true;
};

/** Reassemble a persisted slice — null when nothing was stored. Tolerates the
 * legacy uncompressed format (raw JSON chunks) for jars written by older
 * builds. */
export const loadSlice = async <T>(slice: SyncSlice): Promise<T | null> => {
  if (!canUseCookies()) return null;
  const chunks = readIndex()[slice];
  if (!chunks) return null;
  let encoded = "";
  for (let i = 0; i < chunks; i++) {
    const part = readCookie(`${PREFIX}${slice}_${i}`);
    if (part === null) return null;
    encoded += part;
  }
  try {
    return JSON.parse(await base64ToGzip(encoded)) as T;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(encoded)) as T;
    } catch {
      return null;
    }
  }
};

/** Write every storefront-facing slice — call after mutating endpoints.
 * Slices write sequentially so the shared index cookie doesn't race. */
export const syncStorefront = async (db: Record<SyncSlice, unknown>) => {
  for (const slice of SLICES) await persistSlice(slice, db[slice]);
};

/** Read all persisted slices (used at module init to hydrate `db`, and on every
 * storefront-facing read so a SPA session sees cross-port edits). */
export const loadSyncedSlices = async (): Promise<Partial<Record<SyncSlice, unknown>>> => {
  const out: Partial<Record<SyncSlice, unknown>> = {};
  for (const slice of SLICES) {
    const v = await loadSlice(slice);
    if (v !== null) out[slice] = v;
  }
  return out;
};
