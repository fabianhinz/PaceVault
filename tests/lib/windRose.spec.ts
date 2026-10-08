import { describe, it, expect } from 'vitest';
import { windRoseShares } from '@/lib/windRose.ts';

describe('windRoseShares', () => {
  it('splits moving time into sectors that sum to 100 %', () => {
    const shares = windRoseShares([
      undefined,
      { angle: 0, seconds: 30 },
      { angle: 90, seconds: 10 },
      { angle: -90, seconds: 10 },
      { angle: -180, seconds: 50 },
    ]);
    expect(shares).not.toBeNull();
    if (shares === null) return;
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1, 10);
    expect(shares[0]).toBeCloseTo(0.3);
    expect(shares[4]).toBeCloseTo(0.1);
    expect(shares[12]).toBeCloseTo(0.1);
    expect(shares[8]).toBeCloseTo(0.5);
  });

  it('returns null without classified moving time', () => {
    expect(windRoseShares([undefined, undefined])).toBeNull();
  });
});
