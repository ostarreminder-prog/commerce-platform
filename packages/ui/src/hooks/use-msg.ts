"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { parseZodIssue } from "../lib/zod-error-map";
import { apiErrorKey, type ApiErrorLike } from "../lib/api-error-map";

/** Translator bound to the shared `msg.*` message namespace (see docs/UI_MESSAGES.md). */
export function useMsg() {
  return useTranslations("msg");
}

/**
 * Translates a serialized zod issue message (from `msgErrorMap`) into localized text.
 * Returns the raw message unchanged when it isn't a serialized msg issue.
 */
export function useZodMessage() {
  const strictT = useMsg();
  const t = strictT as unknown as (key: string, params?: Record<string, string | number>) => string;
  return React.useCallback(
    (message: string | undefined | null): string | undefined => {
      if (!message) return undefined;
      const issue = parseZodIssue(message);
      return issue ? t(issue.key, issue.params) : message;
    },
    [t],
  );
}

/** Resolves an API error `{ code }` to the matching `msg.*` key (defaults to common.server.error). */
export function useApiErrorKey() {
  return React.useCallback((err: unknown): string => {
    if (err && typeof err === "object" && "code" in err) {
      return apiErrorKey((err as ApiErrorLike).code);
    }
    return "common.server.error";
  }, []);
}
