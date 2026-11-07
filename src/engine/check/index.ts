import type { Mistake, NumberAnswer, PracticeAnswer } from "../../../content/schema";
import { parseNumber, sameNumber } from "./parse";

export { parseNumber, sameNumber } from "./parse";

/** Result of a checker. `unknown` = a wrong answer with no matching mistake reply. */
export type CheckResult =
  | { kind: "correct" }
  | { kind: "mistake"; reply: string }
  | { kind: "unknown" }
  | { kind: "invalid" };

const CORRECT: CheckResult = { kind: "correct" };
const UNKNOWN: CheckResult = { kind: "unknown" };
const INVALID: CheckResult = { kind: "invalid" };

/** Compare a number with the answer, then with each mistake in order (FR-17). */
export function checkNumber(
  answer: Pick<NumberAnswer, "value" | "mistakes">,
  input: string | number,
): CheckResult {
  const n = typeof input === "number" ? input : parseNumber(input);
  if (n === null) return INVALID;
  if (sameNumber(n, answer.value)) return CORRECT;
  const hit = (answer.mistakes as Mistake<number>[] | undefined)?.find((m) =>
    sameNumber(n, m.match),
  );
  return hit ? { kind: "mistake", reply: hit.reply } : UNKNOWN;
}

/** Several slots. The result is correct only if every part is correct. */
export function checkMultiNumber(
  parts: { answer: Pick<NumberAnswer, "value" | "mistakes"> }[],
  inputs: string[],
): { overall: CheckResult; parts: CheckResult[] } {
  const results = parts.map((p, i) => checkNumber(p.answer, inputs[i] ?? ""));
  if (results.some((r) => r.kind === "invalid")) return { overall: INVALID, parts: results };
  if (results.every((r) => r.kind === "correct")) return { overall: CORRECT, parts: results };
  const first = results.find((r) => r.kind === "mistake") ?? UNKNOWN;
  return { overall: first, parts: results };
}

/** `numbers` answer (several separate results). */
export function checkNumbers(
  answer: { values: number[]; ordered: boolean },
  inputs: string[],
): CheckResult {
  const parsed = inputs.map(parseNumber);
  if (parsed.length !== answer.values.length || parsed.some((n) => n === null)) return INVALID;
  const got = parsed as number[];
  if (answer.ordered) {
    return got.every((n, i) => sameNumber(n, answer.values[i])) ? CORRECT : UNKNOWN;
  }
  const left = [...answer.values];
  for (const n of got) {
    const at = left.findIndex((v) => sameNumber(v, n));
    if (at < 0) return UNKNOWN;
    left.splice(at, 1);
  }
  return CORRECT;
}

/** Choice by option id (lessons) or index (banks). Wrong options give their own reply. */
export function checkChoice(
  options: { id: string; reply?: string }[],
  correct: string,
  chosen: string | null,
): CheckResult {
  if (chosen === null) return INVALID;
  if (chosen === correct) return CORRECT;
  const reply = options.find((o) => o.id === chosen)?.reply;
  return reply ? { kind: "mistake", reply } : UNKNOWN;
}

/** Proof, one line at a time. `expected` is the correct reason id; `chosen` is the chip. */
export function checkProofLine(
  expected: string,
  chosen: string,
  wrongReasonReplies?: Record<string, string>,
): CheckResult {
  if (chosen === expected) return CORRECT;
  const reply = wrongReasonReplies?.[chosen];
  return reply ? { kind: "mistake", reply } : UNKNOWN;
}

/** Self-check: the learner marks the result. */
export function checkSelfCheck(mark: "got-it" | "not-yet" | null): CheckResult {
  if (mark === null) return INVALID;
  return mark === "got-it" ? CORRECT : UNKNOWN;
}

/** Screens with no answer. */
export function checkNone(): CheckResult {
  return CORRECT;
}

/** Check a practice-bank answer. `input` is the typed text(s) or the chosen index. */
export function checkPractice(
  answer: PracticeAnswer,
  input: { text?: string[]; choice?: number | null; mark?: "got-it" | "not-yet" | null },
): CheckResult {
  switch (answer.type) {
    case "number":
      return checkNumber(answer, input.text?.[0] ?? "");
    case "numbers":
      return checkNumbers(answer, input.text ?? []);
    case "choice": {
      const ids = answer.options.map((_, i) => ({ id: String(i) }));
      const chosen = input.choice == null ? null : String(input.choice);
      return checkChoice(ids, String(answer.correct), chosen);
    }
    case "self-check":
      return checkSelfCheck(input.mark ?? null);
    case "none":
      return checkNone();
    default:
      // pair, triple, expression, set, interval: later phases.
      return UNKNOWN;
  }
}
