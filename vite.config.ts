/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => ({
  base: process.env.VITE_BASE ?? "/",
  plugins: [react()],
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
}));
