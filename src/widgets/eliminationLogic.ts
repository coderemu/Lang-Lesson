/**
 * Logic of the elimination board (Chapter 2). Pure and exact: coefficients are fractions,
 * so 6/7 stays 6/7 and the learner never sees a rounding error.
 */

/** A fraction n/d with d > 0, in lowest terms. */
export interface Q {
  n: number;
  d: number;
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const q = (n: number, d = 1): Q => {
  const g = gcd(n, d) || 1;
  const s = d < 0 ? -1 : 1;
  return { n: (s * n) / g, d: (s * d) / g };
};
export const qAdd = (a: Q, b: Q): Q => q(a.n * b.d + b.n * a.d, a.d * b.d);
export const qSub = (a: Q, b: Q): Q => q(a.n * b.d - b.n * a.d, a.d * b.d);
export const qMul = (a: Q, b: Q): Q => q(a.n * b.n, a.d * b.d);
export const qIsZero = (a: Q): boolean => a.n === 0;
export const qValue = (a: Q): number => a.n / a.d;

const MINUS = "−";

/** "−3", "6/7", "1/2". */
export function formatQ(a: Q): string {
  const sign = a.n < 0 ? MINUS : "";
  const n = Math.abs(a.n);
  return a.d === 1 ? `${sign}${n}` : `${sign}${n}/${a.d}`;
}

/** Parse "3", "-2", "−2", "6/7", "0.5". Returns null when the text is not a number. */
export function parseQ(raw: string): Q | null {
  const t = raw.replace(/[−–‒]/g, "-").replace(/\s+/g, "").replace(",", ".");
  const frac = /^([+-]?)(\d+)\/(\d+)$/.exec(t);
  if (frac) {
    const d = Number(frac[3]);
    if (d === 0) return null;
    return q((frac[1] === "-" ? -1 : 1) * Number(frac[2]), d);
  }
  const dec = /^([+-]?)(\d*)(?:\.(\d+))?$/.exec(t);
  if (dec && (dec[2] !== "" || dec[3] !== undefined)) {
    const digits = dec[3] ?? "";
    const n = Number(`${dec[2] || "0"}${digits}`);
    return q((dec[1] === "-" ? -1 : 1) * n, 10 ** digits.length);
  }
  return null;
}

/* ───────── Rows ───────── */

export type Variable = "x" | "y" | "z";
export const VARIABLES: Record<"two-unknowns" | "three-unknowns" | "general", Variable[]> = {
  "two-unknowns": ["x", "y"],
  "three-unknowns": ["x", "y", "z"],
  general: ["x", "y"],
};

export interface Row {
  /** "1", "2", "3 = 1 + 2" … shown as R1, R2. */
  label: string;
  coef: Record<Variable, Q>;
  rhs: Q;
  /** How the row was made, for the screen reader. */
  how?: string;
}

/**
 * Read a TeX-like equation such as "2x + y = 1", "x - y + z = 2" or "\\frac{1}{2}x + y = 2".
 * Only the letters x, y, z are unknowns.
 */
export function parseEquation(tex: string): Row {
  const clean = tex
    .replace(/\\[dt]?frac\{(-?\d+)\}\{(\d+)\}/g, "($1/$2)")
    .replace(/\\cdot|\\,|\\ |\{|\}|\$/g, "")
    .replace(/[−–]/g, "-")
    .replace(/\s+/g, "");
  const [lhs, rhs] = clean.split("=");
  const coef: Record<Variable, Q> = { x: q(0), y: q(0), z: q(0) };
  const re = /([+-]?)(\(-?\d+\/\d+\)|\d+(?:\.\d+)?(?:\/\d+)?)?([xyz])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(lhs))) {
    const num = m[2] ? (parseQ(m[2].replace(/[()]/g, "")) as Q) : q(1);
    const signed = m[1] === "-" ? q(-num.n, num.d) : num;
    coef[m[3] as Variable] = qAdd(coef[m[3] as Variable], signed);
  }
  return { label: "", coef, rhs: parseQ(rhs.replace(/[()]/g, "")) ?? q(0) };
}

export const scaleRow = (row: Row, k: Q, label: string): Row => ({
  label,
  coef: {
    x: qMul(row.coef.x, k),
    y: qMul(row.coef.y, k),
    z: qMul(row.coef.z, k),
  },
  rhs: qMul(row.rhs, k),
  how: `${formatQ(k)} times row ${row.label}`,
});

/** a + b (sign = 1) or a − b (sign = −1). */
export const combineRows = (a: Row, b: Row, sign: 1 | -1, label: string): Row => {
  const op = sign === 1 ? qAdd : qSub;
  return {
    label,
    coef: { x: op(a.coef.x, b.coef.x), y: op(a.coef.y, b.coef.y), z: op(a.coef.z, b.coef.z) },
    rhs: op(a.rhs, b.rhs),
    how: `row ${a.label} ${sign === 1 ? "plus" : "minus"} row ${b.label}`,
  };
};

/** Is a row an identity "0 = 0" or a contradiction "0 = c"? */
export function rowKind(row: Row, vars: Variable[]): "normal" | "identity" | "contradiction" {
  if (vars.some((v) => !qIsZero(row.coef[v]))) return "normal";
  return qIsZero(row.rhs) ? "identity" : "contradiction";
}

/** Letters that have no tile left in this row. */
export const cancelled = (row: Row, vars: Variable[]): Variable[] =>
  vars.filter((v) => qIsZero(row.coef[v]));

/** Row as plain words, for the screen reader and the live region: "2y = 4". */
export function describeRow(row: Row, vars: Variable[]): string {
  const parts: string[] = [];
  for (const v of vars) {
    const c = row.coef[v];
    if (qIsZero(c)) continue;
    const abs = q(Math.abs(c.n), c.d);
    const body = `${abs.n === 1 && abs.d === 1 ? "" : formatQ(abs)}${v}`;
    parts.push(
      parts.length === 0 ? `${c.n < 0 ? MINUS : ""}${body}` : `${c.n < 0 ? MINUS : "+"} ${body}`,
    );
  }
  return `${parts.length ? parts.join(" ") : "0"} = ${formatQ(row.rhs)}`;
}

/** ad − bc of the first two rows (general mode). Row 1: ax + by = u. Row 2: cx + dy = v. */
export function determinant(r1: Row, r2: Row): Q {
  return qSub(qMul(r1.coef.x, r2.coef.y), qMul(r1.coef.y, r2.coef.x));
}

/** "The x term cancelled." for a new row, or "" when no letter is gone. */
export function describeCancel(row: Row, vars: Variable[]): string {
  const gone = cancelled(row, vars);
  if (gone.length === 0) return "";
  return `The ${gone.join(" and ")} term${gone.length > 1 ? "s" : ""} cancelled.`;
}
