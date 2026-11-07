import { expect, test, type Page } from "@playwright/test";
import {
  chipLabel,
  feedback,
  lesson,
  moveSlider,
  openScreen,
  playScreen,
  pressCheck,
  primary,
  typeInto,
  type Screen,
} from "./lesson-helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = Record<string, any>;

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

/** Every mistake reply of the lesson file gives its exact text. */
type Mistake = { screen: string; label: string; reply: string; run: (page: Page) => Promise<void> };
const mistakes: Mistake[] = [];
const unreachable: string[] = [];
const rs = (v: number) => String(v);

for (const s of lesson.screens as Screen[]) {
  const i = s.interaction as Any;
  const add = (label: string, reply: string, run: Mistake["run"]) =>
    mistakes.push({ screen: s.id, label, reply, run });

  if (i.type === "number-line" && !i.followUp && i.answer) {
    const start = i.mode === "hops" ? i.widget.start : (i.widget.ringStart ?? 0);
    for (const m of i.answer.mistakes ?? []) {
      if (m.match < i.widget.min || m.match > i.widget.max) {
        unreachable.push(`${s.id}: ${m.match}`);
        continue;
      }
      add(`ring at ${m.match}`, m.reply, async (page) => {
        await moveSlider(page, start, m.match, false);
        await pressCheck(page, false);
      });
    }
  }
  if (i.type === "number-line" && i.followUp?.type === "choice") {
    for (const o of i.followUp.options.filter((o: Any) => o.reply)) {
      add(`option ${o.id}`, o.reply, async (page) => {
        await page.getByRole("button", { name: o.label }).click();
        await pressCheck(page, false);
      });
    }
  }
  if (i.type === "number-line" && i.followUp?.type === "number-input") {
    for (const m of i.followUp.answer.mistakes ?? []) {
      add(`answer ${m.match}`, m.reply, async (page) => {
        await typeInto(page, page.getByLabel("Your answer"), rs(m.match), false);
        await pressCheck(page, false);
      });
    }
  }
  if (i.type === "number-input" || i.type === "balance") {
    for (const m of i.answer.mistakes ?? []) {
      add(`answer ${m.match}`, m.reply, async (page) => {
        await typeInto(page, page.getByLabel("Your answer"), rs(m.match), false);
        await pressCheck(page, false);
      });
    }
  }
  if (i.type === "multi-number-input") {
    for (const [k, part] of i.parts.entries()) {
      for (const m of part.answer.mistakes ?? []) {
        add(`part ${k + 1} answer ${m.match}`, m.reply, async (page) => {
          for (const [j, p] of i.parts.entries()) {
            await typeInto(
              page,
              page.getByLabel(`Your answer, part ${j + 1}`),
              rs(j === k ? m.match : p.answer.value),
              false,
            );
          }
          await pressCheck(page, false);
        });
      }
    }
  }
  if (i.type === "choice") {
    for (const o of i.options.filter((o: Any) => o.reply)) {
      add(`option ${o.id}`, o.reply, async (page) => {
        await page.getByRole("button", { name: o.label }).click();
        await pressCheck(page, false);
      });
    }
  }
  if (i.type === "proof") {
    const lines = i.lines.filter((l: Any) => l.reason !== null);
    for (const [k, line] of lines.entries()) {
      for (const [chip, reply] of Object.entries(i.wrongReasonReplies ?? {}) as [
        string,
        string,
      ][]) {
        if (chip === line.reason) continue;
        add(`line ${k + 1}, chip ${chip}`, reply, async (page) => {
          const tray = page.getByRole("group", { name: "Reasons" });
          for (const done of lines.slice(0, k)) {
            await tray
              .getByRole("button", { name: chipLabel(done.reason, i.steps), exact: true })
              .click();
            await primary(page).click();
          }
          await tray.getByRole("button", { name: chipLabel(chip, i.steps), exact: true }).click();
          await pressCheck(page, false);
        });
      }
    }
  }
}

test.describe("every mistake reply gives its exact text", () => {
  test("the file has mistakes to test", () => {
    expect(mistakes.length).toBeGreaterThan(20);
  });
  test("only mistakes that no control can produce are skipped", () => {
    // Hops screen: 3 + 5 = 8 is outside the number line (−5 to 5).
    expect(unreachable).toEqual(["1.2.03: 8"]);
  });
  for (const m of mistakes) {
    test(`${m.screen} · ${m.label}`, async ({ page }) => {
      await openScreen(page, m.screen);
      await m.run(page);
      await expect(feedback(page)).toContainText(m.reply);
    });
  }
  test("1.2.14 · the trap option shows its reply", async ({ page }) => {
    await openScreen(page, "1.2.14");
    const trap = (lesson.screens[13].interaction as Any).trap;
    await page.getByRole("button", { name: "True" }).click();
    await expect(page.getByRole("status").filter({ hasText: trap.options[0].reply })).toBeVisible();
  });
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
