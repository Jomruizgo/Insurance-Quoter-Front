export function clampPct(pct: number): number {
  return Math.min(100, Math.max(0, pct));
}
