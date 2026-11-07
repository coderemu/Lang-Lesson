/** Geometry of the number line and thermometer. Values come from FigCraft frames S01, S02, S03 (get_node). */
export const LINE_W = 342;
export const LINE_H = 120;
export const AXIS_Y = 70;
export const LINE_PAD = 21; // first tick: x = 21 + 30·i for −5…5

export const lineStep = (min: number, max: number): number => (LINE_W - 2 * LINE_PAD) / (max - min);
export const xOf = (v: number, min: number, max: number): number =>
  LINE_PAD + (v - min) * lineStep(min, max);

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** The integer nearest to an x position in the viewBox. */
export function valueAtX(x: number, min: number, max: number): number {
  return clamp(Math.round((x - LINE_PAD) / lineStep(min, max) + min), min, max);
}

/** U+2212 minus for display. */
export const fmt = (n: number): string => String(n).replace("-", "−");
/** Words for screen readers: "minus 2". */
export const spoken = (n: number): string => (n < 0 ? `minus ${-n}` : String(n));

/** Split "3 + (-5) = ?" at "?" for the live equation (S03). */
export function splitEquation(eq: string): { left: string; right: string } | null {
  const i = eq.indexOf("?");
  return i < 0 ? null : { left: eq.slice(0, i), right: eq.slice(i + 1) };
}

/** Number of hops between the start and the ring, and their direction. */
export function hopsBetween(
  start: number,
  ring: number,
): { n: number; dir: "left" | "right" | "none" } {
  const d = ring - start;
  return { n: Math.abs(d), dir: d < 0 ? "left" : d > 0 ? "right" : "none" };
}

/* Thermometer (S02): 342 × 260, tube x 158, ticks every 5. */
export const THERMO = { W: 342, H: 260, top: 20, span: 220, tubeX: 158, tubeW: 24 };
export const thermoY = (v: number, min: number, max: number): number =>
  THERMO.top + (max - v) * (THERMO.span / (max - min));
export function thermoValueAtY(y: number, min: number, max: number): number {
  return clamp(Math.round(max - (y - THERMO.top) / (THERMO.span / (max - min))), min, max);
}
