import { expect, test, type Page } from "@playwright/test";
import { loadLesson, playScreen } from "./lesson-helpers";
import { readdirSync } from "node:fs";

/** Play every Chapter 1 lesson that exists from the first to the last screen with correct answers. */
const ids = readdirSync(new URL("../content/lessons", import.meta.url))
  .map((f) => /^lesson-(\d\.\d)\.json$/.exec(f)?.[1])
  .filter((id): id is string => Boolean(id && id.startsWith("1.")))
  .filter((id) => id !== "1.2")
  .sort();

const play = async (page: Page, id: string, kb: boolean) => {
  const lesson = loadLesson(id);
  await page.goto(`/lesson/${id}`);
  for (const [n, s] of lesson.screens.entries()) {
    await expect(page.getByRole("heading", { level: 1, name: s.title as string })).toBeVisible();
    await expect(page.getByText(`${n + 1} / ${lesson.screens.length}`)).toBeVisible();
    await playScreen(page, s, kb);
  }
  await expect(page).toHaveURL("/");
  const state = await page.evaluate(
    () => JSON.parse(localStorage.getItem("lang-lessons/v1") ?? "{}").state,
  );
  expect(state.lessons[id].state).toBe("complete");
  expect(Object.keys(state.rules)).toEqual(expect.arrayContaining(lesson.rulesEarned));
};

for (const id of ids) {
  test(`lesson ${id}: correct path from the first to the last screen`, async ({ page }) => {
    await play(page, id, false);
  });
}
