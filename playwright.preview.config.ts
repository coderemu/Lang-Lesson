import { defineConfig } from "@playwright/test";

/** Tests against the production build served by `vite preview` (service worker, offline, update). Run: npm run e2e:preview */
export default defineConfig({
  testDir: "e2e",
  testMatch: /pwa\.spec\.ts/,
  reporter: "list",
  workers: 1,
  timeout: 120_000,
  use: { baseURL: "http://localhost:4173", viewport: { width: 390, height: 844 } },
  webServer: {
    command: "npm run build && npm run preview -- --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
