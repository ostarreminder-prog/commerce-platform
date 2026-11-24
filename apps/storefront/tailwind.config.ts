import type { Config } from "tailwindcss";
import preset from "@repo/config/tailwind";

const config: Config = {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}", "../../packages/storefront-sections/src/**/*.{ts,tsx}"],
};

export default config;
