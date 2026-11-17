/**
 * Checkers for typed algebra answers (Chapter 3): `expression`, `set`, `interval`.
 * They use the number-only build of mathjs. It loads on demand (`loadMath`), so only
 * lessons and banks with typed answers pay for it. Call `loadMath()` once before the sync checks.
 */
import type { CheckResult } from "./index";

type Evaluate = (expr: string, scope?: Record<string, number>) => unknown;
let evaluator: Evaluate | null = null;
let loading: Promise<void> | null = null;

/** Load mathjs (a separate chunk). Safe to call many times. */
export function loadMath(): Promise<void> {
  if (evaluator) return Promise.resolve();
  loading ??= import("mathjs/number").then((m) => {
    evaluator = m.evaluate as Evaluate;
  });
  return loading;
}
export const mathLoaded = (): boolean => evaluator !== null;

const SUPERSCRIPT: Record<string, string> = {
  "²": "^2",
  "³": "^3",
  "⁴": "^4",
  "⁻": "^-",
};

/** Learner text → mathjs text. Returns null when it cannot be read. */
export function normalise(raw: string): string | null {
  let t = raw
    .replace(/[−–‒]/g, "-")
    .replace(/[·×]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[²³⁴]/g, (c) => SUPERSCRIPT[c])
    .replace(/∞/g, "Infinity");
  // √ followed by a number, a name or a bracket.
  t = t.replace(/√\s*\(/g, "sqrt(");
  t = t.replace(/√\s*([0-9]+(?:\.[0-9]+)?|[a-zA-Z]+)/g, "sqrt($1)");
  if (/√/.test(t)) return null;
  t = t.trim();
  return t === "" ? null : t;
}

function evalNumber(text: string, scope: Record<string, number> = {}): number | null {
  if (!evaluator) return null;
  try {
    const v = evaluator(text, scope);
    return typeof v === "number" && !Number.isNaN(v) ? v : null;
  } catch {
    return null;
  }
}

const close = (a: number, b: number) =>
  a === b ||
  (Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)));

/** A value without letters: "√5", "-1/2", "2 sqrt(3)". */
export function parseValue(raw: string): number | null {
  const t = normalise(raw);
  return t === null ? null : evalNumber(t);
}

/** Pseudo-random points that are the same on every run (no flaky tests). */
function points(variables: string[], count: number): Record<string, number>[] {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: count }, () =>
    Object.fromEntries(variables.map((v) => [v, 0.5 + Math.round(next() * 90) / 20])),
  );
}

/** Two expressions with the same values at 10 points are equal. */
export function sameExpression(a: string, b: string, variables: string[]): boolean | null {
  const ta = normalise(a);
  const tb = normalise(b);
  if (ta === null || tb === null) return null;
  let valid = 0;
  for (const scope of points(variables, variables.length ? 10 : 1)) {
    const va = evalNumber(ta, scope);
    const vb = evalNumber(tb, scope);
    if (va === null && vb === null) continue;
    if (va === null || vb === null || !close(va, vb)) return false;
    valid++;
  }
  return valid > 0;
}

/** Is the text a well-formed expression in these variables? */
export function readable(raw: string, variables: string[]): boolean {
  const t = normalise(raw);
  if (t === null) return false;
  return points(variables, 3).some((s) => evalNumber(t, s) !== null);
}

export function checkExpression(
  answer: { value: string; variables: string[]; mistakes?: { match: string; reply: string }[] },
  input: string,
): CheckResult {
  if (!readable(input, answer.variables)) return { kind: "invalid" };
  if (sameExpression(input, answer.value, answer.variables)) return { kind: "correct" };
  const hit = answer.mistakes?.find((m) => sameExpression(input, m.match, answer.variables));
  return hit ? { kind: "mistake", reply: hit.reply } : { kind: "unknown" };
}

/* ───────── set ───────── */

/** "2, -3", "2 or -3", "{2; -3}", "1 ± sqrt(5)" → distinct numbers, sorted. null = unreadable. */
export function parseSet(raw: string): number[] | null {
  const t = raw.replace(/[{}]/g, " ").trim();
  if (t === "") return null;
  const parts = t.split(/\s*(?:,|;|\bor\b|\band\b)\s*/i).filter((p) => p.trim() !== "");
  const out: number[] = [];
  for (const p of parts) {
    const forms = /[±]/.test(p) ? [p.replace(/±/g, "+"), p.replace(/±/g, "-")] : [p];
    for (const f of forms) {
      const v = parseValue(f.replace(/^\s*\+/, "").replace(/^\s*-\s*\+/, "-"));
      if (v === null) return null;
      out.push(v);
    }
  }
  const distinct: number[] = [];
  for (const v of out.sort((a, b) => a - b))
    if (!distinct.some((d) => close(d, v))) distinct.push(v);
  return distinct;
}

const sameList = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => close(v, b[i]));

