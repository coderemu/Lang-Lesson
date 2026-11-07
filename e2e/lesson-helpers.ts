/* eslint-disable @typescript-eslint/no-explicit-any */
import { expect, type Locator, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const lessonJson = read("../content/lessons/lesson-1.2.json") as {
  screens: Record<string, any>[];
  rulesEarned: string[];
};
const rulesJson = read("../content/rules.json") as { rules: { id: string; name: string }[] };

/** Drives lesson 1.2 from the lesson JSON. `kb` = keyboard only (Tab, arrows, Enter, typing). */
export type Screen = { id: string; title: string; interaction: Record<string, unknown> } & Record<
  string,
  unknown
>;
export const lesson = lessonJson as unknown as { screens: Screen[]; rulesEarned: string[] };
type Any = Record<string, any>;

const FULL: Record<string, string> = {
  "comm-add": "Commutativity",
  "assoc-add": "Associativity",
  "comm-mul": "Commutativity",
  "assoc-mul": "Associativity",
  distrib: "Distributivity, left",
  "distrib-right": "Distributivity, right",
};
export function chipLabel(id: string, steps: { id: string; label: string }[] = []): string {
  const step = steps.find((s) => s.id === id);
  if (step) return step.label;
  if (FULL[id]) return FULL[id];
  if (/^[A-Z]+\d*$/.test(id)) return id;
  return (rulesJson.rules.find((r) => r.id === id)?.name ?? id) as string;
}

export function loadLesson(id: string): { screens: Screen[]; rulesEarned: string[] } {
  return read(`../content/lessons/lesson-${id}.json`) as {
    screens: Screen[];
    rulesEarned: string[];
  };
}

export const openScreen = async (page: Page, id: string, lessonId = "1.2") => {
  await page.goto(`/lesson/${lessonId}?screen=${id}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
};

export async function focusUntil(page: Page, target: Locator) {
  for (let i = 0; i < 80; i++) {
    if (await target.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("The element did not receive focus with Tab");
}

/** Activate a control: click, or focus with Tab and press Enter. */
export async function activate(page: Page, target: Locator, kb: boolean) {
  if (kb) {
    await focusUntil(page, target);
    await page.keyboard.press("Enter");
  } else await target.click();
}

export const primary = (page: Page) => page.getByTestId("primary");
export const feedback = (page: Page) => page.getByLabel("Feedback");

/** Move the focused slider from one value to another with the arrow keys. */
export async function moveSlider(page: Page, from: number, to: number, kb: boolean) {
  const slider = page.getByRole("slider");
  if (kb) await focusUntil(page, slider);
  else await slider.focus();
  const key = to > from ? "ArrowRight" : "ArrowLeft";
  for (let i = 0; i < Math.abs(to - from); i++) await page.keyboard.press(key);
}

export async function typeInto(page: Page, input: Locator, text: string, kb: boolean) {
  if (kb) {
    await focusUntil(page, input);
    await page.keyboard.type(text);
  } else await input.fill(text);
}

/** Press Check. In keyboard mode Enter on the focused control (slider or slot) checks. */
export async function pressCheck(page: Page, kb: boolean) {
  if (kb) {
    await focusUntil(page, primary(page));
    await page.keyboard.press("Enter");
  } else await primary(page).click();
}

export async function pressContinue(page: Page, kb: boolean) {
  const cont = page.getByTestId("continue");
  await expect(cont).toBeVisible();
  if (kb)
    await page.keyboard.press("Enter"); // the sheet button has focus
  else await cont.click();
}

/** Pick the correct option by position, because labels with math have no plain text. */
async function chooseOption(page: Page, choice: Any, kb: boolean) {
  const at = choice.options.findIndex((o: Any) => o.id === choice.correct);
  await activate(
    page,
    page.getByRole("group", { name: "Choices" }).getByRole("button").nth(at),
    kb,
  );
}

async function answerInteraction(page: Page, i: Any, kb: boolean, valueOf: (a: Any) => number) {
  switch (i.type) {
    case "area-model":
    case "square-tiles":
    case "fraction-strips":
      if (i.followUp || i.answer) {
        await answerInteraction(page, { ...i, type: "number-line", mode: "explore" }, kb, valueOf);
      }
      return;
    case "number-line": {
      if (!i.followUp && i.mode === "explore") {
        await typeInto(page, page.getByLabel("Your answer"), String(valueOf(i.answer)), kb);
        return;
      }
      if (i.followUp) {
        if (i.followUp.type === "choice") {
          await chooseOption(page, i.followUp, kb);
        } else {
          await typeInto(
            page,
            page.getByLabel("Your answer"),
            String(valueOf(i.followUp.answer)),
            kb,
          );
        }
        return;
      }
      const start = i.mode === "hops" ? i.widget.start : (i.widget.ringStart ?? 0);
      await moveSlider(page, start, valueOf(i.answer), kb);
      return;
    }
    case "thermometer":
      await moveSlider(page, 0, -5, kb);
      return;
    case "balance": {
      for (const side of ["left", "right"] as const) {
        for (let k = 0; k < 3; k++)
          await activate(page, page.getByTestId(`cube-${side}`).first(), kb);
      }
      await expect(page.getByTestId("balance-readout")).toContainText("Level");
      await typeInto(page, page.getByLabel("Your answer"), String(valueOf(i.answer)), kb);
      return;
    }
    case "number-input":
      await typeInto(page, page.getByLabel("Your answer"), String(valueOf(i.answer)), kb);
      return;
    case "multi-number-input":
      for (const [k, p] of i.parts.entries()) {
        await typeInto(
          page,
          page.getByLabel(`Your answer, part ${k + 1}`),
          String(valueOf(p.answer)),
          kb,
        );
      }
      return;
    case "choice": {
      await chooseOption(page, i, kb);
      return;
    }
  }
}

/** Play one screen to its end with correct answers and continue. */
export async function playScreen(page: Page, s: Screen, kb: boolean) {
  const i = s.interaction as Any;
  const valueOf = (a: Any) => a.value as number;
  const answerable =
    [
      "thermometer",
      "balance",
      "number-input",
      "multi-number-input",
      "choice",
      "proof",
      "trap-summary",
    ].includes(i.type) ||
    (["number-line", "area-model", "square-tiles", "fraction-strips"].includes(i.type) &&
      (i.answer || i.followUp));
  if (i.type === "rule-card" || i.type === "none" || !answerable) {
    await activate(page, primary(page), kb);
    return;
  }
  if (i.type === "trap-summary") {
    await activate(
      page,
      page.getByRole("button", { name: i.trap.correct === "true" ? "True" : "False" }),
      kb,
    );
    await expect(
      page.getByRole("status").filter({ hasText: i.trap.feedback.correctTitle }),
    ).toBeVisible();
    await activate(page, primary(page), kb);
    return;
  }
  if (i.type === "proof") {
    const tray = page.getByRole("group", { name: "Reasons" });
    const lines = i.lines.filter((l: Any) => l.reason !== null);
    for (const [k, line] of lines.entries()) {
      await activate(
        page,
        tray.getByRole("button", { name: chipLabel(line.reason, i.steps), exact: true }),
        kb,
      );
      await pressCheck(page, kb);
      if (k === lines.length - 1) {
        await expect(feedback(page)).toContainText(i.feedback.correctTitle);
        await pressContinue(page, kb);
      }
    }
    return;
  }
  await answerInteraction(page, i, kb, valueOf);
  if (kb && ((i.type === "number-line" && !i.followUp) || i.type === "thermometer")) {
    await page.keyboard.press("Enter"); // Enter on the slider checks
  } else await pressCheck(page, kb);
  await expect(feedback(page)).toBeVisible();
  await pressContinue(page, kb);
}
