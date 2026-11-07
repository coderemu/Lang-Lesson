import type { Coverage, Lesson, PracticeBank, Rule } from "../../content/schema";

/* Each lesson and bank is its own chunk (NFR-06). */
const lessonModules = import.meta.glob<{ default: Lesson }>("../../content/lessons/lesson-*.json");
const bankModules = import.meta.glob<{ default: PracticeBank }>(
  "../../content/practice/bank-*.json",
);

const idOf = (path: string, prefix: string): string =>
  path.slice(path.lastIndexOf(prefix) + prefix.length).replace(/\.json$/, "");

const lessonLoaders = new Map(
  Object.entries(lessonModules).map(([p, load]) => [idOf(p, "lesson-"), load]),
);
const bankLoaders = new Map(
  Object.entries(bankModules).map(([p, load]) => [idOf(p, "bank-"), load]),
);

export const hasLesson = (id: string): boolean => lessonLoaders.has(id);
export const hasBank = (id: string): boolean => bankLoaders.has(id);
export const lessonIds = (): string[] => [...lessonLoaders.keys()];
export const bankIds = (): string[] => [...bankLoaders.keys()];

export async function loadLesson(id: string): Promise<Lesson | null> {
  const load = lessonLoaders.get(id);
  return load ? (await load()).default : null;
}

export async function loadBank(id: string): Promise<PracticeBank | null> {
  const load = bankLoaders.get(id);
  return load ? (await load()).default : null;
}

export async function loadCoverage(): Promise<Coverage> {
  return (await import("../../content/coverage.json")).default as Coverage;
}

export async function loadRules(): Promise<Rule[]> {
  return (await import("../../content/rules.json")).default.rules as Rule[];
}
