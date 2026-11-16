import { test } from "@playwright/test";
test.use({ viewport: { width: 390, height: 844 } });

/** Screenshots of the new Chapter 2 widget modes. Run with playwright.qa.config.ts. */
const shots: [string, string][] = [
  ["two-unknowns-balance", "/lesson/2.1?screen=2.1.03"],
  ["no-solution", "/lesson/2.1?screen=2.1.06"],
  ["three-unknowns", "/lesson/2.2?screen=2.2.04"],
  ["general", "/lesson/2.3?screen=2.3.08"],
  ["bank-pair", "/practice/2.1/1"],
];
for (const [name, path] of shots) {
  test(name, async ({ page }) => {
    await page.goto(path);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `qa/phase-2/shots/${name}-390.png`, fullPage: true });
  });
}
