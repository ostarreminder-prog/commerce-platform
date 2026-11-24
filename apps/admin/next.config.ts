import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@repo/ui", "@repo/mocks", "@repo/contracts", "@repo/api-client", "@repo/copilot", "@repo/storefront-sections"],
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default withNextIntl(nextConfig);
