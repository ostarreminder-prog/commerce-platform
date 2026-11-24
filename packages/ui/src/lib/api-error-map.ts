/**
 * Maps API error `code`s to `msg.*` message keys (docs/UI_MESSAGES.md §23.4).
 * Any unknown code falls back to `common.server.error`.
 */

export interface ApiErrorLike {
  code?: string | null;
  message?: string;
}

export const API_ERROR_KEYS: Record<string, string> = {
  NETWORK: "common.network.error",
  OFFLINE: "common.network.offline",
  TIMEOUT: "common.timeout",
  RATE_LIMITED: "common.rateLimit",
  UNAUTHORIZED: "common.session.expired",
  FORBIDDEN: "common.forbidden.title",
  NOT_FOUND: "common.notFound.title",
  CONFLICT: "common.conflict",
  SERVER: "common.server.error",
};

export function apiErrorKey(code?: string | null): string {
  return (code && API_ERROR_KEYS[code]) || "common.server.error";
}

export function apiErrorMessageKey(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return apiErrorKey((err as ApiErrorLike).code);
  }
  return "common.server.error";
}
