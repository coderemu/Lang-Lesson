export interface PanSpec {
  x: number;
  units: number;
}
export interface BalanceSpec {
  left: PanSpec;
  right: PanSpec;
}
export interface Removed {
  l: number;
  r: number;
}

/** The hidden value of x that makes the two pans equal at the start. */
export function xValue(spec: BalanceSpec): number {
  const k = spec.left.x - spec.right.x;
  return k === 0 ? 0 : (spec.right.units - spec.left.units) / k;
}

export function weights(spec: BalanceSpec, removed: Removed): { left: number; right: number } {
  const x = xValue(spec);
  return {
    left: spec.left.x * x + spec.left.units - removed.l,
    right: spec.right.x * x + spec.right.units - removed.r,
  };
}

export const MAX_TILT = 8;

/** Beam angle in degrees. Positive = the right pan is down. At most 8° (DESIGN-SYSTEM §7). */
export function tiltDegrees(spec: BalanceSpec, removed: Removed): number {
  const w = weights(spec, removed);
  const diff = w.right - w.left;
  return Math.max(-MAX_TILT, Math.min(MAX_TILT, diff * 3));
}

export const isLevel = (spec: BalanceSpec, removed: Removed): boolean =>
  Math.abs(weights(spec, removed).left - weights(spec, removed).right) < 1e-9;

export function remaining(spec: BalanceSpec, removed: Removed) {
  return { left: spec.left.units - removed.l, right: spec.right.units - removed.r };
}

/** Only x is left on the x side: the learner can read the value of x. */
export const xAlone = (spec: BalanceSpec, removed: Removed): boolean =>
  remaining(spec, removed).left === 0 && spec.left.x > 0 && spec.right.x === 0;

export function describeBalance(spec: BalanceSpec, removed: Removed): string {
  const r = remaining(spec, removed);
  const left = [
    spec.left.x ? "x" : "",
    r.left ? `${r.left} ${r.left === 1 ? "cube" : "cubes"}` : "",
  ]
    .filter(Boolean)
    .join(" and ");
  const right = [
    spec.right.x ? "x" : "",
    r.right ? `${r.right} ${r.right === 1 ? "cube" : "cubes"}` : "",
  ]
    .filter(Boolean)
    .join(" and ");
  const state = isLevel(spec, removed)
    ? "The balance is level."
    : weights(spec, removed).left > weights(spec, removed).right
      ? "The left pan is heavier."
      : "The right pan is heavier.";
  return `Left pan: ${left || "empty"}. Right pan: ${right || "empty"}. ${state}`;
}
