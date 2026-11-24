import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PREFIX = "cp_db_";
/** Browsers/proxies reject requests whose headers exceed ~16KB (HTTP 431).
 * The shared `cp_db_*` sync jar is designed for ~10KB, but stale uncompressed
 * chunks from older builds can inflate it past the limit — and the page then
 * never loads, so client-side cleanup can't run. When the jar is over budget
 * the middleware deletes every `cp_db_*` cookie server-side and redirects so
 * the retried request arrives clean. */
/* The jar is ~7.5KB with stubbed themes and ~12.5KB once an applied/published
 * theme travels in full — both safely under the ~16KB request-header limit.
 * Budget sits between the two so legit jars pass while stale blowups get wiped. */
const COOKIE_BUDGET = 14_000;

export function middleware(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  if (cookieHeader.length <= COOKIE_BUDGET) return NextResponse.next();
  const res = NextResponse.redirect(request.url);
  for (const entry of cookieHeader.split(";")) {
    const name = entry.trim().split("=")[0];
    if (name && name.startsWith(PREFIX)) res.cookies.delete(name);
  }
  return res;
}

export const config = { matcher: "/:path*" };
