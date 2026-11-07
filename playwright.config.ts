import { defineConfig } from "@playwright/test";

/** Acceptance tests run at 390 × 844 (mobile) and 1440 × 900 (desktop). The qa-*.spec.ts files only make screenshots: run them with playwright.qa.config.ts. */
export default defineConfig({
  testDir: "e2e",
  testIgnore: /(qa-.*|pwa)\.spec\.ts/,
  reporter: "list",
  use: { baseURL: "http://localhost:5173" },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
