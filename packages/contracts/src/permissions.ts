/* Permission catalog — `<domain>.<read|manage|…>` grouped by admin section.
 * `Role.permissions` holds names from this catalog; the admin route guards,
 * element-level `useCan`/`Can` checks and the copilot tool registry all gate
 * on the same names. */
export const PERMISSION_GROUPS = {
  orders: ["orders.read", "orders.manage", "orders.refund", "prices.update"],
  catalog: ["products.read", "products.manage", "inventory.manage"],
  customers: ["customers.read", "customers.manage", "customers.export"],
  conversations: ["conversations.read", "conversations.reply", "approvals.decide"],
  agents: ["agents.read", "agents.manage", "knowledge.manage"],
  operations: ["shipments.manage", "invoices.read", "returns.manage"],
  growth: ["marketing.manage", "reports.read"],
  store: ["storefront.manage", "apps.manage"],
  admin: ["settings.manage", "staff.manage", "billing.manage", "audit.read", "developers.manage"],
} as const;

export type PermissionGroup = keyof typeof PERMISSION_GROUPS;
export type Permission = (typeof PERMISSION_GROUPS)[PermissionGroup][number];
export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat() as Permission[];
/** The flat catalog — same list as `ALL_PERMISSIONS` (spec name). */
export const PERMISSIONS = ALL_PERMISSIONS;

/* Seven system roles ship with every store (`Role.isSystem` — undeletable).
 * Their fixture rows live in @repo/mocks; the /settings/roles editor lists
 * them as the built-ins a merchant can clone into custom roles. */
export type DefaultRoleKey = "owner" | "admin" | "catalog" | "orders" | "support" | "marketing" | "readonly";

export const DEFAULT_ROLES: Record<DefaultRoleKey, Permission[]> = {
  owner: [...ALL_PERMISSIONS],
  admin: ALL_PERMISSIONS.filter((p) => p !== "billing.manage" && p !== "developers.manage"),
  catalog: ["products.read", "products.manage", "inventory.manage"],
  orders: ["orders.read", "orders.manage", "orders.refund", "prices.update", "customers.read", "invoices.read", "shipments.manage", "returns.manage"],
  support: ["orders.read", "products.read", "customers.read", "conversations.read", "conversations.reply", "approvals.decide", "agents.read", "returns.manage"],
  marketing: ["products.read", "customers.read", "customers.export", "marketing.manage", "reports.read"],
  readonly: ALL_PERMISSIONS.filter((p) => p.endsWith(".read")),
};

/* Platform (super-admin) actor permissions — the copilot `platform.*` tools
 * gate on these. Kept separate from the merchant catalog on purpose. */
export const PLATFORM_PERMISSIONS = ["platform.read", "platform.jobs.manage", "platform.tenants.manage"] as const;
export type PlatformPermission = (typeof PLATFORM_PERMISSIONS)[number];
