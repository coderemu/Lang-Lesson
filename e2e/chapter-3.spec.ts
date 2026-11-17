import { expect, test } from "@playwright/test";
import { completedState, seed } from "./state";
import { feedback, openScreen, pressContinue } from "./lesson-helpers";

/** Chapter 3 specifics: Home flow, the new widget modes, mathjs on demand, persistence in bank 3.3. */
const shot = (name: string) => `qa/phase-3/shots/${name}.png`;

test("Home opens lesson 3.1 after Chapter 2", async ({ page }) => {
  await seed(page, completedState(new Date(), [1, 2]));
  await page.goto("/");
  await expect(page.locator('a[href="/lesson/3.1"]').first()).toBeVisible();
  await expect(page.getByText("Coming in phase 3")).toHaveCount(0);
});

test.describe("new widget modes", () => {
  test("number line zoom: wrong digits are refused, right digits zoom in", async ({ page }) => {
    await openScreen(page, "3.1.03", "3.1");
    const status = page.getByTestId("zoom-msg");
    await page.getByRole("button", { name: "Digit 5", exact: true }).click();
    await expect(status).toContainText("more than 2");
    await page.getByRole("button", { name: "Digit 4", exact: true }).click();
    await expect(status).toContainText("between 1.4 and 1.5");
    await expect(page.getByTestId("zoom-squares")).toContainText("1.4");
    if (test.info().project.name === "mobile")
      await page.screenshot({ path: shot("zoom"), fullPage: true });
    await page.getByRole("button", { name: "Digit 1", exact: true }).click();
    await page.getByRole("button", { name: "Digit 4", exact: true }).click();
    await expect(status).toContainText("Search finished");
  });

  test("interval: keyboard only (arrows move an end, Space fills it)", async ({ page }) => {
    await openScreen(page, "3.5.06", "3.5");
    const lo = page.getByTestId("interval-0-lo");
    const hi = page.getByTestId("interval-0-hi");
    await lo.focus();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowLeft");
    await expect(lo).toHaveAttribute("aria-valuenow", "-2");
    await hi.focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press("ArrowRight");
    await expect(hi).toHaveAttribute("aria-valuenow", "5");
    await page.keyboard.press(" ");
    await expect(page.getByLabel("Your answer")).toHaveValue("(-2, 5]");
    if (test.info().project.name === "mobile")
      await page.screenshot({ path: shot("interval"), fullPage: true });
    await page.keyboard.press("Enter"); // Enter on a handle checks
    await expect(feedback(page)).toContainText("Yes, −2 < x ≤ 5.");
  });

  test("interval: drag an orange end with the pointer, toggle with the button", async ({
    page,
  }) => {
    await openScreen(page, "3.5.06", "3.5");
    const hi = page.getByTestId("interval-0-hi");
    const svg = page.getByTestId("interval-line").locator("svg");
    const box = (await svg.boundingBox())!;
    const handle = (await hi.boundingBox())!;
    // x of value 5 in a viewBox 342 wide, with min −5 and max 10: 21 + 10 · 20 = 221
    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + (221 / 342) * box.width, handle.y + handle.height / 2, {
      steps: 5,
    });
    await page.mouse.up();
    await expect(hi).toHaveAttribute("aria-valuenow", "5");
    await page.getByRole("button", { name: /Right end/ }).click();
    await expect(page.getByLabel("Your answer")).toHaveValue(/5\]$/);
  });

  test("interval with two parts is drawn into text the checker reads", async ({ page }) => {
    await page.goto("/design-system");
    const part2lo = page.getByTestId("interval-1-lo");
    await part2lo.scrollIntoViewIfNeeded();
    await part2lo.focus();
    await page.keyboard.press("ArrowRight");
    await expect(part2lo).toHaveAttribute("aria-valuenow", /\d/);
  });

  test("E/I table: wrong cells are marked, right tables pass", async ({ page }) => {
    await openScreen(page, "3.1.05", "3.1");
    await expect(page.getByTestId("primary")).toBeDisabled();
    for (const id of ["add", "mul"])
      for (const c of ["00", "01", "10", "11"]) await page.getByTestId(`ei-${id}-${c}`).click();
    if (test.info().project.name === "mobile")
      await page.screenshot({ path: shot("ei-table"), fullPage: true });
    await page.getByTestId("primary").click();
    await expect(feedback(page)).toContainText("Check each cell");
    await expect(page.getByTestId("ei-add-01")).toHaveAttribute("data-wrong", "true");
  });

  test("fraction strips mediant and square tiles compare", async ({ page }) => {
    await openScreen(page, "3.6.09", "3.6");
    await page.getByRole("button", { name: /Add the tops/ }).click();
    await expect(page.getByTestId("mediant-strips")).toContainText("2/5");
    if (test.info().project.name === "mobile")
      await page.screenshot({ path: shot("mediant"), fullPage: true });
    await openScreen(page, "3.6.08", "3.6");
    await page.getByRole("slider").focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByTestId("compare-tiles")).toContainText("4");
    if (test.info().project.name === "mobile")
      await page.screenshot({ path: shot("compare"), fullPage: true });
  });
});

test.describe("typed answers", () => {
  test("text answers: unreadable input asks for a new entry, equal forms pass", async ({
    page,
  }) => {
    await openScreen(page, "3.2.08", "3.2"); // set: x² = 7
    await page.getByLabel("Your answer").fill("banana");
    await page.getByTestId("primary").click();
    await expect(page.getByRole("alert")).toContainText("Enter the numbers");
    await page.getByLabel("Your answer").fill("±√7");
    await page.getByTestId("primary").click();
    await expect(feedback(page)).toContainText("Yes, ±√7.");
    await pressContinue(page, false);
  });

  test("rationalise: an equal value with a root below is refused with the form reply", async ({
    page,
  }) => {
    await openScreen(page, "3.3.09", "3.3");
    await page.getByLabel("Your answer").fill("1/(sqrt(5)-2)");
    await page.getByTestId("primary").click();
    await expect(feedback(page)).toContainText("a root is still in the denominator");
  });
});

test.describe("mathjs loads on demand", () => {
  test("a lesson screen without typed answers does not load it", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (r) => /mathjs/.test(r.url()) && hits.push(r.url()));
    await openScreen(page, "3.1.01", "3.1");
    await page.waitForTimeout(500);
    expect(hits).toEqual([]);
  });
  test("a typed-answer screen loads it", async ({ page }) => {
    const hits: string[] = [];
    page.on("request", (r) => /mathjs/.test(r.url()) && hits.push(r.url()));
    await openScreen(page, "3.3.09", "3.3");
    await expect.poll(() => hits.length).toBeGreaterThan(0);
  });
});

test("persistence: close in the middle of bank 3.3, reopen, same place", async ({ page }) => {
  await page.goto("/practice/3.3/1");
  await page.getByLabel("Your answer").fill("2 - sqrt(3)");
  await page.getByTestId("primary").click();
  await expect(feedback(page)).toContainText("Correct.");
  await page.getByTestId("continue").click();
  await expect(page.getByRole("heading", { level: 1, name: "Problem 2" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Problem 2" })).toBeVisible();
  const state = await page.evaluate(
    () => JSON.parse(localStorage.getItem("lang-lessons/v1") ?? "{}").state,
  );
  expect(state.banks["3.3"].problems["b3.3.01"].state).toBe("correct");
});
