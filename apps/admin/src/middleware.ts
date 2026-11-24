import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PREFIX = "cp_db_";
/** Same jar guard as the storefront — `cp_db_*` cookies are shared across
 * ports on this host, so an oversized jar breaks every app on the domain. See
 * apps/storefront/src/middleware.ts. */
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
