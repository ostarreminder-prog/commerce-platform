import * as mocks from "@repo/mocks";
import { db as commerceDb } from "./commerce/db";

/** Mock Agent Studio transport state — shared by studio.ts and studio-sim.ts.
 * Knowledge is NOT cloned here: sources live in the commerce store so ones
 * added or linked on /knowledge immediately feed the test lab (single truth). */
export const db = {
  agents: structuredClone(mocks.agentTree),
  versions: structuredClone(mocks.agentVersions),
  tests: structuredClone(mocks.agentTestCases),
  live: structuredClone(mocks.liveSessions),
  history: structuredClone(mocks.sessionHistory),
  phones: structuredClone(mocks.phoneNumbers),
  whatsapp: structuredClone(mocks.whatsappNumbers),
};

/* Access via `commerceDb.knowledge` — never capture the array (remove()
 * reassigns it, so a cached reference would go stale). */
export { commerceDb };

export const respond = <T>(value: T, ms = 300): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));

export const fail = (message: string): never => {
  throw new Error(message);
};

export const findAgent = (id: string) => db.agents.find((a) => a.id === id) ?? fail(`Agent ${id} not found`);

export const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
