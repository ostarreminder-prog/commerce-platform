import { z } from "zod";

/**
 * Single zod error map returning `msg.validation.*` keys (docs/UI_MESSAGES.md §23.3).
 *
 * The map serializes issues to `__msg|<key>|<json-params>` so UI code can translate
 * them later with `useZodMessage()` (translation needs the React intl context).
 *
 * Enable globally once (e.g. in app providers): `installZodMsgErrorMap()`,
 * or pass `msgErrorMap` to individual schemas.
 */

export interface ZodMsgIssue {
  key: string;
  params?: Record<string, string | number>;
}

const PREFIX = "__msg|";

export function serializeZodIssue(issue: ZodMsgIssue): string {
  return issue.params ? `${PREFIX}${issue.key}|${JSON.stringify(issue.params)}` : `${PREFIX}${issue.key}`;
}

export function parseZodIssue(message: string | undefined): ZodMsgIssue | null {
  if (!message || !message.startsWith(PREFIX)) return null;
  const rest = message.slice(PREFIX.length);
  const sep = rest.indexOf("|");
  if (sep === -1) return { key: rest };
  try {
    return { key: rest.slice(0, sep), params: JSON.parse(rest.slice(sep + 1)) as Record<string, string | number> };
  } catch {
    return { key: rest.slice(0, sep) };
  }
}

/** Maps a zod issue to a `validation.*` key + params. */
export function zodIssueKey(issue: z.ZodIssueOptionalMessage): ZodMsgIssue {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") return { key: "validation.required" };
      if (issue.expected === "integer") return { key: "validation.integer" };
      if (issue.expected === "number") return { key: "validation.number" };
      return { key: "validation.required" };
    case z.ZodIssueCode.too_small: {
      const min = Number(issue.minimum);
      if (issue.type === "string") return { key: "validation.minLength", params: { min } };
      if (issue.type === "array") return { key: "validation.min", params: { min } };
      return { key: "validation.min", params: { min } };
    }
    case z.ZodIssueCode.too_big: {
      const max = Number(issue.maximum);
      if (issue.type === "string") return { key: "validation.maxLength", params: { max } };
      return { key: "validation.max", params: { max } };
    }
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return { key: "validation.email.format" };
      if (issue.validation === "url") return { key: "validation.url" };
      return { key: "validation.required" };
    case z.ZodIssueCode.invalid_date:
      return { key: "validation.dateRange" };
    case z.ZodIssueCode.custom:
      if (issue.params?.msgKey && typeof issue.params.msgKey === "string") {
        return { key: issue.params.msgKey, params: issue.params.msgParams as Record<string, string | number> | undefined };
      }
      return { key: "validation.required" };
    default:
      return { key: "validation.required" };
  }
}

export const msgErrorMap: z.ZodErrorMap = (issue, ctx) => {
  return { message: serializeZodIssue(zodIssueKey(issue)) || ctx.defaultError };
};

/** Install the msg error map globally for all zod schemas. Call once in app providers. */
export function installZodMsgErrorMap() {
  z.setErrorMap(msgErrorMap);
}

/** Helper for custom refinements: `.refine(fn, { params: { msgKey: "validation.iban" } })` or pass the key directly. */
export function msgKey(key: string, params?: Record<string, string | number>) {
  return { params: { msgKey: `validation.${key}`, msgParams: params } };
}
