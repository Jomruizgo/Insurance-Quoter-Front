import { clampPct } from './sparkline.utils';

describe('clampPct', () => {
  it('should return value within range unchanged', () => {
    expect(clampPct(65)).toBe(65);
    expect(clampPct(0)).toBe(0);
    expect(clampPct(100)).toBe(100);
  });

  it('should clamp values above 100 to 100', () => {
    expect(clampPct(150)).toBe(100);
    expect(clampPct(101)).toBe(100);
  });

  it('should clamp negative values to 0', () => {
    expect(clampPct(-10)).toBe(0);
    expect(clampPct(-1)).toBe(0);
  });
});
