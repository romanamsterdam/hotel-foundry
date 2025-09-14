// src/lib/finance/units.ts
/** Accepts 70, 0.70, or 70% (as 70), and returns a clean 0..1 fraction. */
export function toFraction(x: number | undefined | null): number {
  if (x == null || isNaN(x as any)) return 0;
  const v = Number(x);
  return v > 1.0001 ? v / 100 : Math.max(0, Math.min(1, v));
}

/** Format a 0..1 fraction as percentage (e.g., 0.70 -> "70.0%") */
export function formatOccupancyPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}