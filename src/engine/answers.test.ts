import { describe, expect, it } from "vitest";
import type { Interaction, PracticeAnswer } from "../../content/schema";
import {
  answerSpec,
  emptyInput,
  evaluate,
  evaluatePractice,
  hasAnswer,
  partStates,
  BANK_GENERAL_HINT,
} from "./answers";

const fb = { correctTitle: "T", correctWhy: "W" };
const input = (text: string[] = [], choice: string | null = null) => ({
  ...emptyInput(),
  text,
  choice,
});

describe("answerSpec", () => {
  it("maps interactions to answer specs", () => {
    const num: Interaction = {
      type: "number-input",
      expression: "1+1=",
      answer: { value: 2, ...fb },
    };
    expect(answerSpec(num).t).toBe("number");
    expect(answerSpec({ type: "none" }).t).toBe("none");
    expect(answerSpec({ type: "proof", goal: "", lines: [], tray: [], feedback: fb }).t).toBe(
      "none",
    );
    expect(
      answerSpec({
        type: "balance",
        mode: "solve",
        widget: {} as never,
        answer: { value: 2, ...fb },
      }).t,
    ).toBe("number");
    const line: Interaction = { type: "number-line", mode: "place", widget: {} as never };
    expect(answerSpec(line).t).toBe("none");
    expect(answerSpec({ ...line, answer: { value: 1, ...fb } } as Interaction).t).toBe("number");
    const follow: Interaction = {
      type: "number-line",
      mode: "compare",
      widget: {} as never,
      followUp: {
        type: "choice",
        options: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        correct: "a",
        feedback: fb,
      },
    };
    expect(answerSpec(follow).t).toBe("choice");
    expect(
      answerSpec({
        type: "thermometer",
        mode: "guess",
        widget: { min: 0, max: 1, start: 0, change: 1 },
        result: -5,
        guessFeedback: { sameSide: fb, otherSide: fb },
      }).t,
    ).toBe("thermometer");
    expect(
      answerSpec({
        type: "multi-number-input",
        parts: [
          { expression: "a", answer: { value: 1, ...fb } },
          { expression: "b", answer: { value: 2, ...fb } },
        ],
      }).t,
    ).toBe("multi");
  });
});

describe("hasAnswer", () => {
  it("needs input for answerable screens", () => {
    const spec = answerSpec({ type: "number-input", expression: "", answer: { value: 1, ...fb } });
    expect(hasAnswer(spec, input())).toBe(false);
    expect(hasAnswer(spec, input([" "]))).toBe(false);
    expect(hasAnswer(spec, input(["1"]))).toBe(true);
    expect(hasAnswer({ t: "none" }, input())).toBe(true);
    const ch = answerSpec({
      type: "choice",
      options: [
        { id: "a", label: "A" },
        { id: "b", label: "B" },
      ],
      correct: "a",
      feedback: fb,
    });
    expect(hasAnswer(ch, input())).toBe(false);
    expect(hasAnswer(ch, input([], "b"))).toBe(true);
    const multi = answerSpec({
      type: "multi-number-input",
      parts: [
        { expression: "a", answer: { value: 1, ...fb } },
        { expression: "b", answer: { value: 2, ...fb } },
      ],
    });
    expect(hasAnswer(multi, input(["1"]))).toBe(false);
    expect(hasAnswer(multi, input(["1", "2"]))).toBe(true);
  });
});

describe("evaluate", () => {
  const gen = "General hint";
  const num = answerSpec({
    type: "number-input",
    expression: "",
    answer: { value: 2, ...fb, mistakes: [{ match: 5, reply: "five" }] },
  });
  it("number: correct, mistake, general hint, invalid", () => {
    expect(evaluate(num, input(["2"]), gen)).toMatchObject({
      kind: "correct",
      title: "T",
      body: "W",
    });
    expect(evaluate(num, input(["5"]), gen)).toMatchObject({ kind: "not-quite", body: "five" });
    expect(evaluate(num, input(["9"]), gen)).toMatchObject({ kind: "not-quite", body: gen });
    expect(evaluate(num, input(["x"]), gen).kind).toBe("invalid");
    expect(evaluate({ t: "none" }, input(), gen).kind).toBe("correct");
  });
  it("choice: correct, reply, general", () => {
    const spec = answerSpec({
      type: "choice",
      options: [
        { id: "a", label: "A", reply: "ra" },
        { id: "b", label: "B" },
        { id: "c", label: "C" },
      ],
      correct: "b",
      feedback: fb,
    });
    expect(evaluate(spec, input([], "b"), gen).kind).toBe("correct");
    expect(evaluate(spec, input([], "a"), gen)).toMatchObject({ body: "ra" });
    expect(evaluate(spec, input([], "c"), gen)).toMatchObject({ body: gen });
  });
  it("multi: all parts, and per-slot states", () => {
    const spec = answerSpec({
      type: "multi-number-input",
      parts: [
        { expression: "a", answer: { value: 1, ...fb } },
        { expression: "b", answer: { value: 2, ...fb, mistakes: [{ match: 7, reply: "seven" }] } },
      ],
    });
    expect(evaluate(spec, input(["1", "2"]), gen).kind).toBe("correct");
    expect(evaluate(spec, input(["1", "7"]), gen)).toMatchObject({ body: "seven" });
    expect(evaluate(spec, input(["1", "x"]), gen).kind).toBe("invalid");
    expect(partStates(spec, input(["1", "7"]))).toEqual(["correct", "wrong"]);
    expect(partStates(num, input(["2"]))).toEqual([]);
  });
  it("thermometer: picks feedback by side of zero", () => {
    const spec = answerSpec({
      type: "thermometer",
      mode: "guess",
      widget: { min: 0, max: 1, start: 0, change: 1 },
      result: -5,
      guessFeedback: {
        sameSide: { correctTitle: "same", correctWhy: "s" },
        otherSide: { correctTitle: "other", correctWhy: "o" },
      },
    });
    expect(evaluate(spec, input(["-3"]), gen)).toMatchObject({ kind: "correct", title: "same" });
    expect(evaluate(spec, input(["4"]), gen)).toMatchObject({ kind: "correct", title: "other" });
    expect(evaluate(spec, input(["?"]), gen).kind).toBe("invalid");
  });
});

describe("evaluatePractice", () => {
  it("number, invalid and general hint", () => {
    const a: PracticeAnswer = { type: "number", value: 8, mistakes: [{ match: -2, reply: "neg" }] };
    expect(evaluatePractice(a, input(["8"])).kind).toBe("correct");
    expect(evaluatePractice(a, input(["-2"]))).toEqual({ kind: "not-quite", body: "neg" });
    expect(evaluatePractice(a, input(["1"]))).toEqual({
      kind: "not-quite",
      body: BANK_GENERAL_HINT,
    });
    expect(evaluatePractice(a, input(["z"])).kind).toBe("invalid");
    expect(
      evaluatePractice({ type: "choice", options: ["a", "b"], correct: 1 }, input([], "1")).kind,
    ).toBe("correct");
  });
});
