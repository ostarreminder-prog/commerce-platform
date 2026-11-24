"use client";

import * as React from "react";
import type { Permission, Role } from "@repo/contracts";
import { setRequestContext, useCurrentUser, useRoles } from "@repo/api-client";
import { Button } from "@repo/ui/components/button";
import { PageError } from "@repo/ui/components/page-error";
import { useMsg } from "@repo/ui/hooks/use-msg";
import Link from "@/components/store-link";

const STORAGE_KEY = "admin-role-id";

interface PermissionsValue {
  /** Every role in the store (system + custom) — feeds the "view as" switcher. */
  roles: Role[];
  /** Effective role — the signed-in staff role, or the impersonated one. */
  role: Role | null;
  /** Impersonate another role (demo switcher) — persisted in localStorage. */
  setRole: (roleId: string) => void;
  /** Effective permission set — the same set the copilot tools filter on. */
  permissions: Set<Permission>;
  can: (permission: Permission) => boolean;
  /** True while me/roles resolve — guards stay permissive to avoid a 403 flash. */
  loading: boolean;
}

const PermissionsContext = React.createContext<PermissionsValue | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const me = useCurrentUser();
  const rolesQuery = useRoles();
  const roles = React.useMemo(() => rolesQuery.data ?? [], [rolesQuery.data]);
  const [override, setOverride] = React.useState<string | null>(null);

  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setOverride(saved);
  }, []);

  const loading = me.isPending || rolesQuery.isPending;
  const role = roles.find((r) => r.id === override) ?? me.data?.role ?? null;
  const permissions = React.useMemo(() => new Set<Permission>(role?.permissions ?? []), [role]);

  /* Push the effective permission set into the mock "server" — commerce.*
   * mutations then enforce it server-side (requirePerm), not just in the UI.
   * While loading we publish `null` (unrestricted), matching can()'s
   * permissive fallback so hydration-time queries aren't denied. */
  React.useEffect(() => {
    setRequestContext({ permissions: loading ? null : permissions });
  }, [permissions, loading]);

  const value = React.useMemo<PermissionsValue>(
    () => ({
      roles,
      role,
      setRole: (roleId) => {
        window.localStorage.setItem(STORAGE_KEY, roleId);
        setOverride(roleId);
      },
      permissions,
      can: (permission) => loading || permissions.has(permission),
      loading,
    }),
    [roles, role, permissions, loading],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions() {
  const value = React.useContext(PermissionsContext);
  if (!value) throw new Error("usePermissions must be used inside PermissionsProvider");
  return value;
}

export function useCan(permission: Permission) {
  return usePermissions().can(permission);
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return useCan(permission) ? children : fallback;
}

/** Route-level guard — renders the unified `errors.403` page state when the effective role lacks `p`. */
export function RequirePermission({ p, children }: { p: Permission; children: React.ReactNode }) {
  const { can, loading } = usePermissions();
  const strictT = useMsg();
  const t = strictT as unknown as (key: string) => string;
  if (loading || can(p)) return <>{children}</>;
  return (
    <PageError
      errorKey="403"
      className="mt-10"
      action={
        <Button asChild variant="outline">
          <Link href="/">{t("errors.403.action")}</Link>
        </Button>
      }
    />
  );
}
