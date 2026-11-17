import { expect, test } from "@playwright/test";
import { feedback, mistakeCases, openScreen } from "./lesson-helpers";

/** Criterion 2: every mistake in the lesson JSON gives its exact reply. Mobile project only (the reply does not depend on the width). */
const lessons = [
  "1.1",
  "1.2",
  "1.3",
  "1.4",
  "1.5",
  "1.6",
  "1.7",
  "1.8",
  "2.1",
  "2.2",
  "2.3",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "3.5",
  "3.6",
];
const KNOWN_UNREACHABLE = ["1.2: 1.2.03: 8"];

const unreachable: string[] = [];
for (const id of lessons) {
  const { cases, unreachable: un } = mistakeCases(id);
  unreachable.push(...un.map((u) => `${id}: ${u}`));
  test.describe(`lesson ${id}: ${cases.length} mistake replies`, () => {
    for (const c of cases) {
      test(`${c.screen} · ${c.label}`, async ({ page }) => {
        test.skip(test.info().project.name !== "mobile", "the replies do not depend on the width");
        await openScreen(page, c.screen, id);
        await c.run(page);
        if (c.where === "sheet") await expect(feedback(page)).toContainText(c.reply);
        else await expect(page.getByRole("status").filter({ hasText: c.reply })).toBeVisible();
      });
    }
  });
}

test("only replies that no control can produce are skipped", () => {
  expect(unreachable).toEqual(KNOWN_UNREACHABLE);
});
