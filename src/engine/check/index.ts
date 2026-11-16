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

/* ───────── Systems of equations (Chapter 2) ───────── */

/**
 * Read an answer for two or three unknowns. Accepts "(4, 3)", "4, 3", "x = 4, y = 3" and "x=6/7; y=-5/7".
 * Returns the values in the order of `vars`, or null when the text is not a complete answer.
 */
export function parseTuple(text: string, vars: string[]): number[] | null {
  const t = text.replace(/[()[\]{}]/g, "").trim();
  if (t === "") return null;
  const parts = t.split(/[;,]/).map((p) => p.trim());
  if (parts.length !== vars.length) return null;
  if (parts.every((p) => p.includes("="))) {
    const byName = new Map<string, number>();
    for (const p of parts) {
      const [name, value] = p.split("=").map((x) => x.trim());
      const n = parseNumber(value ?? "");
      if (!vars.includes(name) || n === null) return null;
      byName.set(name, n);
    }
    return vars.every((v) => byName.has(v)) ? vars.map((v) => byName.get(v) as number) : null;
  }
  if (parts.some((p) => p.includes("="))) return null;
  const nums = parts.map(parseNumber);
  return nums.every((n) => n !== null) ? (nums as number[]) : null;
}

/** The learner's values: one slot per unknown, or one slot that holds the whole answer. */
function readTuple(inputs: string[], vars: string[]): number[] | null {
  const filled = inputs.filter((s) => (s ?? "").trim() !== "");
  if (filled.length === 1 && vars.length > 1) return parseTuple(filled[0], vars);
  if (inputs.length < vars.length) return null;
  const nums = vars.map((_, k) => parseNumber(inputs[k] ?? ""));
  return nums.every((n) => n !== null) ? (nums as number[]) : null;
}

const sameTuple = (a: number[], b: number[]) => a.every((n, k) => sameNumber(n, b[k]));

/** `pair` and `triple`: compare the tuple with the answer. */
export function checkTuple(answer: Record<string, number>, inputs: string[]): CheckResult {
  const vars = Object.keys(answer);
  const got = readTuple(inputs, vars);
  if (got === null) return INVALID;
  return sameTuple(
    got,
    vars.map((v) => answer[v]),
  )
    ? CORRECT
    : UNKNOWN;
}

/**
 * Elimination screens. `values` is the solution, "none" (no solution) or "many" (many solutions).
 * `chosen` is "none" or "many" when the learner tapped that chip. Mistake matches are "x=1;y=2", "none" or "many".
 */
export function checkSystem(
  values: Record<string, number> | "none" | "many",
  input: { text: string[]; chosen: string | null },
  mistakes: Mistake<string>[] = [],
): CheckResult {
  const vars = typeof values === "object" ? Object.keys(values) : [];
  const reply = (r: CheckResult): CheckResult => r;
  const hit = (predicate: (m: Mistake<string>) => boolean): CheckResult => {
    const m = mistakes.find(predicate);
    return m ? { kind: "mistake", reply: m.reply } : UNKNOWN;
  };
  if (input.chosen === "none" || input.chosen === "many") {
    if (values === input.chosen) return CORRECT;
    return hit((m) => m.match === input.chosen);
  }
  const tupleVars = vars.length ? vars : ["x", "y"];
  const got = readTuple(input.text, tupleVars);
  if (got === null) return INVALID;
  if (typeof values === "object") {
    if (
      sameTuple(
        got,
        vars.map((v) => values[v]),
      )
    )
      return CORRECT;
  }
  return reply(
    hit((m) => {
      const want = parseMatchTuple(m.match, tupleVars);
      return want !== null && sameTuple(got, want);
    }),
  );
}

function parseMatchTuple(match: string, vars: string[]): number[] | null {
  if (match === "none" || match === "many") return null;
  return parseTuple(match.replace(/;/g, ","), vars);
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
    case "pair":
      return checkTuple(answer.values, input.text ?? []);
    case "triple":
      return checkTuple(answer.values, input.text ?? []);
    case "none": {
      // "Is there a solution?" Choice 1 is "No solution".
      if (input.choice == null) return INVALID;
      return input.choice === 1 ? CORRECT : UNKNOWN;
    }
    default:
      // expression, set, interval: later phases.
      return UNKNOWN;
  }
}
