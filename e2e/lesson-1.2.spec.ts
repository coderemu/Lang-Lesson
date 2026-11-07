import { expect, test, type Page } from "@playwright/test";
import {
  feedback,
  lesson,
  moveSlider,
  openScreen,
  playScreen,
  pressCheck,
  typeInto,
  type Screen,
} from "./lesson-helpers";

const playAll = async (page: Page, kb: boolean) => {
  await page.goto("/lesson/1.2");
  for (const [n, s] of lesson.screens.entries()) {
    await expect(page.getByRole("heading", { level: 1, name: s.title })).toBeVisible();
    await expect(page.getByText(`${n + 1} / ${lesson.screens.length}`)).toBeVisible();
    await playScreen(page, s as Screen, kb);
  }
  await expect(page).toHaveURL("/");
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("lang-lessons/v1") ?? "{}").state,
  );
  expect(saved.lessons["1.2"].state).toBe("complete");
  expect(Object.keys(saved.rules)).toEqual(expect.arrayContaining(lesson.rulesEarned));
};

test("correct path: all 14 screens, pointer and keys", async ({ page }) => {
  await playAll(page, false);
});

test("keyboard-only path: all 14 screens with Tab, arrows, typing and Enter", async ({ page }) => {
  await playAll(page, true);
});

test("reduced motion: the lesson still plays, the sheet fades in 120 ms or less", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lesson/1.2");
  const [s1, s2, s3] = lesson.screens as Screen[];
  await playScreen(page, s1, false);
  await playScreen(page, s2, false);
  // Screen 3: the hops show without the 240 ms stagger.
  await moveSlider(page, 3, -2, false);
  await expect(page.getByTestId("hops-equation")).toContainText("−2");
  await page.waitForTimeout(250);
  await expect(page.locator('svg path[class*="hop"]')).toHaveCount(5);
  await pressCheck(page, false);
  const sheet = feedback(page);
  await expect(sheet).toBeVisible();
  const duration = await sheet.evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.12);
  void s3;
});

test("Show me why after two wrong answers leads to the twin (screen 12)", async ({ page }) => {
  await openScreen(page, "1.2.12");
  for (const wrong of ["2", "14"]) {
    await typeInto(page, page.getByLabel("Your answer"), wrong, false);
    await pressCheck(page, false);
    await expect(page.getByTestId("try-again")).toBeVisible();
    if (wrong === "2") await page.getByTestId("try-again").click();
  }
  await page.getByTestId("show-me").click();
  await expect(page.getByTestId("show-me-steps")).toBeVisible();
  await page.getByTestId("show-me-continue").click();
  await expect(page.getByText("TRY ANOTHER")).toBeVisible();
  await page.getByLabel("Your answer").fill("-4");
  await pressCheck(page, false);
  await expect(feedback(page)).toContainText("Yes, −4.");
});
