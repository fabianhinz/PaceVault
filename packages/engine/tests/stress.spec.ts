import { describe, it, expect } from 'vite-plus/test';
import { calculateSummaryStress, intensityFactor, variabilityIndex } from '../src/stress.ts';

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

describe('calculateSummaryStress', () => {
  const thresholds = { restHr: 50, maxHr: 190, gender: 'male' as const, ftp: 250 };

  it('gives TSS from stored NP and FTP', () => {
    // 3600 s × 200 W × 0.8 / (250 W × 3600) × 100 = 64
    expect(
      calculateSummaryStress({ durationSec: 3600, avgHr: 150, normalizedPower: 200 }, thresholds),
    ).toEqual({ tss: 64, stressMethod: 'tss' });
  });

  it('falls back to TRIMP without an FTP', () => {
    const result = calculateSummaryStress(
      { durationSec: 3600, avgHr: 150, normalizedPower: 200 },
      { ...thresholds, ftp: undefined },
    );
    expect(result.stressMethod).toBe('trimp');
    expect(result.tss).toBeGreaterThan(0);
  });

  it('falls back to duration without an average HR', () => {
    expect(
      calculateSummaryStress({ durationSec: 3600 }, { ...thresholds, ftp: undefined }),
    ).toEqual({ tss: 30, stressMethod: 'duration' });
  });

  it('gives TSS 0 at NP 0 W', () => {
    expect(
      calculateSummaryStress({ durationSec: 3600, avgHr: 150, normalizedPower: 0 }, thresholds),
    ).toEqual({ tss: 0, stressMethod: 'tss' });
  });
});
