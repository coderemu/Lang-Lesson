/** Pure helpers of the area model, square tiles and fraction strips. */
export const clampInt = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, Math.round(v)));

export const num = (spec: Record<string, unknown>, key: string, fallback: number): number => {
  const v = spec[key];
  return typeof v === "number" ? v : fallback;
};

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
export const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

/** Area model `distribute`: a × (l + r). */
export function distribute(a: number, left: number, total: number) {
  const right = total - left;
  return { a, left, right, areaLeft: a * left, areaRight: a * right, area: a * total };
}

export function distributeTex(a: number, left: number, right: number): string {
  return `${a}(${left} + ${right}) = ${a} \\cdot ${left} + ${a} \\cdot ${right} = ${a * left} + ${a * right} = ${a * (left + right)}`;
}

/** Area model `width-2`: N squares as 2 × n, plus 1 when N is odd. */
export function width2(n: number) {
  const half = Math.floor(n / 2);
  const odd = n % 2 === 1;
  return { n: half, odd, tex: odd ? `${n} = 2 \\cdot ${half} + 1` : `${n} = 2 \\cdot ${half}` };
}

/** Area model `doubling-strip`: start × factor^k, with its power form. */
export function doubling(start: number, factor: number, k: number) {
  const value = start * Math.pow(factor, k);
  const tex =
    k === 0
      ? `${fmtNumber(start)}`
      : factor >= 1
        ? `${factor}^{${k}} \\cdot ${fmtNumber(start)} = ${fmtNumber(value)}`
        : `\\dfrac{${fmtNumber(start)}}{${Math.round(1 / factor)}^{${k}}} = ${fmtNumber(value)}`;
  return { value, tex };
}

export function fmtNumber(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US").replace(/,/g, "\\,") : String(n);
}

/** Square tiles `expand`: side a + b. */
export function tiles(a: number, total: number) {
  const b = total - a;
  return { a, b, aa: a * a, ab: a * b, bb: b * b, area: total * total };
}

export function tilesTex(a: number, b: number): string {
  return `(${a} + ${b})^2 = ${a * a} + 2 \\cdot ${a * b} + ${b * b} = ${(a + b) * (a + b)}`;
}

/** Fraction strips `cut`: the strip is cut k times (each piece in two). */
export function cutPieces(num_: number, den: number, k: number) {
  const f = Math.pow(2, k);
  return { shaded: num_ * f, pieces: den * f };
}
export const maxCuts = (den: number, max: number): number =>
  Math.max(0, Math.floor(Math.log2(max / den)));

/** Fraction strips `add`: common denominator and sum. */
export function addFractions(n1: number, d1: number, n2: number, d2: number) {
  const d = lcm(d1, d2);
  const a = (n1 * d) / d1;
  const b = (n2 * d) / d2;
  return { d, a, b, sum: a + b };
}
