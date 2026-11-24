"use client";

import * as React from "react";
import { RequirePermission } from "@/lib/permissions";
import { permissionForPath } from "@/lib/route-permissions";
import { useStorePathname } from "@/lib/store-route";

/** Central route guard — maps the current pathname to its permission and
 * renders the 403 page state when the effective role doesn't hold it. */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = useStorePathname();
  const permission = permissionForPath(pathname);
  if (!permission) return <>{children}</>;
  return <RequirePermission p={permission}>{children}</RequirePermission>;
}
