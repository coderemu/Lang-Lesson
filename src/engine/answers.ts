import type {
  ChoiceInteraction,
  EliminationInteraction,
  Feedback,
  Interaction,
  NumberAnswer,
  PracticeAnswer,
  TextInputInteraction,
} from "../../content/schema";
import {
  checkChoice,
  checkMultiNumber,
  checkNumber,
  checkPractice,
  checkSystem,
  parseNumber,
  type CheckResult,
} from "./check";
import { checkExpression, checkInterval, checkSet, readable } from "./check/expr";
import { EI_KEY } from "../widgets/ch3";

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
  | { t: "thermometer"; result: number; sameSide: Feedback; otherSide: Feedback }
  | { t: "system"; i: EliminationInteraction }
  | { t: "text"; i: TextInputInteraction }
  | { t: "ei"; feedback: Feedback; wrongReply?: string };

/** The letters a system screen asks for. */
export function systemVars(i: EliminationInteraction): string[] {
  if (typeof i.answer.values === "object") return Object.keys(i.answer.values);
  return i.mode === "three-unknowns" ? ["x", "y", "z"] : ["x", "y"];
}

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
      if (i.followUp) return answerSpec(i.followUp as Interaction);
      return i.answer ? { t: "number", answer: i.answer } : { t: "none" };
    case "balance":
      return { t: "number", answer: i.answer };
    case "elimination":
      return { t: "system", i };
    case "text-input":
      return { t: "text", i };
    case "ei-table":
      return { t: "ei", feedback: i.feedback, wrongReply: i.wrongReply };
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
    case "text":
      return (input.text[0] ?? "").trim() !== "";
    case "ei":
      return (input.text[0] ?? "").length === 8 && !(input.text[0] ?? "").includes("-");
    case "system":
      return (
        input.choice !== null ||
        systemVars(spec.i).every((_, k) => (input.text[k] ?? "").trim() !== "")
      );
  }
}

/** The outcome of Check: what the sheet shows. */
export type Outcome =
  | { kind: "correct"; title: string; body: string }
  | { kind: "wrong-reason"; title: string; body: string }
  | { kind: "not-quite"; title: string; body: string }
  | { kind: "invalid"; body: string };

export const NOT_QUITE = "Not quite.";
export const INVALID_SYSTEM = "Enter a number for each letter, for example 3, −3 or 6/7.";
export const INVALID_NUMBER = "Enter a number, for example 3, −3 or 1/2.";
export const TEXT_HELP =
  "Type sqrt(5) for √5, a/b for fractions and inf for ∞. Use or between parts.";
export const INVALID_TEXT: Record<"expression" | "set" | "interval", string> = {
  expression: "Enter an expression, for example √5 + 2.",
  set: "Enter the numbers, for example 2, −3 or ±√7.",
  interval: "Enter an interval, for example −2 < x < 3 or x > 7.",
};

/** Run the checker of a text-input interaction. */
export function checkText(i: TextInputInteraction, text: string): CheckResult {
  const a = i.answer;
  if (i.checker === "set") return checkSet({ values: a.values ?? [], mistakes: a.mistakes }, text);
  if (i.checker === "interval")
    return checkInterval({ value: a.value ?? "", mistakes: a.mistakes }, text);
  return checkExpression(
    { value: a.value ?? "", variables: a.variables ?? [], mistakes: a.mistakes },
    text,
  );
}
export { readable };

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
    case "system": {
      const a = spec.i.answer;
      const r = checkSystem(a.values, { text: input.text, chosen: input.choice }, spec.i.mistakes);
      if (r.kind === "correct")
        return { kind: "correct", title: a.correctTitle, body: a.correctWhy };
      if (r.kind === "invalid") return { kind: "invalid", body: INVALID_SYSTEM };
      return wrong(r, generalHint);
    }
    case "text": {
      const r = checkText(spec.i, input.text[0] ?? "");
      if (r.kind === "correct")
        return {
          kind: "correct",
          title: spec.i.answer.correctTitle,
          body: spec.i.answer.correctWhy,
        };
      if (r.kind === "invalid") return { kind: "invalid", body: INVALID_TEXT[spec.i.checker] };
      return wrong(r, generalHint);
    }
    case "ei": {
      if ((input.text[0] ?? "") === EI_KEY)
        return {
          kind: "correct",
          title: spec.feedback.correctTitle,
          body: spec.feedback.correctWhy,
        };
      return { kind: "not-quite", title: NOT_QUITE, body: spec.wrongReply ?? generalHint };
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
  if (r.kind === "invalid") {
    const system = answer.type === "pair" || answer.type === "triple";
    const typed =
      answer.type === "expression" || answer.type === "set" || answer.type === "interval"
        ? INVALID_TEXT[answer.type]
        : null;
    return { kind: "invalid", body: typed ?? (system ? INVALID_SYSTEM : INVALID_NUMBER) };
  }
  return { kind: "not-quite", body: r.kind === "mistake" ? r.reply : BANK_GENERAL_HINT };
}
