import type {
  ChoiceInteraction,
  Feedback,
  Interaction,
  NumberAnswer,
  PracticeAnswer,
} from "../../content/schema";
import {
  checkChoice,
  checkMultiNumber,
  checkNumber,
  checkPractice,
  parseNumber,
  type CheckResult,
} from "./check";

/** What the learner has entered on one screen. */
export interface Input {
  text: string[];
  choice: string | null;
  mark: "got-it" | "not-yet" | null;
}
export const emptyInput = (): Input => ({ text: [], choice: null, mark: null });

/** The answerable part of an interaction. `none` = a Continue-only screen. */
export type AnswerSpec =
  | { t: "none" }
  | { t: "number"; answer: NumberAnswer; expression?: string }
  | { t: "multi"; parts: { prompt?: string; expression: string; answer: NumberAnswer }[] }
  | { t: "choice"; choice: ChoiceInteraction }
  | { t: "thermometer"; result: number; sameSide: Feedback; otherSide: Feedback };

export function answerSpec(i: Interaction): AnswerSpec {
  switch (i.type) {
    case "number-input":
      return { t: "number", answer: i.answer, expression: i.expression };
    case "multi-number-input":
      return { t: "multi", parts: i.parts };
    case "choice":
      return { t: "choice", choice: i };
    case "thermometer":
      return {
        t: "thermometer",
        result: i.result,
        sameSide: i.guessFeedback.sameSide,
        otherSide: i.guessFeedback.otherSide,
      };
    case "number-line":
    case "area-model":
    case "square-tiles":
    case "fraction-strips":
      if (i.followUp) return answerSpec(i.followUp);
      return i.answer ? { t: "number", answer: i.answer } : { t: "none" };
    case "balance":
      return { t: "number", answer: i.answer };
    default:
      return { t: "none" };
  }
}

/** Is there enough input for Check to be enabled (FR-14)? */
export function hasAnswer(spec: AnswerSpec, input: Input): boolean {
  switch (spec.t) {
    case "none":
      return true;
    case "number":
    case "thermometer":
      return (input.text[0] ?? "").trim() !== "";
    case "multi":
      return spec.parts.every((_, k) => (input.text[k] ?? "").trim() !== "");
    case "choice":
      return input.choice !== null;
  }
}

/** The outcome of Check: what the sheet shows. */
export type Outcome =
  | { kind: "correct"; title: string; body: string }
  | { kind: "not-quite"; title: string; body: string }
  | { kind: "invalid"; body: string };

export const NOT_QUITE = "Not quite.";
export const INVALID_NUMBER = "Enter a number, for example 3, −3 or 1/2.";

const wrong = (result: CheckResult, generalHint: string): Outcome => {
  if (result.kind === "invalid") return { kind: "invalid", body: INVALID_NUMBER };
  return {
    kind: "not-quite",
    title: NOT_QUITE,
    body: result.kind === "mistake" ? result.reply : generalHint,
  };
};

/** FR-15 to FR-17. */
export function evaluate(spec: AnswerSpec, input: Input, generalHint: string): Outcome {
  switch (spec.t) {
    case "none":
      return { kind: "correct", title: "", body: "" };
    case "number": {
      const r = checkNumber(spec.answer, input.text[0] ?? "");
      return r.kind === "correct"
        ? { kind: "correct", title: spec.answer.correctTitle, body: spec.answer.correctWhy }
        : wrong(r, generalHint);
    }
    case "multi": {
      const { overall } = checkMultiNumber(spec.parts, input.text);
      if (overall.kind === "correct") {
        const last = spec.parts[spec.parts.length - 1].answer;
        return {
          kind: "correct",
          title: last.correctTitle,
          body: spec.parts.map((p) => p.answer.correctWhy).join(" "),
        };
      }
      return wrong(overall, generalHint);
    }
    case "choice": {
      const r = checkChoice(spec.choice.options, spec.choice.correct, input.choice);
      return r.kind === "correct"
        ? {
            kind: "correct",
            title: spec.choice.feedback.correctTitle,
            body: spec.choice.feedback.correctWhy,
          }
        : wrong(r, generalHint);
    }
    case "thermometer": {
      const guess = parseNumber(input.text[0] ?? "");
      if (guess === null) return { kind: "invalid", body: INVALID_NUMBER };
      const same = Math.sign(guess) === Math.sign(spec.result);
      const fb = same ? spec.sameSide : spec.otherSide;
      return { kind: "correct", title: fb.correctTitle, body: fb.correctWhy };
    }
  }
}

/** Which parts of a multi-number screen are wrong, for the slot states. */
export function partStates(spec: AnswerSpec, input: Input): ("correct" | "wrong")[] {
  if (spec.t !== "multi") return [];
  const { parts } = checkMultiNumber(spec.parts, input.text);
  return parts.map((p) => (p.kind === "correct" ? "correct" : "wrong"));
}

/* ───────── Practice banks ───────── */

export interface PracticeOutcome {
  kind: "correct" | "not-quite" | "invalid";
  body: string;
}

export const BANK_GENERAL_HINT = "Check each step again. You can open a hint.";

export function evaluatePractice(answer: PracticeAnswer, input: Input): PracticeOutcome {
  const choice = input.choice === null ? null : Number(input.choice);
  const r = checkPractice(answer, { text: input.text, choice, mark: input.mark });
  if (r.kind === "correct") return { kind: "correct", body: "" };
  if (r.kind === "invalid") return { kind: "invalid", body: INVALID_NUMBER };
  return { kind: "not-quite", body: r.kind === "mistake" ? r.reply : BANK_GENERAL_HINT };
}
