/** Number parsing for learner input (FR-22). Returns null when the text is not a number. */
export function parseNumber(raw: string): number | null {
  const text = raw.replace(/[−–‒]/g, "-").replace(/\s+/g, "").replace(/,/g, ".");
  if (text === "") return null;
  const frac = /^([+-]?)(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(text);
  if (frac) {
    const den = Number(frac[3]);
    if (den === 0) return null;
    const value = Number(frac[2]) / den;
    return frac[1] === "-" ? -value : value;
  }
  if (/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(text)) return Number(text);
  return null;
}

const EPS = 1e-9;
export const sameNumber = (a: number, b: number): boolean => Math.abs(a - b) < EPS;
