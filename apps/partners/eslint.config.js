import next from "@repo/config/eslint/next";

// Screens must consume mock data only through @repo/api-client (docs: AGENTS.md rules).
const noDirectMocks = {
  files: ["**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      { patterns: [{ group: ["@repo/mocks", "@repo/mocks/*"], message: "Import mock data through @repo/api-client instead." }] },
    ],
  },
};

export default [...next, noDirectMocks];
