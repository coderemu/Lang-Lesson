import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { completedState, seed } from "./state";

/** Accessibility check with axe (WCAG 2.2 AA). Serious and critical issues must be zero. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function audit(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400); // the feedback sheet slides in for 180 ms
  const result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const bad = result.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const summary = bad.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(" ")} :: ${v.nodes[0]?.failureSummary?.split("\n")[1] ?? ""}`,
  );
  expect(summary, name).toEqual([]);
}

test.describe("axe", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) > 900, "mobile only");
  test.beforeEach(async ({ page }) => seed(page, completedState()));

  for (const [name, path] of [
    ["Home", "/"],
    ["Progress", "/progress"],
    ["Rule book", "/rules"],
    ["Coverage", "/coverage"],
    ["Settings", "/settings"],
    ["Bank overview", "/practice/1.4"],
    ["Bank problem: number", "/practice/1.1/2"],
    ["Bank problem: choice", "/practice/1.1/4"],
    ["Bank problem: self-check", "/practice/1.3/3"],
    ["Design system", "/design-system"],
  ] as const) {
    test(name, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading").first()).toBeVisible();
      await audit(page, name);
    });
  }

  const screens: [string, string, string][] = [
    ["number line place", "1.2", "1.2.01"],
    ["thermometer", "1.2", "1.2.02"],
    ["number line hops", "1.2", "1.2.03"],
    ["number line compare + choice", "1.2", "1.2.04"],
    ["rule card", "1.2", "1.2.05"],
    ["number line mirror + number input", "1.2", "1.2.06"],
    ["proof stepper", "1.2", "1.2.07"],
    ["balance", "1.2", "1.2.10"],
    ["number input", "1.2", "1.2.11"],
    ["two number inputs", "1.2", "1.2.13"],
    ["trap summary", "1.2", "1.2.14"],
    ["area model distribute", "1.3", "1.3.03"],
    ["area model doubling strip", "1.4", "1.4.03"],
    ["square tiles", "1.4", "1.4.05"],
    ["area model width 2", "1.5", "1.5.03"],
    ["fraction strips cut", "1.6", "1.6.03"],
    ["fraction strips add", "1.6", "1.6.09"],
    ["fraction strips invert", "1.8", "1.8.03"],
    ["choice", "1.5", "1.5.04"],
  ];
  for (const [name, lesson, id] of screens) {
    test(`lesson screen: ${name}`, async ({ page }) => {
      await page.goto(`/lesson/${lesson}?screen=${id}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await audit(page, `${name} (${id})`);
    });
  }

  test("feedback sheets: correct, not quite, wrong reason, hint drawer", async ({ page }) => {
    await page.goto("/lesson/1.2?screen=1.2.11");
    await page.getByLabel("Your answer").fill("-2");
    await page.getByTestId("primary").click();
    await expect(page.getByLabel("Feedback")).toBeVisible();
    await audit(page, "correct sheet");
    await page.goto("/lesson/1.2?screen=1.2.12");
    await page.getByLabel("Your answer").fill("2");
    await page.getByTestId("primary").click();
    await expect(page.getByLabel("Feedback")).toBeVisible();
    await audit(page, "not-quite sheet");
    await page.goto("/lesson/1.2?screen=1.2.09");
    await page.getByRole("group", { name: "Reasons" }).getByRole("button", { name: "N4" }).click();
    await page.getByTestId("primary").click();
    await expect(page.getByLabel("Feedback")).toBeVisible();
    await audit(page, "wrong-reason sheet");
    await page.goto("/lesson/1.2?screen=1.2.13");
    await page.getByRole("button", { name: /Hint/ }).click();
    await audit(page, "hint drawer");
  });
});
