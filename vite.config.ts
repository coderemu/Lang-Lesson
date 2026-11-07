/// <reference types="vitest/config" />
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

/** package version + short git hash (+ BUILD_ID when set). Shown in Settings → About. */
function appVersion(): string {
  let hash = "dev";
  try {
    hash = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    /* not a git checkout */
  }
  return `${pkg.version}+${hash}${process.env.BUILD_ID ? `.${process.env.BUILD_ID}` : ""}`;
}

const base = process.env.VITE_BASE ?? "/";
const scope = base.endsWith("/") ? base : `${base}/`;
export default defineConfig(({ mode }) => {
  const testing = mode === "test";
  return {
    base,
    define: { __APP_VERSION__: JSON.stringify(appVersion()) },
    plugins: [
      react(),
      !testing &&
        VitePWA({
          registerType: "prompt",
          includeAssets: ["favicon.svg", "apple-touch-icon.png"],
          manifest: {
            name: "Lang Lessons",
            short_name: "Lang",
            description: "Interactive lessons for Serge Lang's Basic Mathematics.",
            theme_color: "#1565C0", // --color-primary
            background_color: "#FFFFFF",
            display: "standalone",
            start_url: scope,
            scope,
            icons: [
              {
                src: `${scope}icons/icon-192.png`,
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
              },
              {
                src: `${scope}icons/icon-512.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
              },
              {
                src: `${scope}icons/maskable-512.png`,
                sizes: "512x512",
                type: "image/png",
                purpose: "maskable",
              },
            ],
          },
          workbox: {
            // The app shell, every lesson, bank and content chunk, and the woff2 fonts. KaTeX ttf and woff files are left out.
            globPatterns: ["**/*.{js,css,html,woff2,svg,png,json,webmanifest}"],
            navigateFallback: `${scope}index.html`,
            cleanupOutdatedCaches: true,
          },
          devOptions: { enabled: false },
        }),
    ],
    resolve: testing
      ? {
          alias: {
            "virtual:pwa-register/react": fileURLToPath(
              new URL("./src/test/pwa-register-stub.ts", import.meta.url),
            ),
          },
        }
      : undefined,
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      include: ["src/**/*.test.{ts,tsx}"],
      css: false,
      coverage: {
        provider: "v8" as const,
        include: ["src/engine/**"],
        exclude: ["**/*.test.*"],
        thresholds: { statements: 90, lines: 90 },
      },
    },
  };
});
