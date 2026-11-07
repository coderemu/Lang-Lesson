import { readFileSync, readdirSync } from "node:fs";
import type { Page } from "@playwright/test";

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const files = (dir: string, re: RegExp) =>
  readdirSync(new URL(`../content/${dir}/`, import.meta.url))
    .filter((f) => re.test(f))
    .sort();

/** The store of a learner who finished every lesson and bank of Chapter 1. */
export function completedState(today = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  const key = (d: Date) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  const lessons: Record<string, unknown> = {};
  const rules: Record<string, string> = {};
  for (const f of files("lessons", /^lesson-1\.\d\.json$/)) {
    const l = read(`../content/lessons/${f}`);
    lessons[l.id] = {
      state: "complete",
      screen: 0,
      screensDone: l.screens.map((s: { id: string }) => s.id),
      total: l.screens.length,
      attempts: {},
      lastDate: key(today),
    };
    for (const r of l.rulesEarned) rules[r] = key(today);
  }
  const banks: Record<string, unknown> = {};
  for (const f of files("practice", /^bank-1\.\d\.json$/)) {
    const b = read(`../content/practice/${f}`);
    banks[b.lesson] = {
      position: 0,
      problems: Object.fromEntries(
        b.problems.map((q: { id: string }) => [q.id, { state: "correct", attempts: 1 }]),
      ),
    };
  }
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const seconds: Record<string, number> = {};
  for (const [k, min] of [
    [0, 20],
    [2, 35],
    [3, 12],
  ] as const) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + k);
    seconds[key(d)] = min * 60;
  }
  seconds[key(today)] = (seconds[key(today)] ?? 0) + 15 * 60;
  return {
    state: { lessons, banks, rules, seconds, settings: { unlockAll: false }, persistAsked: true },
    version: 1,
  };
}

/** Put a store in localStorage before the page loads. */
export async function seed(page: Page, data: unknown) {
  await page.addInitScript((d) => localStorage.setItem("lang-lessons/v1", JSON.stringify(d)), data);
}
