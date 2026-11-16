import { expect, test } from "@playwright/test";
import { focusUntil, openScreen, pressContinue, typeInto } from "./lesson-helpers";

/** Criterion 3 for Chapter 2: every elimination board action works with the keyboard only (Tab and Enter). */
test("lesson 2.1: the board, multiply, add and answer with the keyboard only", async ({ page }) => {
  test.setTimeout(60_000);
  await openScreen(page, "2.1.05", "2.1");
  await page.waitForTimeout(150);
  const press = async (name: string | RegExp, role: "button" = "button") => {
    await focusUntil(page, page.getByRole(role, { name }).first());
    await page.keyboard.press("Enter");
  };
  await press("Row 1: 2x + y = 1");
  await focusUntil(page, page.getByLabel("Multiply by"));
  await page.keyboard.type("2");
  await page.keyboard.press("Enter"); // Enter in the box multiplies the picked row
  await expect(page.getByTestId("row-3")).toHaveAccessibleName("Row 3: 4x + 2y = 2");
  await press("Row 3: 4x + 2y = 2");
  await press("Row 2: 3x − 2y = 4");
  await press("Add rows");
  await expect(page.getByTestId("row-4")).toHaveAccessibleName("Row 4: 7x = 6");
  await expect(page.getByRole("status").filter({ hasText: "The y term cancelled." })).toHaveCount(
    1,
  );
  await press("Undo last row");
  await expect(page.getByTestId("row-4")).toHaveCount(0);
  await typeInto(page, page.getByLabel("Answer for x", { exact: true }), "6/7", true);
  await typeInto(page, page.getByLabel("Answer for y", { exact: true }), "-5/7", true);
  await press("Check");
  await expect(page.getByLabel("Feedback")).toContainText("Yes, x = 6/7 and y = −5/7.");
  await pressContinue(page, true);
  await expect(page.getByText("6 / 10")).toBeVisible();
});

test("lesson 2.1: a row 0 = −1 is flagged as never true, then No solution is correct", async ({
  page,
}) => {
  await openScreen(page, "2.1.06", "2.1");
  await expect(page.getByTestId("row-2")).toBeVisible();
  // Row 2 minus the doubled row 1 gives 0 = -1: the board says it is never true.
  await page.getByTestId("row-1").click();
  await page.getByLabel("Multiply by").fill("2");
  await page.getByRole("button", { name: "Multiply row" }).click();
  await page.getByTestId("row-2").click();
  await page.getByTestId("row-3").click();
  await page.getByRole("button", { name: "Subtract rows" }).click();
  await expect(page.getByTestId("row-note")).toContainText("never true");
  await page.getByRole("button", { name: "No solution" }).click();
  await page.getByTestId("primary").click();
  await expect(page.getByLabel("Feedback")).toContainText("Yes, no solution.");
});