export function checkSet(
  answer: { values: string[]; mistakes?: { match: string; reply: string }[] },
  input: string,
): CheckResult {
  const got = parseSet(input);
  if (got === null) return { kind: "invalid" };
  const want = parseSet(answer.values.join(","));
  if (want && sameList(got, want)) return { kind: "correct" };
  const hit = answer.mistakes?.find((m) => {
    const w = parseSet(m.match);
    return w !== null && sameList(got, w);
  });
  return hit ? { kind: "mistake", reply: hit.reply } : { kind: "unknown" };
}

/* ───────── interval ───────── */

export interface Piece {
  lo: number;
  hi: number;
  loClosed: boolean;
  hiClosed: boolean;
}

const OPS = /(<=|>=|≤|≥|<|>)/;

function parsePiece(rawPiece: string): Piece | null {
  const text = rawPiece.trim();
  const bracket = /^([([])\s*(.+?)\s*,\s*(.+?)\s*([)\]])$/.exec(text);
  if (bracket) {
    const lo = parseValue(bracket[2]);
    const hi = parseValue(bracket[3]);
    if (lo === null || hi === null || lo > hi) return null;
    return {
      lo,
      hi,
      loClosed: bracket[1] === "[" && Number.isFinite(lo),
      hiClosed: bracket[4] === "]" && Number.isFinite(hi),
    };
  }
  const bits = text.split(OPS).map((s) => s.trim());
  const operands = bits.filter((_, i) => i % 2 === 0);
  const ops = bits.filter((_, i) => i % 2 === 1);
  const isVar = (s: string) => /^[a-zA-Z]$/.test(s);
  const strict = (op: string) => op === "<" || op === ">";
  if (operands.length === 2 && ops.length === 1) {
    const [l, r] = operands;
    const op = ops[0];
    const less = op === "<" || op === "<=" || op === "≤";
    if (isVar(l) && !isVar(r)) {
      const v = parseValue(r);
      if (v === null) return null;
      // x < v  or  x > v
      return less
        ? { lo: -Infinity, hi: v, loClosed: false, hiClosed: !strict(op) }
        : { lo: v, hi: Infinity, loClosed: !strict(op), hiClosed: false };
    }
    if (isVar(r) && !isVar(l)) {
      const v = parseValue(l);
      if (v === null) return null;
      // v < x  or  v > x
      return less
        ? { lo: v, hi: Infinity, loClosed: !strict(op), hiClosed: false }
        : { lo: -Infinity, hi: v, loClosed: false, hiClosed: !strict(op) };
    }
    return null;
  }
  if (operands.length === 3 && ops.length === 2 && isVar(operands[1])) {
    const lessBoth = ops.every((o) => o === "<" || o === "<=" || o === "≤");
    const moreBoth = ops.every((o) => o === ">" || o === ">=" || o === "≥");
    if (!lessBoth && !moreBoth) return null;
    const a = parseValue(operands[0]);
    const b = parseValue(operands[2]);
    if (a === null || b === null) return null;
    const [lo, hi, opLo, opHi] = lessBoth ? [a, b, ops[0], ops[1]] : [b, a, ops[1], ops[0]];
    if (lo > hi) return null;
    return { lo, hi, loClosed: !strict(opLo), hiClosed: !strict(opHi) };
  }
  return null;
}

/** Read an interval or a union of intervals. Pieces are sorted by their low end. */
export function parseInterval(raw: string): Piece[] | null {
  const t = raw.replace(/[−–‒]/g, "-").replace(/∪/g, " U ").trim();
  if (t === "") return null;
  const parts = t.split(/\s+or\s+|\s+U\s+|\bU\b/i).filter((p) => p.trim() !== "");
  const pieces: Piece[] = [];
  for (const p of parts) {
    const piece = parsePiece(p.replace(/\binf(inity)?\b/gi, "Infinity"));
    if (piece === null) return null;
    pieces.push(piece);
  }
  return pieces.sort((a, b) => a.lo - b.lo || Number(b.loClosed) - Number(a.loClosed));
}

const samePieces = (a: Piece[], b: Piece[]) =>
  a.length === b.length &&
  a.every(
    (p, i) =>
      close(p.lo, b[i].lo) &&
      close(p.hi, b[i].hi) &&
      p.loClosed === b[i].loClosed &&
      p.hiClosed === b[i].hiClosed,
  );

export function checkInterval(
  answer: { value: string; mistakes?: { match: string; reply: string }[] },
  input: string,
): CheckResult {
  const got = parseInterval(input);
  if (got === null) return { kind: "invalid" };
  const want = parseInterval(answer.value);
  if (want && samePieces(got, want)) return { kind: "correct" };
  const hit = answer.mistakes?.find((m) => {
    const w = parseInterval(m.match);
    return w !== null && samePieces(got, w);
  });
  return hit ? { kind: "mistake", reply: hit.reply } : { kind: "unknown" };
}
