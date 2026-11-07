import { expect, test } from "@playwright/test";

/** 1B: answer screen 1 wrong, read the exact reply, answer correctly, close, reopen at screen 2. */
test("lesson 1.2: wrong answer, exact reply, correct answer, close and reopen at screen 2", async ({
  page,
}) => {
  await page.goto("/lesson/1.2");
  await expect(page.getByRole("heading", { level: 1, name: "Where is minus 3?" })).toBeVisible();

  await page.getByLabel("Your answer").fill("3");
  await page.getByTestId("primary").click();
  await expect(
    page.getByText("That is plus 3. Minus numbers are on the other side of 0. Which side is that?"),
  ).toBeVisible();

  await page.getByTestId("try-again").click();
  await page.getByLabel("Your answer").fill("-3");
  await page.getByTestId("primary").click();
  await expect(page.getByText("Yes, −3.")).toBeVisible();
  await page.getByTestId("continue").click();
  await expect(page.getByText("2 / 14")).toBeVisible();

  await page.getByRole("button", { name: "Close lesson" }).click();
  await expect(page).toHaveURL("/");

  // The saved position survives a full reload.
  await page.reload();
  await page.goto("/lesson/1.2");
  await expect(page.getByText("2 / 14")).toBeVisible();
  await expect(page.getByText("PUZZLE")).toBeVisible();
});
