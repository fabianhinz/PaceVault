import { describe, it, expect } from 'vitest';
import { intensityFactor, variabilityIndex } from '@/packages/engine/stress.ts';

describe('intensityFactor', () => {
  it('divides NP by FTP', () => {
    expect(intensityFactor(209, 265)).toBeCloseTo(0.79, 2);
  });

  it('is undefined without a valid FTP', () => {
    expect(intensityFactor(209, 0)).toBeUndefined();
  });
});

describe('variabilityIndex', () => {
  it('divides NP by average power', () => {
    expect(variabilityIndex(209, 180)).toBeCloseTo(1.16, 2);
  });

  it('is undefined at 0 W average power', () => {
    expect(variabilityIndex(209, 0)).toBeUndefined();
  });
});
