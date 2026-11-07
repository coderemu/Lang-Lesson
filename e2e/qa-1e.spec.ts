import { test, type Page } from "@playwright/test";
import { completedState, seed } from "./state";

/** Screenshots of the new screens of Chapter 1 at 390 × 844 and 1440 × 900 (qa/phase-1/1E). Run: npm run qa:1e */
const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

const screens: { file: string; path: string; act?: (page: Page) => Promise<void> }[] = [
  { file: "home-done", path: "/" },
  { file: "progress-done", path: "/progress" },
  { file: "rules-done", path: "/rules" },
  { file: "coverage-done", path: "/coverage" },
  { file: "settings", path: "/settings" },
  { file: "bank-overview-1.4", path: "/practice/1.4" },
  { file: "bank-problem-number", path: "/practice/1.1/2" },
  { file: "bank-problem-choice", path: "/practice/1.1/4" },
  {
    file: "bank-problem-self-check",
    path: "/practice/1.3/3",
    act: async (p) => void (await p.getByTestId("show-solution").click()),
  },
  { file: "l1.1-02-thermometer", path: "/lesson/1.1?screen=1.1.02" },
  { file: "l1.3-03-area-distribute", path: "/lesson/1.3?screen=1.3.03" },
  { file: "l1.3-06-proof-zero", path: "/lesson/1.3?screen=1.3.06" },
  {
    file: "l1.4-03-doubling",
    path: "/lesson/1.4?screen=1.4.03",
    act: async (p) => void (await p.getByRole("button", { name: /Double once more/ }).click()),
  },
  { file: "l1.4-05-square-tiles", path: "/lesson/1.4?screen=1.4.05" },
  { file: "l1.5-03-width-2", path: "/lesson/1.5?screen=1.5.03" },
  {
    file: "l1.6-03-fraction-cut",
    path: "/lesson/1.6?screen=1.6.03",
    act: async (p) => void (await p.getByRole("button", { name: /Cut each piece/ }).click()),
  },
  {
    file: "l1.6-09-fraction-add",
    path: "/lesson/1.6?screen=1.6.09",
    act: async (p) => {
      await p.locator("svg[role=slider]").click();
      await p.locator("svg[role=slider]").click();
    },
  },
  { file: "l1.7-06-proof-theorem-4", path: "/lesson/1.7?screen=1.7.06" },
  {
    file: "l1.8-03-fraction-invert",
    path: "/lesson/1.8?screen=1.8.03",
    act: async (p) => void (await p.getByRole("button", { name: /Turn upside down/ }).click()),
  },
  { file: "l1.8-13-practice", path: "/lesson/1.8?screen=1.8.13" },
  { file: "l1.8-15-summary", path: "/lesson/1.8?screen=1.8.15" },
];

for (const vp of viewports) {
  for (const s of screens) {
    test(`1E screenshot ${s.file} at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await seed(page, completedState());
      await page.goto(s.path);
      await page.evaluate(() => document.fonts.ready);
      if (s.act) await s.act(page);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `qa/phase-1/1E/${s.file}-${vp.name}.png`,
        fullPage: s.file.endsWith("-done"),
      });
    });
  }
  test(`1E screenshot design-system widgets at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/design-system#widgets");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page
      .locator("#widgets")
      .screenshot({ path: `qa/phase-1/1E/design-system-widgets-${vp.name}.png` });
  });
}
