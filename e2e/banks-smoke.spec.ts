import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";

/** Every bank problem of Chapter 1 opens; full bank play-throughs are step 1E. */
const dir = new URL("../content/practice/", import.meta.url);
const banks = readdirSync(dir)
  .filter((f) => /^bank-1\.\d\.json$/.test(f))
  .map(
    (f) =>
      JSON.parse(readFileSync(new URL(f, dir), "utf8")) as {
        lesson: string;
        problems: { n: number; langType: string }[];
      },
  );

for (const bank of banks) {
  test(`bank ${bank.lesson}: overview and every problem open`, async ({ page }) => {
    await page.goto(`/practice/${bank.lesson}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(`Bank ${bank.lesson}`);
    for (const p of bank.problems) {
      await page.goto(`/practice/${bank.lesson}/${p.n}`);
      await expect(page.getByRole("heading", { level: 1, name: `Problem ${p.n}` })).toBeVisible();
      await expect(page.getByText(p.langType.toUpperCase())).toBeVisible();
    }
  });
}
