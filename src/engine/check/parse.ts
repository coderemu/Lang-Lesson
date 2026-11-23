/** Number parsing for learner input (FR-22). Returns null when the text is not a number. */
export function parseNumber(raw: string): number | null {
  let text = raw.replace(/[−–‒]/g, "-").replace(/\s+/g, "");
  // Thousands commas ("5,120", "4,00,000") are grouping. Any other comma is a decimal comma ("1,5").
  text = /^[+-]?\d{1,3}(,\d{2,3})*,\d{3}(\.\d+)?$/.test(text)
    ? text.replace(/,/g, "")
    : text.replace(/,/g, ".");
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
