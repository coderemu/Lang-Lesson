import { describe, expect, it } from "vitest";
import type { Lesson, PracticeBank } from "../../../content/schema";
import lesson12 from "../../../content/lessons/lesson-1.2.json";
import bank12 from "../../../content/practice/bank-1.2.json";
import {
  checkChoice,
  checkMultiNumber,
  checkNone,
  checkNumber,
  checkNumbers,
  checkPractice,
  checkProofLine,
  checkSelfCheck,
  parseNumber,
} from "./index";

describe("parseNumber (FR-22)", () => {
  it.each([
    ["3", 3],
    ["-3", -3],
    ["−3", -3],
    ["+4", 4],
    [" - 3 ", -3],
    ["1/2", 0.5],
    ["−3/4", -0.75],
    ["2.5", 2.5],
    ["-.5", -0.5],
    ["1,5", 1.5],
  ])("parses %s", (text, value) => {
    expect(parseNumber(text)).toBeCloseTo(value);
  });
  it.each(["", "abc", "1/0", "3x", "--3", "1/2/3", "−"])("rejects %s", (text) => {
    expect(parseNumber(text)).toBeNull();
  });
});

describe("checkNumber", () => {
  const answer = {
    value: -2,
    mistakes: [
      { match: 16, reply: "r16" },
      { match: 2, reply: "r2" },
    ],
  };
  it("accepts the right value in any notation", () => {
    expect(checkNumber(answer, "−2").kind).toBe("correct");
    expect(checkNumber(answer, "-2").kind).toBe("correct");
    expect(checkNumber(answer, -2).kind).toBe("correct");
  });
  it("matches mistakes in order", () => {
    expect(checkNumber(answer, "16")).toEqual({ kind: "mistake", reply: "r16" });
    expect(checkNumber(answer, "2")).toEqual({ kind: "mistake", reply: "r2" });
  });
  it("returns unknown for other numbers and invalid for text", () => {
    expect(checkNumber(answer, "5").kind).toBe("unknown");
    expect(checkNumber(answer, "x").kind).toBe("invalid");
  });
});

describe("other checkers", () => {
  it("checkMultiNumber needs every part", () => {
    const parts = [
      { answer: { value: 1 } },
      { answer: { value: 2, mistakes: [{ match: 5, reply: "m" }] } },
    ];
    expect(checkMultiNumber(parts, ["1", "2"]).overall.kind).toBe("correct");
    expect(checkMultiNumber(parts, ["1", "5"]).overall).toEqual({ kind: "mistake", reply: "m" });
    expect(checkMultiNumber(parts, ["0", "9"]).overall.kind).toBe("unknown");
    expect(checkMultiNumber(parts, ["1", ""]).overall.kind).toBe("invalid");
  });
  it("checkNumbers ordered and unordered", () => {
    expect(checkNumbers({ values: [1, 2], ordered: true }, ["1", "2"]).kind).toBe("correct");
    expect(checkNumbers({ values: [1, 2], ordered: true }, ["2", "1"]).kind).toBe("unknown");
    expect(checkNumbers({ values: [1, 2], ordered: false }, ["2", "1"]).kind).toBe("correct");
    expect(checkNumbers({ values: [1, 1], ordered: false }, ["1", "2"]).kind).toBe("unknown");
    expect(checkNumbers({ values: [1, 2], ordered: false }, ["1"]).kind).toBe("invalid");
  });
  it("checkChoice", () => {
    const opts = [{ id: "a", reply: "ra" }, { id: "b" }, { id: "c" }];
    expect(checkChoice(opts, "b", "b").kind).toBe("correct");
    expect(checkChoice(opts, "b", "a")).toEqual({ kind: "mistake", reply: "ra" });
    expect(checkChoice(opts, "b", "c").kind).toBe("unknown");
    expect(checkChoice(opts, "b", null).kind).toBe("invalid");
  });
  it("checkProofLine", () => {
    expect(checkProofLine("N2", "N2").kind).toBe("correct");
    expect(checkProofLine("N2", "N1", { N1: "no zero" })).toEqual({
      kind: "mistake",
      reply: "no zero",
    });
    expect(checkProofLine("N2", "N1").kind).toBe("unknown");
  });
  it("checkSelfCheck and checkNone", () => {
    expect(checkSelfCheck("got-it").kind).toBe("correct");
    expect(checkSelfCheck("not-yet").kind).toBe("unknown");
    expect(checkSelfCheck(null).kind).toBe("invalid");
    expect(checkNone().kind).toBe("correct");
  });
  it("checkPractice routes by type", () => {
    expect(checkPractice({ type: "number", value: 8 }, { text: ["8"] }).kind).toBe("correct");
    expect(
      checkPractice({ type: "choice", options: ["a", "b"], correct: 1 }, { choice: 1 }).kind,
    ).toBe("correct");
    expect(
      checkPractice({ type: "choice", options: ["a", "b"], correct: 1 }, { choice: 0 }).kind,
    ).toBe("unknown");
    expect(checkPractice({ type: "self-check" }, { mark: "got-it" }).kind).toBe("correct");
    expect(checkPractice({ type: "none" }, {}).kind).toBe("correct");
    expect(
      checkPractice({ type: "numbers", values: [1], ordered: true }, { text: ["1"] }).kind,
    ).toBe("correct");
    expect(checkPractice({ type: "set", values: ["1"] }, { text: ["1"] }).kind).toBe("unknown");
  });
});

