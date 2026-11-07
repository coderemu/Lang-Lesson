import { test } from "@playwright/test";

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const routes = [
  { path: "/", file: "home" },
  { path: "/progress", file: "progress" },
  { path: "/rules", file: "rules" },
  { path: "/coverage", file: "coverage" },
  { path: "/settings", file: "settings" },
  { path: "/practice/1.2", file: "practice-overview" },
  { path: "/practice/1.2/6", file: "practice-problem" },
  { path: "/lesson/1.2?screen=1.2.07", file: "lesson-placeholder" },
];

/** The sample state of the frames: lessons 1.1–1.2 done, 1.3 at screen 4, 11 rules, 10 of 12 correct, 46 min. */
const sample = () => {
  const p = (n: number) => String(n).padStart(2, "0");
  const key = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const day = (k: number) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + k);
    return key(d);
  };
  const today = key(now);
  const seconds: Record<string, number> = {};
  seconds[day(0)] = 12 * 60;
  seconds[day(2)] = 16 * 60;
  seconds[day(3)] = 6 * 60;
  seconds[today] = (seconds[today] ?? 0) + 12 * 60;
  const screensOf = (id: string) =>
    id === "1.2" ? Array.from({ length: 14 }, (_, k) => `1.2.${p(k + 1)}`) : [];
  const done = (id: string) => ({
    state: "complete",
    screen: 0,
    screensDone: screensOf(id),
    attempts: {},
    lastDate: today,
    total: 14,
  });
  const rules = [
    "comm-add",
    "assoc-add",
    "N1",
    "N2",
    "N3",
    "N4",
    "N5",
    "pos-sum",
    "neg-sum",
    "solve-sum",
    "cancel-add",
  ];
  const problems: Record<string, { state: string; attempts: number }> = {};
  for (let n = 1; n <= 12; n++) {
    const id = `b1.2.${p(n)}`;
    problems[id] = { state: n === 7 || n === 9 ? "not-yet" : "correct", attempts: 1 };
  }
  return {
    state: {
      lessons: {
        "1.1": done("1.1"),
        "1.2": done("1.2"),
        "1.3": {
          state: "in-progress",
          screen: 3,
          screensDone: ["1.3.01", "1.3.02", "1.3.03"],
          attempts: {},
          lastDate: today,
          total: 14,
        },
      },
      banks: { "1.2": { problems, position: 0 } },
      rules: Object.fromEntries(rules.map((r) => [r, today])),
      seconds,
      settings: { unlockAll: false },
      persistAsked: true,
    },
    version: 1,
  };
};

for (const vp of viewports) {
  for (const r of routes) {
    test(`1B screenshot ${r.file} at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript((data) => {
        localStorage.setItem("lang-lessons/v1", JSON.stringify(data));
      }, sample());
      await page.goto(r.path);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `qa/phase-1/1B/${r.file}-${vp.name}.png`, fullPage: false });
    });
  }
}
