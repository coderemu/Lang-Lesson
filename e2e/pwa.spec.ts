import { expect, test, type Page } from "@playwright/test";
import { execSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadLesson, playScreen } from "./lesson-helpers";

/** 1F: the production build. Routes, installability, offline use, updates and backups. */

const state = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("lang-lessons/v1") ?? "{}").state);

/** Wait until the service worker controls the page and the precache is full. */
async function ready(page: Page) {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect
    .poll(
      async () =>
        page.evaluate(async () => {
          const names = await caches.keys();
          const pre = names.find((n) => n.includes("precache"));
          return pre ? (await (await caches.open(pre)).keys()).length : 0;
        }),
      { timeout: 60_000 },
    )
    .toBeGreaterThan(70);
  await page.reload(); // from now on the service worker controls the page
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    .toBe(true);
}

test("every route opens directly by URL (no 404)", async ({ page }) => {
  for (const path of [
    "/",
    "/progress",
    "/rules",
    "/coverage",
    "/settings",
    "/lesson/1.2",
    "/practice/1.2",
    "/practice/1.2/3",
    "/design-system",
  ]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading").first(), path).toBeVisible();
    await expect(page.getByText("not available"), path).toHaveCount(0);
  }
});

test("manifest and icons make the app installable", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    name: "Lang Lessons",
    short_name: "Lang",
    display: "standalone",
    theme_color: "#1565C0",
    background_color: "#FFFFFF",
    start_url: "/",
    scope: "/",
  });
  const icons = manifest.icons as { src: string; sizes: string; purpose?: string }[];
  expect(icons.map((i) => `${i.sizes} ${i.purpose}`).sort()).toEqual([
    "192x192 any",
    "512x512 any",
    "512x512 maskable",
  ]);
  for (const icon of icons) {
    const r = await request.get(icon.src);
    expect(r.status(), icon.src).toBe(200);
    expect(r.headers()["content-type"]).toContain("image/png");
  }
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await page.context().newCDPSession(page);
  const { installabilityErrors } = (await cdp.send("Page.getInstallabilityErrors")) as {
    installabilityErrors: { errorId: string }[];
  };
  expect(installabilityErrors.map((e) => e.errorId)).toEqual([]);
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
});

test("offline: Home, lesson 1.2, bank 1.2 and a lesson never opened before still work", async ({
  page,
  context,
}) => {
  await ready(page);
  await context.setOffline(true);

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Your course" })).toBeVisible();

  // Lesson 1.2: play the first two screens offline.
  const lesson = loadLesson("1.2");
  await page.goto("/lesson/1.2");
  for (const s of lesson.screens.slice(0, 2)) await playScreen(page, s, false);
  await expect(page.getByText(`3 / ${lesson.screens.length}`)).toBeVisible();

  // Bank 1.2, problem 6 (number): answer it offline.
  await page.goto("/practice/1.2/6");
  await page.getByLabel("Your answer").fill("8");
  await page.getByTestId("primary").click();
  await expect(page.getByLabel("Feedback")).toContainText("Correct.");

  // Lesson 1.6 was never opened: its chunk comes from the precache.
  await page.goto("/lesson/1.6?screen=1.6.03");
  await expect(page.getByRole("heading", { level: 1, name: "Cut the strip finer" })).toBeVisible();
  await page.goto("/practice/1.8/1");
  await expect(page.getByRole("heading", { level: 1, name: "Problem 1" })).toBeVisible();
  await context.setOffline(false);
});

test("a new build shows the update toast, and progress survives the update", async ({ page }) => {
  await ready(page);
  const lesson = loadLesson("1.2");
  await page.goto("/lesson/1.2");
  for (const s of lesson.screens.slice(0, 3)) await playScreen(page, s, false);
  await page.goto("/settings");
  const before = (await page.getByText(/Lang Lessons · version/).textContent()) ?? "";
  const saved = await state(page);
  expect(saved.lessons["1.2"].screen).toBe(3);

  // A second build with a different version, served by the same preview server.
  execSync("npm run build", { env: { ...process.env, BUILD_ID: "update-test" }, stdio: "ignore" });
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.getRegistration();
    await reg?.update();
  });
  await expect(page.getByTestId("update-toast")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("update-toast")).toContainText("New version ready. Reload.");
  await page.getByRole("button", { name: "Reload" }).click();
  await expect(page.getByText(/update-test/)).toBeVisible({ timeout: 30_000 });
  const after = (await page.getByText(/Lang Lessons · version/).textContent()) ?? "";
  expect(after).not.toBe(before);

  expect(await state(page)).toEqual(saved);
  await page.goto("/lesson/1.2");
  await expect(page.getByText(`4 / ${lesson.screens.length}`)).toBeVisible();
});

test("a backup made in one browser context restores in a fresh context", async ({
  page,
  browser,
}) => {
  const lesson = loadLesson("1.2");
  await page.goto("/lesson/1.2");
  for (const s of lesson.screens.slice(0, 4)) await playScreen(page, s, false);
  await page.goto("/practice/1.1/2");
  await page.getByLabel("Your answer").fill("5");
  await page.getByTestId("primary").click();
  const saved = await state(page);

  await page.goto("/settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Back up progress" }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^lang-lessons-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = join(mkdtempSync(join(tmpdir(), "lang-backup-")), download.suggestedFilename());
  await download.saveAs(file);

  const fresh = await browser.newContext({
    viewport: { width: 390, height: 844 },
    baseURL: "http://localhost:4173",
  });
  const other = await fresh.newPage();
  await other.goto("/settings");
  expect((await state(other))?.lessons ?? {}).toEqual({});
  await other.getByTestId("restore-input").setInputFiles(file);
  await expect(other.getByRole("alertdialog", { name: "Confirm restore" })).toContainText("lesson");
  await other.getByTestId("confirm-restore").click();
  await expect(other.getByText("Progress restored.")).toBeVisible();
  expect(await state(other)).toEqual(saved);
  await fresh.close();
});
