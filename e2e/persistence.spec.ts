import { expect, test } from "@playwright/test";
import { loadLesson, playScreen } from "./lesson-helpers";

/** Criterion 4: close the browser in the middle of a lesson or bank, open it again, continue at the same place. */
test("lesson 1.6: close after screen 5, open again at screen 6", async ({ page }) => {
  const lesson = loadLesson("1.6");
  await page.goto("/lesson/1.6");
  for (const s of lesson.screens.slice(0, 5)) await playScreen(page, s, false);
  await expect(page.getByText(`6 / ${lesson.screens.length}`)).toBeVisible();
  await page.getByRole("button", { name: "Close lesson" }).click();
  await expect(page).toHaveURL("/");
  // A new page in a new context of the same storage: simulate by a full reload of the origin.
  await page.reload();
  await expect(page.getByRole("link", { name: "Resume" })).toBeVisible();
  await page.getByRole("link", { name: "Resume" }).click();
  await expect(page.getByText(`6 / ${lesson.screens.length}`)).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: lesson.screens[5].title as string }),
  ).toBeVisible();
});

test("bank 1.4: close at problem 5, open again at problem 5", async ({ page }) => {
  await page.goto("/practice/1.4/1");
  for (let n = 1; n <= 4; n++) {
    await page.getByTestId("show-solution").click();
    await page.getByTestId("got-it").click();
  }
  await expect(page.getByRole("heading", { level: 1, name: "Problem 5" })).toBeVisible();
  await page.getByRole("button", { name: "Close lesson" }).click();
  await expect(page).toHaveURL("/practice/1.4"); // the overview is its own chunk: wait for it before the reload
  await page.reload();
  await expect(page.getByRole("link", { name: "Continue practice" })).toBeVisible();
  await page.getByRole("link", { name: "Continue practice" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Problem 5" })).toBeVisible();
});
