import { describe, expect, it } from "vitest";
import type { CoverageRow, PracticeBank } from "../../content/schema";
import { emptyData } from "../store";
import { bankOfProblem, chapterTotals, lessonOfScreen, rowItems, rowStatus } from "./coverage";

const bank: PracticeBank = {
  lesson: "1.2",
  title: "Bank 1.2",
  problems: [
    {
      id: "b1.2.01",
      n: 1,
      prompt: "",
      answer: { type: "self-check" },
      answerText: "",
      langType: "",
    },
    {
      id: "b1.2.02",
      n: 2,
      prompt: "",
      answer: { type: "self-check" },
      answerText: "",
      langType: "",
      stretch: true,
    },
  ],
};
const banks = new Map([["1.2", bank]]);
const row = (over: Partial<CoverageRow>): CoverageRow => ({
  id: "c",
  chapter: 1,
  section: "§1",
  kind: "topic",
  topic: "t",
  lessonScreens: [],
  bankProblems: [],
  ...over,
});

describe("coverage status (FR-42)", () => {
  it("parses ids", () => {
    expect(lessonOfScreen("1.2.06")).toBe("1.2");
    expect(bankOfProblem("b1.2.06")).toBe("1.2");
    expect(bankOfProblem("x")).toBeNull();
  });
  it("expands a whole bank without stretch problems", () => {
    expect(rowItems(row({ bankProblems: ["bank:1.2"] }), banks).problems).toEqual(["b1.2.01"]);
    expect(rowItems(row({ bankProblems: ["bank:9.9"] }), banks).problems).toEqual([]);
  });
  it("skip, not started, in progress, covered", () => {
    const d = emptyData();
    expect(rowStatus(row({ kind: "skip" }), d, banks)).toBe("skip");
    expect(rowStatus(row({}), d, banks)).toBe("not-started");
    const r = row({ lessonScreens: ["1.2.01", "1.2.02"], bankProblems: ["b1.2.01"] });
    expect(rowStatus(r, d, banks)).toBe("not-started");
    d.lessons["1.2"] = {
      state: "in-progress",
      screen: 1,
      screensDone: ["1.2.01"],
      attempts: {},
      lastDate: "",
    };
    expect(rowStatus(r, d, banks)).toBe("in-progress");
    d.lessons["1.2"].screensDone.push("1.2.02");
    d.banks["1.2"] = { position: 0, problems: { "b1.2.01": { state: "not-yet", attempts: 1 } } };
    expect(rowStatus(r, d, banks)).toBe("in-progress");
    d.banks["1.2"].problems["b1.2.01"].state = "correct";
    expect(rowStatus(r, d, banks)).toBe("covered");
  });
  it("chapter totals count only rows that are not skips", () => {
    const d = emptyData();
    d.banks["1.2"] = { position: 0, problems: { "b1.2.01": { state: "correct", attempts: 1 } } };
    const rows = [
      row({ id: "a", bankProblems: ["b1.2.01"] }),
      row({ id: "b", bankProblems: ["b1.2.02"] }),
      row({ id: "c", kind: "skip" }),
      row({ id: "d", chapter: 2 }),
    ];
    expect(chapterTotals(rows, 1, d, banks)).toEqual({ covered: 1, total: 2 });
  });
});
