import { test } from "@playwright/test";

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const routes = [
  { path: "/", file: "home" },
  { path: "/progress", file: "progress" },
  { path: "/rules", file: "rules" },
  { path: "/design-system", file: "design-system" },
];

for (const vp of viewports) {
  for (const r of routes) {
    test(`screenshot ${r.file} at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(r.path);
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({
        path: `qa/phase-1/1A/${r.file}-${vp.name}.png`,
        fullPage: r.file === "design-system",
      });
    });
  }
}
