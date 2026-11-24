import { defineConfig } from "@playwright/test";

/**
 * Smoke test: every screen loads without uncaught errors.
 * Requires the four dev servers running (pnpm dev) or run with `pnpm test:serve`.
 */
const ADMIN = process.env.ADMIN_URL ?? "http://localhost:3000";
const STOREFRONT = process.env.STOREFRONT_URL ?? "http://localhost:3001";
const SUPER_ADMIN = process.env.SUPER_ADMIN_URL ?? "http://localhost:3002";
const PARTNERS = process.env.PARTNERS_URL ?? "http://localhost:3003";

export const BASES = { ADMIN, STOREFRONT, SUPER_ADMIN, PARTNERS };

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  workers: 4,
  reporter: [["list"]],
  use: { locale: "ar-SA", timezoneId: "Asia/Riyadh" },
});
