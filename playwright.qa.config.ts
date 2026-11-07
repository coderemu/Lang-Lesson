import { defineConfig } from "@playwright/test";

/** Screenshot specs (qa-*.spec.ts). Each spec sets its own viewport. */
export default defineConfig({
  testDir: "e2e",
  testMatch: /qa-.*\.spec\.ts/,
  reporter: "list",
  use: { baseURL: "http://localhost:5173" },
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
