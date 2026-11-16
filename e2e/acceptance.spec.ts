import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { completedState, seed } from "./state";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const allRows = read("../content/coverage.json").rows as { chapter: number; kind: string }[];
const rowsOf = (c: number) => allRows.filter((r) => r.chapter === c);
const countable = (c: number) => rowsOf(c).filter((r) => r.kind !== "skip").length;

/** Criterion 6: the Coverage screen shows every row of the Chapter 1 map. Each row links to an existing screen or problem. */
test.describe("coverage screen (criterion 6)", () => {
  for (const chapter of [1, 2]) {
    test(`after everything is done, every Chapter ${chapter} row is covered and the total is full`, async ({
      page,
    }) => {
      await seed(page, completedState(new Date(), [1, 2]));
      await page.goto("/coverage");
      const rows = page.locator(
        `section[aria-label="Chapter ${chapter}"] [data-testid="coverage-row"]`,
      );
      await expect(rows).toHaveCount(rowsOf(chapter).length);
      await expect(
        page.locator(
          `section[aria-label="Chapter ${chapter}"] [data-testid="coverage-row"][data-status="covered"]`,
        ),
      ).toHaveCount(countable(chapter));
      await expect(page.getByTestId(`total-${chapter}`)).toHaveText(
        `Chapter ${chapter}: ${countable(chapter)} of ${countable(chapter)} covered`,
      );
      for (const c of [3, 4])
        await expect(page.getByTestId(`total-${c}`)).toContainText(`Coming in phase ${c}`);
    });
  }

  test("the Chapter 2 skip row shows the later-chapter note", async ({ page }) => {
    await page.goto("/coverage");
    const skip = page.locator('[data-testid="coverage-row"][data-status="skip"]');
    await expect(skip).toHaveCount(rowsOf(2).filter((r) => r.kind === "skip").length);
    await expect(skip.first()).toContainText("Later chapter in Lang");
  });

  test("with no progress, no row is covered", async ({ page }) => {
    await page.goto("/coverage");
    await expect(page.getByTestId("coverage-row")).toHaveCount(allRows.length);
    await expect(page.locator('[data-testid="coverage-row"][data-status="covered"]')).toHaveCount(
      0,
    );
    await expect(page.getByTestId("total-1")).toHaveText(`Chapter 1: 0 of ${countable(1)} covered`);
    await expect(page.getByTestId("total-2")).toHaveText(`Chapter 2: 0 of ${countable(2)} covered`);
  });

  test("every link of every row opens an existing lesson screen or bank problem", async ({
    page,
  }) => {
    test.skip(test.info().project.name !== "mobile");
    test.setTimeout(300_000);
    await page.goto("/coverage");
    await expect(page.getByTestId("coverage-row").first()).toBeVisible();
    const hrefs = await page
      .locator('[data-testid="coverage-row"] a')
      .evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href") as string))]);
    expect(hrefs.length).toBeGreaterThan(100);
    for (const href of hrefs) {
      await page.goto(href);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      await expect(page.getByText(/not available/i)).toHaveCount(0);
    }
  });
});

/** Criterion 8: /design-system shows every widget and every mode. */
test("design system shows every widget mode (criterion 8)", async ({ page }) => {
  await page.goto("/design-system");
  await expect(page.locator("#widgets")).toBeVisible();
  const names = await page.locator("#widgets p").allTextContents();
  const expected = [
    "Number line · place · live",
    "Number line · place · correct and wrong",
    "Number line · hops · live",
    "Number line · compare",
    "Number line · mirror",
    "Rule card picture · mirror",
    "Thermometer · guess · live",
    "Balance · solve · live",
    "Proof stepper · start",
    "Proof stepper · wrong reason",
    "Area model · distribute · live (with turn)",
    "Area model · width-2 · live (odd and even)",
    "Area model · doubling-strip · live",
    "Area model · doubling-strip · halving",
    "Square tiles · expand · live",
    "Fraction strips · cut · live",
    "Fraction strips · add · live",
    "Fraction strips · invert · live",
    "Elimination board · two-unknowns · live (with balances)",
    "Elimination board · three-unknowns · live",
    "Elimination board · general · live (ad − bc readout)",
    "Trap summary · live",
  ];
  for (const e of expected) expect(names, e).toContain(e);
});

/** The home screen with everything done. */
test("home and progress with everything done", async ({ page }) => {
  await seed(page, completedState());
  await page.goto("/progress");
  await expect(page.getByLabel("By chapter")).toContainText("8 of 8 lessons");
});
