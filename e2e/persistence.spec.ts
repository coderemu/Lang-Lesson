import { expect, test } from "@playwright/test";
import { loadLesson, playScreen } from "./lesson-helpers";
import { completedState, seed } from "./state";

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

test("lesson 2.2: close after screen 4, open again at screen 5", async ({ page }) => {
  // Chapter 1 and lesson 2.1 are done, so lesson 2.2 is open.
  const data = completedState();
  const l21 = loadLesson("2.1") as unknown as { screens: { id: string }[] };
  (data.state.lessons as Record<string, unknown>)["2.1"] = {
    state: "complete",
    screen: 0,
    screensDone: l21.screens.map((s) => s.id),
    total: l21.screens.length,
    attempts: {},
    lastDate: "2026-11-16",
  };
  // Seed once. `seed` would reset the store on every page load, also on reload.
  await page.addInitScript((d) => {
    if (!localStorage.getItem("lang-lessons/v1"))
      localStorage.setItem("lang-lessons/v1", JSON.stringify(d));
  }, data);
  const lesson = loadLesson("2.2");
  await page.goto("/lesson/2.2");
  for (const s of lesson.screens.slice(0, 4)) await playScreen(page, s, false);
  await expect(page.getByText(`5 / ${lesson.screens.length}`)).toBeVisible();
  await page.getByRole("button", { name: "Close lesson" }).click();
  await expect(page).toHaveURL("/");
  await page.reload();
  await page.getByRole("link", { name: "Resume" }).click();
  await expect(page.getByText(`5 / ${lesson.screens.length}`)).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: lesson.screens[4].title as string }),
  ).toBeVisible();
});

test("home: lessons 2.1 to 2.3 are open after Chapter 1 and 2.1 starts", async ({ page }) => {
  await seed(page, completedState());
  await page.goto("/");
  const chapter2 = page.getByLabel("Chapter 2");
  await expect(chapter2).toContainText("Two equations, two unknowns");
  await expect(chapter2).not.toContainText("Coming in phase 2");
  await page
    .getByRole("link", { name: /Two equations, two unknowns/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/lesson\/2\.1/);
});
