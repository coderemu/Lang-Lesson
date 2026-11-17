/** Pure helpers of the Chapter 3 widgets. */

/** m / 10^k as text, e.g. (141, 2) → "1.41". */
export function decimalText(m: number, k: number): string {
  if (k === 0) return String(m);
  const s = String(m).padStart(k + 1, "0");
  return `${s.slice(0, -k)}.${s.slice(-k)}`;
}

/** (m / 10^k)^p exactly, as text: (141, 2, 2) → "1.9881". Trailing zeros stay (2.0164). */
export function powText(m: number, k: number, p: number): string {
  const num = BigInt(m) ** BigInt(p);
  const text = decimalText(Number(num), k * p);
  return text.includes(".") ? text.replace(/\.?0+$/, "") : text;
}

/** Zoom: the next digit d of the root of `n` with power `p`, at depth k (so far m = digits). */
export function nextDigit(n: number, p: number, m: number, k: number): number {
  // Largest d with ((10m + d) / 10^(k+1))^p ≤ n  ⇔  (10m + d)^p ≤ n · 10^((k+1)p)
  const limit = BigInt(n) * 10n ** BigInt((k + 1) * p);
  let d = 0;
  while (d < 9 && BigInt(10 * m + d + 1) ** BigInt(p) <= limit) d++;
  return d;
}

/** Position of a digit choice: below the root, above, or the right one. */
export function digitVerdict(n: number, p: number, m: number, k: number, d: number) {
  const right = nextDigit(n, p, m, k);
  return d === right ? "right" : d < right ? "low" : "high";
}

export const EI_ADD = ["E", "I", "I", "E"] as const; // EE, EI, IE, II
export const EI_MUL = ["E", "E", "E", "I"] as const;
export const EI_KEY = [...EI_ADD, ...EI_MUL].join("");

/** The learner's 8 cells as text of E, I and "-" for empty. */
export const eiEmpty = (): string => "--------";

export function eiWrongCells(cells: string): number[] {
  return [...EI_KEY].flatMap((c, i) => (cells[i] !== c ? [i] : []));
}

export interface Part {
  lo: number;
  hi: number;
  loClosed: boolean;
  hiClosed: boolean;
}

/** Text of a drawn interval, for the interval checker: "(−2, 5]", "(7, inf)". */
export function partText(p: Part, min: number, max: number): string {
  const lo = p.lo <= min ? "-inf" : String(p.lo);
  const hi = p.hi >= max ? "inf" : String(p.hi);
  const open = p.lo <= min || !p.loClosed ? "(" : "[";
  const close = p.hi >= max || !p.hiClosed ? ")" : "]";
  return `${open}${lo}, ${hi}${close}`;
}

export const partsText = (parts: Part[], min: number, max: number): string =>
  parts.map((p) => partText(p, min, max)).join(" U ");

/** Words for screen readers: "from minus 2, excluded, to 5, included". */
export function partWords(p: Part, min: number, max: number): string {
  const say = (n: number) => (n < 0 ? `minus ${-n}` : String(n));
  const left =
    p.lo <= min ? "no left end" : `from ${say(p.lo)}, ${p.loClosed ? "included" : "excluded"}`;
  const right =
    p.hi >= max ? "no right end" : `to ${say(p.hi)}, ${p.hiClosed ? "included" : "excluded"}`;
  return `${left}, ${right}`;
}

export const mediant = (a: number, b: number, c: number, d: number) => ({ n: a + c, d: b + d });
