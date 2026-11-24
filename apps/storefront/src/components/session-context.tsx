"use client";

import * as React from "react";
import { useCreateCustomer, useCustomerList } from "@repo/api-client";
import type { Customer } from "@repo/contracts";

export type SessionStatus = "loading" | "guest" | "authed";

interface SessionValue {
  /** The signed-in customer — `undefined` for guests and while resolving. */
  customer: Customer | undefined;
  /** Fallback demo customer used for guest checkout (first seeded customer). */
  demo: Customer | undefined;
  /** Customer the current flows operate on — session customer or demo. */
  effective: Customer | undefined;
  status: SessionStatus;
  /** Mock auth: credentials aren't checked — any login opens the demo account. */
  login: () => void;
  /** Sign in an explicit customer id (used after register creates the record). */
  signIn: (customerId: string) => void;
  /** Register a real customer record via the mock API, then sign it in. */
  register: ReturnType<typeof useCreateCustomer>;
  logout: () => void;
}

const SESSION_KEY = "nakhla-session";
const SessionContext = React.createContext<SessionValue | null>(null);

/**
 * Storefront session — a localStorage-held customer id standing in for real
 * auth until the backend exists. The seeded demo customer signs in on any
 * credentials; register() creates an actual mock customer row.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data: customers = [], isPending } = useCustomerList();
  const register = useCreateCustomer();
  const [customerId, setCustomerId] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      setCustomerId(localStorage.getItem(SESSION_KEY));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const setSession = React.useCallback((id: string | null) => {
    setCustomerId(id);
    try {
      if (id) localStorage.setItem(SESSION_KEY, id);
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const demo = customers[0];
  const customer = customerId ? customers.find((c) => c.id === customerId) : undefined;
  const status: SessionStatus = !hydrated || isPending ? "loading" : customer ? "authed" : "guest";

  const value = React.useMemo<SessionValue>(
    () => ({
      customer,
      demo,
      effective: customer ?? demo,
      status,
      login: () => demo && setSession(demo.id),
      signIn: setSession,
      register,
      logout: () => setSession(null),
    }),
    [customer, demo, status, register, setSession],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = React.useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
