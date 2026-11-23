/** Logic for the Chapter 4 widgets (no React). */

/** Quadratic discriminant b² − 4ac. */
export const discriminant = (a: number, b: number, c: number): number => b * b - 4 * a * c;

/** Real roots of ax² + bx + c = 0, sorted. Empty when the discriminant is negative. */
export function realRoots(a: number, b: number, c: number): number[] {
  const d = discriminant(a, b, c);
  if (d < 0) return [];
  if (d === 0) return [-b / (2 * a)];
  const r = Math.sqrt(d);
  return [(-b - r) / (2 * a), (-b + r) / (2 * a)].sort((p, q) => p - q);
}

export type RootCount = 0 | 1 | 2;
export const rootCount = (d: number): RootCount => (d > 0 ? 2 : d === 0 ? 1 : 0);

/** Does a corner tile of side s complete the square for x² + bx? Only s = b/2. */
export const cornerFits = (s: number, b: number): boolean => 2 * s === b;
