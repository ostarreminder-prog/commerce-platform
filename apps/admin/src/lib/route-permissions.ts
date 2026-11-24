import type { Permission } from "@repo/contracts";

/* Central route → permission map for the merchant panel. `RouteGuard`
 * (components/shell) resolves the first matching prefix against the
 * store-relative pathname. Routes not listed are open to every signed-in
 * role: `/` (home), `/copilot`, `/onboarding`. */
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission | null }[] = [
  /* settings sub-sections first — more specific prefixes win over `/settings` */
  /* `/settings/profile` is the signed-in merchant's own page — open to every role. */
  { prefix: "/settings/profile", permission: null },
  { prefix: "/settings/billing", permission: "billing.manage" },
  { prefix: "/settings/developers", permission: "developers.manage" },
  { prefix: "/settings/staff", permission: "staff.manage" },
  { prefix: "/settings/roles", permission: "staff.manage" },
  { prefix: "/settings/audit", permission: "audit.read" },
  { prefix: "/settings", permission: "settings.manage" },
  { prefix: "/orders", permission: "orders.read" },
  { prefix: "/returns", permission: "returns.manage" },
  { prefix: "/abandoned-carts", permission: "marketing.manage" },
  { prefix: "/customers", permission: "customers.read" },
  { prefix: "/products", permission: "products.read" },
  { prefix: "/reviews", permission: "products.read" },
  { prefix: "/categories", permission: "products.read" },
  { prefix: "/collections", permission: "products.read" },
  { prefix: "/brands", permission: "products.read" },
  { prefix: "/inventory", permission: "products.read" },
  { prefix: "/imports", permission: "products.read" },
  { prefix: "/inbox", permission: "conversations.read" },
  { prefix: "/conversations", permission: "conversations.read" },
  { prefix: "/approvals", permission: "approvals.decide" },
  { prefix: "/agents", permission: "agents.read" },
  { prefix: "/knowledge", permission: "agents.read" },
  { prefix: "/shipments", permission: "shipments.manage" },
  { prefix: "/shipping", permission: "settings.manage" },
  { prefix: "/invoices", permission: "invoices.read" },
  { prefix: "/marketing", permission: "marketing.manage" },
  { prefix: "/reports", permission: "reports.read" },
  { prefix: "/storefront", permission: "storefront.manage" },
  { prefix: "/store-design", permission: "storefront.manage" },
  { prefix: "/media", permission: "storefront.manage" },
  { prefix: "/apps", permission: "apps.manage" },
];

/** First matching prefix wins — the map lists nested prefixes longest-first. */
export function permissionForPath(pathname: string): Permission | null {
  const hit = ROUTE_PERMISSIONS.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  return hit?.permission ?? null;
}
