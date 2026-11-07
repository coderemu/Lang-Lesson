import { test, type Page } from "@playwright/test";

/** Screenshots of every lesson 1.2 screen in the state of its FigCraft frame (qa/phase-1/1C). */
const open = async (page: Page, id: string, w = 390, h = 844) => {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`/lesson/1.2?screen=${id}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
};
const shot = (page: Page, name: string) => page.screenshot({ path: `qa/phase-1/1C/${name}.png` });
const keys = async (page: Page, role: string, key: string, n: number) => {
  await page
    .getByRole(role as "slider")
    .first()
    .focus();
  for (let i = 0; i < n; i++) await page.keyboard.press(key);
  await page.waitForTimeout(1500);
};
const chip = (page: Page, name: string) =>
  page.getByRole("group", { name: "Reasons" }).getByRole("button", { name, exact: true });
const check = (page: Page) => page.getByTestId("primary").click();

test("S01 place", async ({ page }) => {
  await open(page, "1.2.01");
  await keys(page, "slider", "ArrowLeft", 3);
  await shot(page, "S01");
});
test("S02 thermometer", async ({ page }) => {
  await open(page, "1.2.02");
  await keys(page, "slider", "ArrowDown", 6);
  await shot(page, "S02");
});
test("S03 hops (mobile and desktop)", async ({ page }) => {
  await open(page, "1.2.03");
  await keys(page, "slider", "ArrowLeft", 5);
  await shot(page, "S03");
  await open(page, "1.2.03", 1440, 900);
  await keys(page, "slider", "ArrowLeft", 5);
  await shot(page, "D2");
});
test("S04 compare", async ({ page }) => {
  await open(page, "1.2.04");
  await page.getByRole("button", { name: /Yes, both stop/ }).click();
  await shot(page, "S04");
});
test("S05 rule card", async ({ page }) => {
  await open(page, "1.2.05");
  await shot(page, "S05");
});
test("S06 mirror", async ({ page }) => {
  await open(page, "1.2.06");
  await page.getByLabel("Your answer").fill("4");
  await shot(page, "S06");
});
test("S07 proof (mobile and desktop)", async ({ page }) => {
  await open(page, "1.2.07");
  await shot(page, "S07");
  await open(page, "1.2.07", 1440, 900);
  await chip(page, "N2").click();
  await shot(page, "D4");
});
test("S08 proof part-way", async ({ page }) => {
  await open(page, "1.2.08");
  await chip(page, "Associativity").click();
  await check(page);
  await chip(page, "Commutativity").click();
  await check(page);
  await shot(page, "S08");
});
test("S09 wrong reason", async ({ page }) => {
  await open(page, "1.2.09");
  await chip(page, "N4").click();
  await check(page);
  await page.waitForTimeout(400);
  await shot(page, "S09");
});
test("S10 balance", async ({ page }) => {
  await open(page, "1.2.10");
  await shot(page, "S10");
});
test("S11 correct", async ({ page }) => {
  await open(page, "1.2.11");
  await page.getByLabel("Your answer").fill("-2");
  await check(page);
  await page.waitForTimeout(400);
  await shot(page, "S11");
});
test("S12 not quite", async ({ page }) => {
  await open(page, "1.2.12");
  await page.getByLabel("Your answer").fill("2");
  await check(page);
  await page.waitForTimeout(400);
  await shot(page, "S12");
});
test("S13 hint drawer", async ({ page }) => {
  await open(page, "1.2.13");
  await page.getByRole("button", { name: /Hint/ }).click();
  await page.waitForTimeout(300);
  await shot(page, "S13");
});
test("S14 summary", async ({ page }) => {
  await open(page, "1.2.14");
  await shot(page, "S14");
});
