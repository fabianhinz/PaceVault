import { describe, it, expect } from 'vite-plus/test';
import {
  calculateSessionStress,
  calculateSummaryStress,
  intensityFactor,
  thresholdHrRatio,
  variabilityIndex,
} from '../src/stress.ts';
import type { SessionRecord } from '../src/types.ts';

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
      calculateSummaryStress(
        'cycling',
        { durationSec: 3600, avgHr: 150, normalizedPower: 200 },
        thresholds,
      ),
    ).toEqual({ tss: 64, stressMethod: 'tss' });
  });

  it('falls back to TRIMP without an FTP', () => {
    const result = calculateSummaryStress(
      'cycling',
      { durationSec: 3600, avgHr: 150, normalizedPower: 200 },
      { ...thresholds, ftp: undefined },
    );
    expect(result.stressMethod).toBe('trimp');
    expect(result.tss).toBeGreaterThan(0);
  });

  it('falls back to duration without an average HR', () => {
    expect(
      calculateSummaryStress('cycling', { durationSec: 3600 }, { ...thresholds, ftp: undefined }),
    ).toEqual({ tss: 30, stressMethod: 'duration' });
  });

  it('gives TSS 0 at NP 0 W', () => {
    expect(
      calculateSummaryStress(
        'cycling',
        { durationSec: 3600, avgHr: 150, normalizedPower: 0 },
        thresholds,
      ),
    ).toEqual({ tss: 0, stressMethod: 'tss' });
  });
});

const hrRecords = (seconds: number, hr: (i: number) => number | undefined): SessionRecord[] =>
  Array.from({ length: seconds + 1 }, (_, i) => {
    const record: SessionRecord = { timestamp: i, power: 200 };
    const value = hr(i);
    if (value !== undefined) record.hr = value;
    return record;
  });

describe('thresholdHrRatio', () => {
  it('estimates 88% of HR reserve without a threshold HR', () => {
    expect(thresholdHrRatio({ restHr: 50, maxHr: 190 })).toBe(0.88);
  });

  it('places the threshold HR in the HR reserve and clamps it inside (0, 1)', () => {
    expect(thresholdHrRatio({ restHr: 50, maxHr: 190, thresholdHr: 155 })).toBeCloseTo(0.75, 5);
    const above = thresholdHrRatio({ restHr: 50, maxHr: 190, thresholdHr: 200 });
    const below = thresholdHrRatio({ restHr: 50, maxHr: 190, thresholdHr: 40 });
    expect(above).toBeLessThan(1);
    expect(below).toBeGreaterThan(0);
  });
});

describe('calculateSessionStress', () => {
  const thresholds = { restHr: 50, maxHr: 190, gender: 'male' as const, ftp: 250 };

  it('scores a ride with NP and FTP as TSS', () => {
    const result = calculateSessionStress(
      'cycling',
      hrRecords(3600, () => 150),
      { durationSec: 3600 },
      thresholds,
    );
    expect(result).toMatchObject({ tss: 64, stressMethod: 'tss', normalizedPower: 200 });
  });

  it('scores a run with NP and FTP from heart rate', () => {
    const result = calculateSessionStress(
      'running',
      hrRecords(3600, () => 150),
      { durationSec: 3600 },
      thresholds,
    );
    expect(result.stressMethod).toBe('trimp');
    expect(result.normalizedPower).toBe(200);
  });

  it('scores one hour at threshold HR as 100', () => {
    const records = hrRecords(3600, () => 165);
    const summary = { durationSec: 3600 };
    const withThreshold = { ...thresholds, thresholdHr: 165 };

    expect(calculateSessionStress('running', records, summary, withThreshold).tss).toBe(100);
  });

  it('scores one hour at the estimated 88% of HR reserve as 100 without a threshold HR', () => {
    // 50 + 0.88 × 140 = 173.2 bpm
    const records = hrRecords(3600, () => 173.2);

    expect(calculateSessionStress('running', records, { durationSec: 3600 }, thresholds).tss).toBe(
      100,
    );
  });

  it('clamps heart rate above max instead of scoring 0', () => {
    const records = hrRecords(600, () => 200);
    const result = calculateSessionStress('running', records, { durationSec: 600 }, thresholds);
    const atMax = calculateSessionStress(
      'running',
      hrRecords(600, () => 190),
      { durationSec: 600 },
      thresholds,
    );
    expect(result.tss).toBeGreaterThan(0);
    expect(result.tss).toBe(atMax.tss);
  });

  it('skips pauses longer than 10 s', () => {
    const steady = hrRecords(1800, () => 160);
    const paused = steady.map((r, i) => {
      if (i < 900) return r;
      return { ...r, timestamp: r.timestamp + 600 };
    });
    const summary = { durationSec: 1800 };

    expect(calculateSessionStress('running', paused, summary, thresholds).tss).toBeCloseTo(
      calculateSessionStress('running', steady, summary, thresholds).tss,
      0,
    );
  });

  it('falls back to the average HR, then to duration, without HR records', () => {
    const records = hrRecords(3600, () => undefined);

    const fromAverage = calculateSessionStress(
      'running',
      records,
      { durationSec: 3600, avgHr: 150 },
      thresholds,
    );
    expect(fromAverage.stressMethod).toBe('trimp');
    expect(fromAverage.tss).toBeGreaterThan(0);
    expect(calculateSessionStress('running', records, { durationSec: 3600 }, thresholds)).toEqual({
      tss: 30,
      stressMethod: 'duration',
      normalizedPower: 200,
    });
  });

  it('falls back to duration when max HR is not above rest HR', () => {
    const result = calculateSessionStress(
      'running',
      hrRecords(3600, () => 150),
      { durationSec: 3600, avgHr: 150 },
      { ...thresholds, maxHr: 50 },
    );
    expect(result.stressMethod).toBe('duration');
  });
});

describe('calculateSummaryStress for runs', () => {
  it('never scores TSS for a run, even with NP and FTP', () => {
    const result = calculateSummaryStress(
      'running',
      { durationSec: 3600, avgHr: 150, normalizedPower: 200 },
      { restHr: 50, maxHr: 190, gender: 'male', ftp: 250 },
    );
    expect(result.stressMethod).toBe('trimp');
  });
});
