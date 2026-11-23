import { expect, test } from "@playwright/test";
import { completedState, seed } from "./state";
import { openScreen } from "./lesson-helpers";

/** Chapter 4 specifics: Home flow, the two new widget modes, the end of the course. */
const shot = (name: string) => `qa/phase-4/shots/${name}.png`;
const mobile = () => test.info().project.name === "mobile";

test("Home opens lesson 4.1 after Chapter 3", async ({ page }) => {
  await seed(page, completedState(new Date(), [1, 2, 3]));
  await page.goto("/");
  await expect(page.locator('a[href="/lesson/4.1"]').first()).toBeVisible();
  await expect(page.getByText("Coming in phase 4")).toHaveCount(0);
});

test("square tiles complete: a wrong corner does not fit, the right one does (keyboard)", async ({
  page,
}) => {
  await openScreen(page, "4.1.03", "4.1");
  const tiles = page.getByTestId("complete-tiles");
  const slider = page.getByRole("slider");
  await slider.focus();
  await expect(tiles).toContainText("1 × 1 does not fit");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(tiles).toContainText("(x + 3)");
  await expect(page.getByTestId("corner-tile")).toHaveAttribute("data-fit", "true");
  if (mobile()) await page.screenshot({ path: shot("complete"), fullPage: true });
  await page.keyboard.press("ArrowRight");
  await expect(tiles).toContainText("4 × 4 does not fit");
});

test("discriminant slider: two, one and no solution", async ({ page }) => {
  await openScreen(page, "4.2.06", "4.2");
  const note = page.getByTestId("root-note");
  await expect(note).toContainText("Two solutions");
  const c = page.getByLabel("Value of c");
  await c.focus();
  await page.keyboard.press("ArrowRight"); // c: −3 → −2
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight"); // c = 1
  await expect(note).toContainText("One solution");
  if (mobile()) await page.screenshot({ path: shot("discriminant"), fullPage: true });
  await page.keyboard.press("ArrowRight");
  await expect(note).toContainText("No real solution");
});

test("the last lesson closes the course", async ({ page }) => {
  await openScreen(page, "4.2.13", "4.2");
  await expect(page.getByTestId("primary")).toHaveText("Finish the course");
  await expect(page.getByText("complex numbers")).toBeVisible();
});
