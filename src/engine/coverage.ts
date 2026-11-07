import type { CoverageRow, PracticeBank } from "../../content/schema";
import type { ProgressData } from "../store";

export type RowStatus = "not-started" | "in-progress" | "covered" | "skip";

export const lessonOfScreen = (screenId: string): string =>
  screenId.split(".").slice(0, 2).join(".");
export const bankOfProblem = (problemId: string): string | null =>
  /^b(\d+\.\d+)\./.exec(problemId)?.[1] ?? null;

/** Items a row needs: lesson screens and bank problems (a whole bank = its non-stretch problems). */
export function rowItems(row: CoverageRow, banks: Map<string, PracticeBank>) {
  const screens = row.lessonScreens;
  const problems: string[] = [];
  for (const b of row.bankProblems) {
    if (b.startsWith("bank:")) {
      const bank = banks.get(b.slice(5));
      bank?.problems.filter((p) => !p.stretch).forEach((p) => problems.push(p.id));
    } else problems.push(b);
  }
  return { screens, problems };
}

/** FR-42: status of a row from progress. */
export function rowStatus(
  row: CoverageRow,
  data: ProgressData,
  banks: Map<string, PracticeBank>,
): RowStatus {
  if (row.kind === "skip") return "skip";
  const { screens, problems } = rowItems(row, banks);
  const total = screens.length + problems.length;
  if (total === 0) return "not-started";
  const doneScreens = screens.filter((s) =>
    data.lessons[lessonOfScreen(s)]?.screensDone.includes(s),
  ).length;
  const doneProblems = problems.filter((p) => {
    const b = bankOfProblem(p);
    return b !== null && data.banks[b]?.problems[p]?.state === "correct";
  }).length;
  const done = doneScreens + doneProblems;
  if (done === total) return "covered";
  return done > 0 ? "in-progress" : "not-started";
}

export function chapterTotals(
  rows: CoverageRow[],
  chapter: number,
  data: ProgressData,
  banks: Map<string, PracticeBank>,
): { covered: number; total: number } {
  const own = rows.filter((r) => r.chapter === chapter && r.kind !== "skip");
  return {
    covered: own.filter((r) => rowStatus(r, data, banks) === "covered").length,
    total: own.length,
  };
}
