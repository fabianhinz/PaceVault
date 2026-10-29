import { describe, it, expect } from 'vite-plus/test';
import {
  stressFromRecords,
  stressFromSummary,
  intensityFactor,
  thresholdHrRatio,
  variabilityIndex,
} from '../src/stress.ts';
import type { SessionRecord } from '../src/types.ts';
import { createMockSessionRecord } from '../../testing/src/records.ts';

describe('stress', () => {
  describe(intensityFactor.name, () => {
    it('divides NP by FTP', () => {
      expect(intensityFactor({ np: 209, ftp: 265 })).toBeCloseTo(0.79, 2);
    });

    it('is undefined without a valid FTP', () => {
      expect(intensityFactor({ np: 209, ftp: 0 })).toBeUndefined();
    });
  });

  describe(variabilityIndex.name, () => {
    it('divides NP by average power', () => {
      expect(variabilityIndex({ np: 209, avgPower: 180 })).toBeCloseTo(1.16, 2);
    });

    it('is undefined at 0 W average power', () => {
      expect(variabilityIndex({ np: 209, avgPower: 0 })).toBeUndefined();
    });
  });

  describe(stressFromSummary.name, () => {
    const thresholds = { restHr: 50, maxHr: 190, gender: 'male' as const, ftp: 250 };

    it('gives TSS from stored NP and FTP', () => {
      expect(
        stressFromSummary({
          sport: 'cycling',
          summary: { durationSec: 3600, avgHr: 150, normalizedPower: 200 },
          thresholds,
        }),
      ).toEqual({ tss: 64, stressMethod: 'tss' });
    });

    it('falls back to TRIMP without an FTP', () => {
      const result = stressFromSummary({
        sport: 'cycling',
        summary: { durationSec: 3600, avgHr: 150, normalizedPower: 200 },
        thresholds: { ...thresholds, ftp: undefined },
      });
      expect(result.stressMethod).toBe('trimp');
      expect(result.tss).toBeGreaterThan(0);
    });

    it('falls back to duration without an average HR', () => {
      expect(
        stressFromSummary({
          sport: 'cycling',
          summary: { durationSec: 3600 },
          thresholds: { ...thresholds, ftp: undefined },
        }),
      ).toEqual({ tss: 30, stressMethod: 'duration' });
    });

    it('gives TSS 0 at NP 0 W', () => {
      expect(
        stressFromSummary({
          sport: 'cycling',
          summary: { durationSec: 3600, avgHr: 150, normalizedPower: 0 },
          thresholds,
        }),
      ).toEqual({ tss: 0, stressMethod: 'tss' });
    });

    describe('runs', () => {
      it('never scores TSS for a run, even with NP and FTP', () => {
        const result = stressFromSummary({
          sport: 'running',
          summary: { durationSec: 3600, avgHr: 150, normalizedPower: 200 },
          thresholds: { restHr: 50, maxHr: 190, gender: 'male', ftp: 250 },
        });
        expect(result.stressMethod).toBe('trimp');
      });
    });
  });

  const hrRecords = (seconds: number, hr: (i: number) => number | undefined): SessionRecord[] =>
    Array.from({ length: seconds + 1 }, (_, i) => {
      const record = createMockSessionRecord({ timestamp: i, power: 200 });
      const value = hr(i);
      if (value !== undefined) record.hr = value;
      return record;
    });

  describe(thresholdHrRatio.name, () => {
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

  describe(stressFromRecords.name, () => {
    const thresholds = { restHr: 50, maxHr: 190, gender: 'male' as const, ftp: 250 };

    it('scores a ride with NP and FTP as TSS', () => {
      const result = stressFromRecords({
        sport: 'cycling',
        records: hrRecords(3600, () => 150),
        summary: { durationSec: 3600 },
        thresholds,
      });
      expect(result).toMatchObject({ tss: 64, stressMethod: 'tss', normalizedPower: 200 });
    });

    it('scores a run with NP and FTP from heart rate', () => {
      const result = stressFromRecords({
        sport: 'running',
        records: hrRecords(3600, () => 150),
        summary: { durationSec: 3600 },
        thresholds,
      });
      expect(result.stressMethod).toBe('trimp');
      expect(result.normalizedPower).toBe(200);
    });

    it('scores one hour at threshold HR as 100', () => {
      const records = hrRecords(3600, () => 165);
      const summary = { durationSec: 3600 };
      const withThreshold = { ...thresholds, thresholdHr: 165 };

      expect(
        stressFromRecords({ sport: 'running', records, summary, thresholds: withThreshold }).tss,
      ).toBe(100);
    });

    it('scores one hour at the estimated 88% of HR reserve as 100 without a threshold HR', () => {
      const records = hrRecords(3600, () => 173.2);

      expect(
        stressFromRecords({ sport: 'running', records, summary: { durationSec: 3600 }, thresholds })
          .tss,
      ).toBe(100);
    });

    it('clamps heart rate above max instead of scoring 0', () => {
      const records = hrRecords(600, () => 200);
      const result = stressFromRecords({
        sport: 'running',
        records,
        summary: { durationSec: 600 },
        thresholds,
      });
      const atMax = stressFromRecords({
        sport: 'running',
        records: hrRecords(600, () => 190),
        summary: { durationSec: 600 },
        thresholds,
      });
      expect(result.tss).toBeGreaterThan(0);
      expect(result.tss).toBe(atMax.tss);
    });

    it('skips pauses longer than 10 s', () => {
      const steady = hrRecords(1800, () => 160);
      const paused = steady.map((r, i) => {
        if (i < 900) return r;
        return createMockSessionRecord({ ...r, timestamp: r.timestamp + 600 });
      });
      const summary = { durationSec: 1800 };

      expect(
        stressFromRecords({ sport: 'running', records: paused, summary, thresholds }).tss,
      ).toBeCloseTo(
        stressFromRecords({ sport: 'running', records: steady, summary, thresholds }).tss,
        0,
      );
    });

    it('falls back to the average HR, then to duration, without HR records', () => {
      const records = hrRecords(3600, () => undefined);

      const fromAverage = stressFromRecords({
        sport: 'running',
        records,
        summary: { durationSec: 3600, avgHr: 150 },
        thresholds,
      });
      expect(fromAverage.stressMethod).toBe('trimp');
      expect(fromAverage.tss).toBeGreaterThan(0);
      expect(
        stressFromRecords({
          sport: 'running',
          records,
          summary: { durationSec: 3600 },
          thresholds,
        }),
      ).toEqual({
        tss: 30,
        stressMethod: 'duration',
        normalizedPower: 200,
      });
    });

    it('falls back to duration when max HR is not above rest HR', () => {
      const result = stressFromRecords({
        sport: 'running',
        records: hrRecords(3600, () => 150),
        summary: { durationSec: 3600, avgHr: 150 },
        thresholds: { ...thresholds, maxHr: 50 },
      });
      expect(result.stressMethod).toBe('duration');
    });
  });
});
