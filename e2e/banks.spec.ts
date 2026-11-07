import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { activate, feedback, focusUntil, typeInto } from "./lesson-helpers";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Problem = { id: string; n: number; prompt: string; answer: any; stretch?: boolean };
type Bank = { lesson: string; problems: Problem[] };
const dir = new URL("../content/practice/", import.meta.url);
const banks: Bank[] = readdirSync(dir)
  .filter((f) => /^bank-1\.\d\.json$/.test(f))
  .sort()
  .map((f) => JSON.parse(readFileSync(new URL(f, dir), "utf8")));

const checkButton = (page: Page) => page.getByTestId("primary");

/** Answer one problem correctly and go on. `kb` = keyboard only. */
async function solve(page: Page, p: Problem, kb: boolean) {
  const a = p.answer;
  if (a.type === "self-check") {
    await activate(page, page.getByTestId("show-solution"), kb);
    await expect(page.getByTestId("solution")).toBeVisible();
    await activate(page, page.getByTestId("got-it"), kb);
    return;
  }
  if (a.type === "number")
    await typeInto(page, page.getByLabel("Your answer"), String(a.value), kb);
  else if (a.type === "numbers") {
    for (const [k, v] of a.values.entries())
      await typeInto(page, page.getByLabel(`Your answer ${k + 1}`), String(v), kb);
  } else if (a.type === "choice") {
    await activate(
      page,
      page.getByRole("group", { name: "Choices" }).getByRole("button").nth(a.correct),
      kb,
    );
  } else throw new Error(`unsupported answer type ${a.type}`);
  await activate(page, checkButton(page), kb);
  await expect(feedback(page)).toContainText("Correct.");
  if (kb) await page.keyboard.press("Enter");
  else await page.getByTestId("continue").click();
}

async function playBank(page: Page, bank: Bank, kb: boolean) {
  await page.goto(`/practice/${bank.lesson}/1`);
  for (const p of bank.problems) {
    await expect(page.getByRole("heading", { level: 1, name: `Problem ${p.n}` })).toBeVisible();
    await solve(page, p, kb);
  }
  await expect(page).toHaveURL(`/practice/${bank.lesson}`);
  const state = await page.evaluate(
    () => JSON.parse(localStorage.getItem("lang-lessons/v1") ?? "{}").state,
  );
  const done = bank.problems.filter(
    (p) => state.banks[bank.lesson].problems[p.id]?.state === "correct",
  );
  expect(done.length).toBe(bank.problems.length);
  await expect(page.getByText(/Bank complete/)).toBeVisible();
}

for (const bank of banks) {
  test(`bank ${bank.lesson}: answer every problem, the bank is complete`, async ({ page }) => {
    test.setTimeout(120_000);
    await playBank(page, bank, false);
  });
}

test("bank 1.1: keyboard only (number, numbers, choice and self-check problems)", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await playBank(
    page,
    banks.find((b) => b.lesson === "1.1")!,
    true,
  );
});

test("a wrong answer gives the exact reply, and Show me why comes after two wrong answers", async ({
  page,
}) => {
  test.skip(test.info().project.name !== "mobile");
  test.setTimeout(240_000);
  let checked = 0;
  for (const bank of banks) {
    for (const p of bank.problems) {
      if (p.answer.type !== "number") continue;
      for (const m of p.answer.mistakes ?? []) {
        await page.goto(`/practice/${bank.lesson}/${p.n}`);
        await typeInto(page, page.getByLabel("Your answer"), String(m.match), false);
        await checkButton(page).click();
        await expect(feedback(page)).toContainText(m.reply);
        checked++;
      }
    }
  }
  // Only bank 1.2 has mistake replies in the file (5); the design doc gives none for the other banks.
  expect(checked).toBe(5);
  await page.goto("/practice/1.1/2");
  for (const wrong of ["1", "2"]) {
    await page.getByLabel("Your answer").fill(wrong);
    await checkButton(page).click();
    await expect(page.getByTestId("try-again")).toBeVisible();
    if (wrong === "1") await page.getByTestId("try-again").click();
  }
  await page.getByTestId("show-me").click();
  await expect(page.getByTestId("solution")).toBeVisible();
  void focusUntil;
});
