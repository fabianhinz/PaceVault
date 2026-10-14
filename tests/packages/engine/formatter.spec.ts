import { describe, it, expect } from 'vitest';
import { defaultFormatter } from '@/packages/engine/formatter.ts';

describe('pace formatter', () => {
  it('formats integer seconds correctly', () => {
    expect(defaultFormatter.pace(300)).toBe('5:00 /km');
    expect(defaultFormatter.pace(270)).toBe('4:30 /km');
  });

  it('rounds fractional seconds without producing :60', () => {
    // 299.7 → rounds to 300 → 5:00, NOT 4:60
    expect(defaultFormatter.pace(299.7)).toBe('5:00 /km');
    // 359.5 → rounds to 360 → 6:00, NOT 5:60
    expect(defaultFormatter.pace(359.5)).toBe('6:00 /km');
  });

  it('pads single-digit seconds with leading zero', () => {
    expect(defaultFormatter.pace(305)).toBe('5:05 /km');
    expect(defaultFormatter.pace(241)).toBe('4:01 /km');
  });

  it('handles very fast pace', () => {
    expect(defaultFormatter.pace(150)).toBe('2:30 /km');
  });
});