/** Every mistake in the real content gives its exact reply, and the answer is correct. */
describe("content: lesson 1.2", () => {
  const lesson = lesson12 as unknown as Lesson;
  const numberAnswers: {
    where: string;
    answer: { value: number; mistakes?: { match: number; reply: string }[] };
  }[] = [];
  for (const s of lesson.screens) {
    const i = s.interaction;
    const add = (
      where: string,
      a: { value: number; mistakes?: { match: number; reply: string }[] } | undefined,
    ) => {
      if (a) numberAnswers.push({ where, answer: a });
    };
    if (i.type === "number-line" || i.type === "number-input" || i.type === "balance") {
      add(s.id, i.answer);
      if (i.type === "number-line" && i.followUp?.type === "number-input")
        add(s.id + " follow-up", i.followUp.answer);
    }
    if (i.type === "multi-number-input")
      i.parts.forEach((p, k) => add(`${s.id} part ${k + 1}`, p.answer));
    if (s.twin?.type === "number-input") add(s.id + " twin", s.twin.answer);
  }
  it("has number answers to check", () => expect(numberAnswers.length).toBeGreaterThan(8));
  for (const { where, answer } of numberAnswers) {
    it(`${where}: correct value and every mistake`, () => {
      expect(checkNumber(answer, answer.value).kind).toBe("correct");
      for (const m of answer.mistakes ?? []) {
        expect(checkNumber(answer, m.match)).toEqual({ kind: "mistake", reply: m.reply });
      }
    });
  }
  it("proof screens: right reason is correct, each wrong reason gives its reply", () => {
    for (const s of lesson.screens) {
      const i = s.interaction;
      if (i.type !== "proof") continue;
      for (const line of i.lines) {
        if (line.reason === null) continue;
        expect(checkProofLine(line.reason, line.reason, i.wrongReasonReplies).kind).toBe("correct");
        for (const [chip, reply] of Object.entries(i.wrongReasonReplies ?? {})) {
          if (chip !== line.reason) {
            expect(checkProofLine(line.reason, chip, i.wrongReasonReplies)).toEqual({
              kind: "mistake",
              reply,
            });
          }
        }
      }
    }
  });
  it("choice screens", () => {
    for (const s of lesson.screens) {
      const i = s.interaction;
      const c =
        i.type === "number-line" && i.followUp?.type === "choice"
          ? i.followUp
          : i.type === "trap-summary"
            ? i.trap
            : null;
      if (!c) continue;
      expect(checkChoice(c.options, c.correct, c.correct).kind).toBe("correct");
      for (const o of c.options.filter((o) => o.id !== c.correct && o.reply)) {
        expect(checkChoice(c.options, c.correct, o.id)).toEqual({
          kind: "mistake",
          reply: o.reply,
        });
      }
    }
  });
});

describe("content: bank 1.2", () => {
  const bank = bank12 as unknown as PracticeBank;
  for (const p of bank.problems) {
    if (p.answer.type !== "number") continue;
    const a = p.answer;
    it(`${p.id}: value and mistakes`, () => {
      expect(checkPractice(a, { text: [String(a.value)] }).kind).toBe("correct");
      for (const m of a.mistakes ?? []) {
        expect(checkPractice(a, { text: [String(m.match)] })).toEqual({
          kind: "mistake",
          reply: m.reply,
        });
      }
    });
  }
  it("self-check problems are marked by the learner", () => {
    const sc = bank.problems.filter((p) => p.answer.type === "self-check");
    expect(sc.length).toBeGreaterThan(0);
    for (const p of sc) expect(checkPractice(p.answer, { mark: "got-it" }).kind).toBe("correct");
  });
});
